import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import { CreateBarCrawlModal } from '../components/modals/CreateBarCrawlModal';
import { BarCrawlDetailsModal } from '../components/modals/BarCrawlDetailsModal';
import { AvatarImage } from '../components/avatars/AvatarImage';

interface CheckIn {
  check_in_id: string;
  message: string;
  created_at: string;
  user_id: string;
  user_display_name: string;
  user_username: string;
  user_avatar_url: string | null;
  bar_id: string;
  bar_name: string;
  like_count: number;
  user_has_liked: boolean;
}

interface BarCrawl {
  id: string;
  name: string;
  description: string;
  host_id: string;
  host_name: string;
  host_avatar_url: string;
  start_date: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  is_private: boolean;
  invite_code?: string;
  participant_count: number;
  stops: Array<{
    id: string;
    bar_id: string;
    bar_name: string;
    order_index: number;
    planned_start_time: string;
    planned_end_time: string;
    travel_time_to_next?: number;
  }>;
  user_role?: 'host' | 'participant';
}

const SocialHubScreen: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'crawls'>('feed');
  const [barCrawls, setBarCrawls] = useState<BarCrawl[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateCrawlModal, setShowCreateCrawlModal] = useState(false);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [selectedCrawl, setSelectedCrawl] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const loadBarCrawls = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: crawlsData, error: crawlsError } = await supabase
        .rpc('get_user_bar_crawls', {
          p_user_id: user?.profile?.id
        });

      if (crawlsError) throw crawlsError;

      const now = new Date('2025-01-16T15:52:57-05:00');  // Using provided current time
      const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
      
      // Process each crawl to determine if it's ongoing
      const processedCrawls = crawlsData
        .filter(crawl => crawl.status !== 'cancelled') // Filter out cancelled crawls first
        .map(crawl => {
          const startTime = new Date(new Date(crawl.start_date).getTime() + new Date().getTimezoneOffset() * 60000);
          const lastStop = crawl.stops.length > 0 
            ? crawl.stops.reduce((latest, stop) => {
                const stopEndTime = new Date(new Date(stop.planned_end_time).getTime() + new Date().getTimezoneOffset() * 60000);
                const latestEndTime = new Date(new Date(latest.planned_end_time).getTime() + new Date().getTimezoneOffset() * 60000);
                return stopEndTime > latestEndTime ? stop : latest;
              }, crawl.stops[0])
            : null;
          const endTime = lastStop 
            ? new Date(new Date(lastStop.planned_end_time).getTime() + new Date().getTimezoneOffset() * 60000)
            : startTime;
          
          const isOngoing = nowLocal >= startTime && nowLocal <= endTime;
          const isPast = endTime < nowLocal;
          
          return {
            ...crawl,
            isOngoing,
            isPast,
            endTime,
            startTime,
            status: isOngoing ? 'active' : crawl.status
          };
        });

      // Filter out past crawls and sort by status and start date
      const activeCrawls = processedCrawls
        .filter(crawl => {
          // Keep only if crawl is ongoing now OR starts in the future
          return crawl.isOngoing || (!crawl.isPast && crawl.startTime > nowLocal);
        })
        .sort((a, b) => {
          // Sort ongoing crawls to the top
          if (a.isOngoing && !b.isOngoing) return -1;
          if (!a.isOngoing && b.isOngoing) return 1;
          
          // Then sort by start date
          return a.startTime.getTime() - b.startTime.getTime();
        });

      // Apply search filter if needed
      const filteredCrawls = searchQuery
        ? activeCrawls.filter(crawl => 
            crawl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            crawl.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : activeCrawls;

      setBarCrawls(filteredCrawls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bar crawls');
      console.error('Error loading bar crawls:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBarCrawls();
    setRefreshing(false);
  }, [searchQuery]);

  useEffect(() => {
    loadBarCrawls();
  }, [searchQuery]);

  const fetchCheckIns = useCallback(async () => {
    try {
      if (!user?.profile?.id) return;

      const { data, error } = await supabase
        .rpc('get_friends_checkins', {
          p_user_id: user.profile.id
        });

      if (error) throw error;
      setCheckIns(data || []);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      Alert.alert('Error', 'Failed to load check-ins. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.profile?.id]);

  const handleLikeCheckIn = async (checkInId: string) => {
    try {
      if (!user?.profile?.id) return;

      const { error } = await supabase
        .from('check_in_likes')
        .upsert({
          check_in_id: checkInId,
          user_id: user.profile.id
        });

      if (error) throw error;
      
      // Optimistically update the UI
      setCheckIns(prev => 
        prev.map(checkIn => 
          checkIn.check_in_id === checkInId
            ? {
                ...checkIn,
                like_count: checkIn.user_has_liked ? checkIn.like_count - 1 : checkIn.like_count + 1,
                user_has_liked: !checkIn.user_has_liked
              }
            : checkIn
        )
      );
    } catch (error) {
      console.error('Error liking check-in:', error);
      Alert.alert('Error', 'Failed to like check-in. Please try again.');
    }
  };

  const renderCheckIn = (checkIn: CheckIn) => (
    <View style={styles.checkInCard} key={checkIn.check_in_id}>
      <View style={styles.checkInHeader}>
        <AvatarImage 
          avatarUrl={checkIn.user_avatar_url || 'avatar://alien'} 
          size={40}
          style={styles.avatar} 
        />
        <View style={styles.checkInHeaderText}>
          <Text style={styles.userName}>{checkIn.user_display_name}</Text>
          <Text style={styles.timestamp}>
            {formatDistanceToNow(new Date(checkIn.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
      
      <View style={styles.checkInContent}>
        <View style={styles.locationTag}>
          <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.primary} />
          <Text style={styles.barName}>{checkIn.bar_name}</Text>
        </View>
        <Text style={styles.mood}>{checkIn.message}</Text>
      </View>

      <View style={styles.checkInActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLikeCheckIn(checkIn.check_in_id)}
        >
          <Ionicons 
            name={checkIn.user_has_liked ? "heart" : "heart-outline"} 
            size={24} 
            color={checkIn.user_has_liked ? theme.colors.primary : "#666"} 
          />
          <Text style={styles.actionText}>{checkIn.like_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBarCrawls = () => {
    if (loading) {
      return <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />;
    }

    if (barCrawls.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No bar crawls found</Text>
        </View>
      );
    }

    return (
      <View style={styles.crawlsList}>
        {barCrawls.map((crawl) => (
          <TouchableOpacity
            key={crawl.id}
            style={[styles.crawlCard, { backgroundColor: theme.colors.card }]}
            onPress={() => handleCrawlPress(crawl)}
          >
            <View style={styles.crawlHeader}>
              <AvatarImage avatarUrl={crawl.host_avatar_url} size={40} style={styles.avatar} />
              <View style={styles.crawlHeaderText}>
                <Text style={[styles.crawlName, { color: theme.colors.text }]} numberOfLines={1}>
                  {crawl.name}
                </Text>
                <Text style={[styles.hostName, { color: theme.colors.textSecondary }]}>
                  by {crawl.host_name}
                </Text>
              </View>
            </View>

            {crawl.description && (
              <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                {crawl.description}
              </Text>
            )}

            <View style={styles.crawlDetails}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {crawl.participant_count} {crawl.participant_count === 1 ? 'person' : 'people'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="map-marker-path" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {crawl.stops.length} {crawl.stops.length === 1 ? 'stop' : 'stops'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                  {formatDate(crawl.start_date)}
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(crawl.status, crawl.isOngoing) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(crawl.status, crawl.isOngoing) }]}>
                  {crawl.isOngoing ? 'Ongoing' : formatStatus(crawl.status, crawl.isOngoing)}
                </Text>
              </View>

              {crawl.user_role && (
                <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Text style={[styles.roleText, { color: theme.colors.primary }]}>
                    {crawl.user_role === 'host' ? 'You\'re hosting' : 'You\'re going'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBarCrawlSection = () => (
    <View style={styles.crawlsContainer}>
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search bar crawls..."
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity
          style={[styles.joinByCodeButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowJoinByCodeModal(true)}
        >
          <MaterialIcons name="qr-code" size={20} color="#fff" />
          <Text style={styles.joinByCodeText}>Join by Code</Text>
        </TouchableOpacity>
      </View>

      {renderBarCrawls()}
    </View>
  );

  const getStatusColor = (status: string, isOngoing: boolean) => {
    if (isOngoing) return '#007AFF';  // Blue for ongoing
    
    switch (status) {
      case 'planned':
        return '#4CD964';  // Green for planned
      case 'completed':
        return '#8E8E93';  // Gray for completed
      case 'cancelled':
        return '#FF3B30';  // Red for cancelled
      default:
        return '#8E8E93';
    }
  };

  const formatStatus = (status: string, isOngoing: boolean) => {
    if (isOngoing) return 'Ongoing';
    
    switch (status) {
      case 'planned':
        return 'Planned';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const formatUpcoming = (date: Date) => {
    const days = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const handleCreateCrawl = (crawlData: any) => {
    // TODO: Implement crawl creation
    console.log('Creating crawl:', crawlData);
  };

  const handleCrawlPress = (crawl: BarCrawl) => {
    setSelectedCrawl(crawl);
  };

  const handleJoinByCode = (code: string) => {
    // TODO: Implement joining by code
    console.log('Joining crawl with code:', code);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    tabContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    tab: {
      flex: 1,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#666',
    },
    activeTabText: {
      color: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    feedContainer: {
      padding: 15,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: '#666',
    },
    crawlsContainer: {
      padding: 15,
    },
    crawlCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    crawlHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    crawlHeaderText: {
      flex: 1,
      marginLeft: 12,
    },
    crawlName: {
      fontSize: 18,
      fontWeight: '600',
    },
    hostName: {
      fontSize: 14,
      marginTop: 2,
    },
    description: {
      fontSize: 14,
      marginBottom: 12,
    },
    crawlDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: 14,
      marginLeft: 4,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: {
      fontSize: 12,
      fontWeight: '500',
    },
    checkInCard: {
      backgroundColor: '#fff',
      borderRadius: 15,
      marginBottom: 15,
      padding: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    checkInHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    checkInHeaderText: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: 14,
      color: '#666',
    },
    checkInContent: {
      marginBottom: 10,
    },
    locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    barName: {
      fontSize: 15,
      fontWeight: '500',
      marginLeft: 5,
    },
    mood: {
      fontSize: 16,
      marginVertical: 5,
    },
    checkInActions: {
      flexDirection: 'row',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    actionText: {
      marginLeft: 5,
      color: '#666',
    },
    searchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: '#000',
    },
    joinByCodeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
    },
    joinByCodeText: {
      marginLeft: 8,
      color: '#fff',
      fontWeight: '600',
      fontSize: 15,
    },
    noCrawlsContainer: {
      padding: 20,
      alignItems: 'center',
    },
    noCrawlsText: {
      fontSize: 16,
      color: '#666',
    },
    checkInFab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: 30,
      padding: 10,
      elevation: 5,
    },
    fabGradient: {
      padding: 10,
      borderRadius: 30,
    },
    createCrawlFab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: 30,
      padding: 10,
      elevation: 5,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
      marginBottom: 16,
    },
    codeInput: {
      borderWidth: 2,
      borderColor: '#eee',
      borderRadius: 12,
      padding: 16,
      fontSize: 24,
      textAlign: 'center',
      letterSpacing: 4,
      marginBottom: 24,
      color: '#000',
      backgroundColor: '#f8f8f8',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    modalButton: {
      flex: 1,
      borderRadius: 25,
      paddingVertical: 16,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    creatorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
    },
    crawlInfo: {
      flex: 1,
    },
    crawlName: {
      fontSize: 16,
      fontWeight: '600',
    },
    creatorName: {
      fontSize: 14,
      color: '#666',
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    statusText: {
      fontSize: 14,
      color: '#fff',
    },
    crawlDetails: {
      marginBottom: 16,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    detailText: {
      marginLeft: 6,
      fontSize: 14,
      color: '#666',
    },
    roleContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: '#f5f5f5',
      borderRadius: 10,
      marginBottom: 16,
    },
    roleText: {
      fontSize: 14,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 16,
      color: '#666',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 25,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    retryButtonText: {
      fontSize: 16,
      color: '#fff',
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: '#666',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: '#666',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'feed' ? theme.colors.primary : '#666' },
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crawls' && styles.activeTab]}
          onPress={() => setActiveTab('crawls')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'crawls' ? theme.colors.primary : '#666' },
            ]}
          >
            Bar Crawls
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {activeTab === 'feed' ? (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : checkIns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No check-ins from friends yet</Text>
            </View>
          ) : (
            checkIns.map(renderCheckIn)
          )}
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderBarCrawlSection()}
        </ScrollView>
      )}

      {/* Floating Action Buttons */}
      {activeTab === 'feed' ? (
        <TouchableOpacity 
          style={styles.checkInFab}
          onPress={() => {/* TODO: Open check-in modal */}}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons name="map-marker-plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.createCrawlFab}
          onPress={() => setShowCreateCrawlModal(true)}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.fabGradient}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Modals */}
      <CreateBarCrawlModal
        visible={showCreateCrawlModal}
        onClose={() => setShowCreateCrawlModal(false)}
        onSuccess={() => {
          setShowCreateCrawlModal(false);
          // fetchBarCrawls();
        }}
      />
      
      <BarCrawlDetailsModal
        visible={!!selectedCrawl}
        crawlId={selectedCrawl?.id}
        onClose={() => setSelectedCrawl(null)}
        onUpdate={() => {
          loadBarCrawls();
        }}
      />

      <Modal
        visible={showJoinByCodeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinByCodeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Bar Crawl</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter invite code"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#666' }]}
                onPress={() => setShowJoinByCodeModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  // TODO: Implement code validation
                  setShowJoinByCodeModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SocialHubScreen;
