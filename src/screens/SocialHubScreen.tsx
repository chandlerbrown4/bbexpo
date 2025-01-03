import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  SafeAreaView,
  Platform,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

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

// Keep existing DUMMY_CRAWLS data
const DUMMY_CRAWLS = [
  {
    id: '1',
    name: "Downtown Bar Hop",
    creator: {
      name: 'Alex Thompson',
      avatarUrl: 'https://placekitten.com/102/102',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    participants: 12,
    maxParticipants: 20,
    stops: [
      { name: "O'Malley's Pub", duration: 45 },
      { name: 'The Tipsy Crow', duration: 45 },
      { name: 'Moonlight Lounge', duration: 45 },
    ],
    status: 'upcoming',
  },
  {
    id: '2',
    name: "Thirsty Thursday Crawl",
    creator: {
      name: 'Emma Wilson',
      avatarUrl: 'https://placekitten.com/103/103',
    },
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
    participants: 8,
    maxParticipants: 15,
    stops: [
      { name: 'The Brew House', duration: 60 },
      { name: 'Hop & Scotch', duration: 60 },
      { name: 'Last Call', duration: 60 },
    ],
    status: 'upcoming',
  },
];

const SocialHubScreen: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'crawls'>('feed');
  const [showNewCrawlModal, setShowNewCrawlModal] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCheckIns();
  }, [fetchCheckIns]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  const formatUpcoming = (date: Date) => {
    const days = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const renderCheckIn = (checkIn: CheckIn) => (
    <View style={styles.checkInCard} key={checkIn.check_in_id}>
      <View style={styles.checkInHeader}>
        <Image 
          source={{ uri: checkIn.user_avatar_url || 'https://placekitten.com/100/100' }} 
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

  const renderCrawl = (crawl: typeof DUMMY_CRAWLS[0]) => (
    <TouchableOpacity style={styles.crawlCard} key={crawl.id}>
      <View style={styles.crawlHeader}>
        <View style={styles.crawlInfo}>
          <Text style={styles.crawlName}>{crawl.name}</Text>
          <View style={styles.crawlCreator}>
            <Image source={{ uri: crawl.creator.avatarUrl }} style={styles.creatorAvatar} />
            <Text style={styles.creatorName}>by {crawl.creator.name}</Text>
          </View>
        </View>
        {crawl.status === 'active' && (
          <View style={[styles.statusBadge, styles.activeBadge]}>
            <Text style={styles.statusText}>Active Now</Text>
          </View>
        )}
      </View>

      <View style={styles.crawlDetails}>
        <View style={styles.crawlStat}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.crawlStatText}>
            {crawl.status === 'active' ? 'In Progress' : formatUpcoming(crawl.date)}
          </Text>
        </View>
        <View style={styles.crawlStat}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.crawlStatText}>
            {crawl.participants}/{crawl.maxParticipants} joined
          </Text>
        </View>
      </View>

      <View style={styles.stopsContainer}>
        {crawl.stops.map((stop, index) => (
          <View key={index} style={styles.stopItem}>
            <View style={[styles.stopDot]} />
            <Text style={styles.stopName}>
              {stop.name} ({stop.duration}min)
            </Text>
          </View>
        ))}
      </View>

      {crawl.status === 'upcoming' && (
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Join Crawl</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
        {activeTab === 'crawls' && (
          <TouchableOpacity 
            style={styles.newCrawlButton}
            onPress={() => setShowNewCrawlModal(true)}
          >
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Friends Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'crawls' && styles.activeTab]}
          onPress={() => setActiveTab('crawls')}
        >
          <Text style={[styles.tabText, activeTab === 'crawls' && styles.activeTabText]}>
            Bar Crawls
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === 'feed' ? (
          <View style={styles.feedContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : checkIns.length > 0 ? (
              checkIns.map(renderCheckIn)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No check-ins from friends yet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.crawlsContainer}>
            {DUMMY_CRAWLS.map(renderCrawl)}
          </View>
        )}
      </ScrollView>

      {activeTab === 'feed' && (
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
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newCrawlButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
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
  crawlsContainer: {
    padding: 15,
  },
  crawlCard: {
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
  crawlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  crawlInfo: {
    flex: 1,
  },
  crawlName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  crawlCreator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
  },
  creatorName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  crawlDetails: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  crawlStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  crawlStatText: {
    marginLeft: 5,
    color: '#666',
  },
  stopsContainer: {
    marginBottom: 15,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  stopName: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkInFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default SocialHubScreen;
