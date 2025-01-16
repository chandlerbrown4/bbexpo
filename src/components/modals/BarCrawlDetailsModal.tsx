import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { format, isValid, parseISO } from 'date-fns';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { AvatarImage } from '../avatars/AvatarImage';

interface BarCrawlDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  crawlId: string;
  onUpdate?: () => void;
}

export const BarCrawlDetailsModal: React.FC<BarCrawlDetailsModalProps> = ({
  visible,
  onClose,
  crawlId,
  onUpdate,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'participants'>('details');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawl, setCrawl] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    if (visible && crawlId) {
      loadCrawlDetails();
    }
  }, [visible, crawlId]);

  const loadCrawlDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load bar crawl details with host info
      const { data: crawlData, error: crawlError } = await supabase
        .from('bar_crawls')
        .select(`
          *,
          host:host_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('id', crawlId)
        .single();

      if (crawlError) throw crawlError;

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('bar_crawl_participants')
        .select(`
          *,
          user_profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('bar_crawl_id', crawlId);

      if (participantsError) throw participantsError;

      // Load stops
      const { data: stopsData, error: stopsError } = await supabase
        .from('bar_crawl_stops')
        .select('*, bars(*)')
        .eq('bar_crawl_id', crawlId)
        .order('order_index', { ascending: true });

      if (stopsError) throw stopsError;

      setCrawl(crawlData);
      setParticipants(participantsData);
      setStops(stopsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bar crawl details');
      console.error('Error loading bar crawl details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCrawl = async () => {
    if (!user?.profile?.id) return;

    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('bar_crawl_participants')
        .insert({
          bar_crawl_id: crawlId,
          user_id: user.profile.id,
          status: 'joined'
        });

      if (error) throw error;

      await loadCrawlDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      Alert.alert('Error', 'Failed to join bar crawl');
      console.error('Error joining bar crawl:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveBarCrawl = async () => {
    if (!user?.profile?.id) return;
    
    try {
      setLoading(true);
      
      if (crawl?.host_id === user.profile.id) {
        // Host is leaving - set bar crawl status to cancelled
        const { error: updateError } = await supabase
          .from('bar_crawls')
          .update({ status: 'cancelled' })
          .eq('id', crawlId);
          
        if (updateError) throw updateError;
        
        onClose();
        if (onUpdate) onUpdate();
      } else {
        // Regular participant leaving
        const { error: leaveError } = await supabase
          .from('bar_crawl_participants')
          .delete()
          .eq('bar_crawl_id', crawlId)
          .eq('user_id', user.profile.id);
          
        if (leaveError) throw leaveError;
        
        // Refresh participants list
        const { data: updatedParticipants, error: refreshError } = await supabase
          .from('bar_crawl_participants')
          .select(`
            *,
            user_profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq('bar_crawl_id', crawlId);
          
        if (refreshError) throw refreshError;
        
        setParticipants(updatedParticipants);
      }
    } catch (err) {
      console.error('Error leaving/disbanding bar crawl:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave bar crawl');
    } finally {
      setLoading(false);
    }
  };

  const confirmLeave = () => {
    const isHost = crawl?.host_id === user?.profile?.id;
    Alert.alert(
      isHost ? 'Disband Bar Crawl?' : 'Leave Bar Crawl?',
      isHost 
        ? 'As the host, disbanding will cancel the bar crawl. This action cannot be undone.'
        : 'Are you sure you want to leave this bar crawl?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: isHost ? 'Disband' : 'Leave',
          style: 'destructive',
          onPress: handleLeaveBarCrawl,
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const calculateDuration = (start: string, end: string): number => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const diffInMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    return diffInMinutes;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = minutes / 60;
      return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
    }
    return `${minutes}m`;
  };

  const renderDetailsTab = () => {
    if (!crawl) return null;

    return (
      <ScrollView style={styles.tabContent}>
        {/* Crawl Info Section */}
        <View style={styles.crawlInfoSection}>
          <Text style={[styles.crawlTitle, { color: theme.colors.text }]}>
            {crawl.name}
          </Text>
          {crawl.description && (
            <Text style={[styles.crawlDescription, { color: theme.colors.textSecondary }]}>
              {crawl.description}
            </Text>
          )}
          <Text style={[styles.hostText, { color: theme.colors.textSecondary }]}>
            Hosted by {crawl.host?.display_name || 'Unknown Host'}
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {participants.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {participants.length === 1 ? 'Person' : 'People'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="map-marker-path" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stops.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {stops.length === 1 ? 'Stop' : 'Stops'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatDate(crawl.start_date)}
            </Text>
          </View>
        </View>

        {/* Stops List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Stops</Text>
          {stops.map((stop, index) => (
            <React.Fragment key={stop.id}>
              <View style={styles.stopItem}>
                <View style={styles.stopNumber}>
                  <Text style={[styles.stopNumberText, { color: theme.colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.stopDetails}>
                  <Text style={[styles.stopName, { color: theme.colors.text }]}>
                    {stop.bars.name}
                  </Text>
                  <Text style={[styles.stopTime, { color: theme.colors.textSecondary }]}>
                    {formatDate(stop.planned_start_time)} • {
                      formatDuration(calculateDuration(stop.planned_start_time, stop.planned_end_time))
                    }
                  </Text>
                </View>
              </View>

              {/* Travel time section - only show between stops */}
              {index < stops.length - 1 && (
                <View style={styles.travelTimeSection}>
                  <View style={styles.travelTimeLine} />
                  <View style={styles.travelTimeContent}>
                    <View style={styles.travelTimeHeader}>
                      <MaterialCommunityIcons name="walk" size={20} color="#666" />
                      <Text style={styles.travelTimeLabel}>
                        {stop.travel_time_to_next} min travel time
                      </Text>
                    </View>
                  </View>
                  <View style={styles.travelTimeLine} />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderParticipantsTab = () => {
    const isCurrentUser = (participantId: string) => participantId === user?.profile?.id;
    
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.participantsSection}>
          {participants.map((participant) => (
            <View key={participant.id} style={styles.participantItem}>
              <AvatarImage 
                avatarUrl={participant.user_profiles.avatar_url} 
                size={40} 
                style={styles.participantAvatar}
              />
              <View style={styles.participantInfo}>
                <Text style={[styles.participantName, { color: theme.colors.text }]}>
                  {participant.user_profiles.display_name || 'Anonymous User'}
                  {isCurrentUser(participant.user_profiles.id) && ' (You)'}
                </Text>
                {participant.user_profiles.id === crawl?.host_id && (
                  <View style={[styles.hostBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <MaterialCommunityIcons 
                      name="crown" 
                      size={14} 
                      color={theme.colors.primary} 
                      style={styles.hostIcon}
                    />
                    <Text style={[styles.hostBadgeText, { color: theme.colors.primary }]}>
                      Host
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {participants.length === 0 && (
            <Text style={[styles.noParticipantsText, { color: theme.colors.textSecondary }]}>
              No participants yet
            </Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const isParticipant = participants.some(p => p.user_id === user?.profile?.id);
  const isHost = crawl?.host_id === user?.profile?.id;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'details' && { borderBottomColor: theme.colors.primary }
              ]}
              onPress={() => setActiveTab('details')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'details' ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'participants' && { borderBottomColor: theme.colors.primary }
              ]}
              onPress={() => setActiveTab('participants')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'participants' ? theme.colors.primary : theme.colors.textSecondary }
              ]}>
                Participants
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal Content */}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : (
          <>
            {activeTab === 'details' ? renderDetailsTab() : renderParticipantsTab()}
            
            {/* Action Button */}
            {!loading && crawl && (
              <View style={styles.footer}>
                {isParticipant || isHost ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                    onPress={confirmLeave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {isHost ? 'Disband Bar Crawl' : 'Leave Bar Crawl'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleJoinCrawl}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Join Bar Crawl</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  crawlInfoSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  crawlTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  crawlDescription: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  hostText: {
    fontSize: 14,
  },
  statsSection: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fb923c20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stopDetails: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stopTime: {
    fontSize: 14,
  },
  travelTimeSection: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  travelTimeLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  travelTimeContent: {
    paddingVertical: 4,
    paddingHorizontal: 28,
  },
  travelTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  travelTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  participantsSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  participantAvatar: {
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    fontSize: 16,
    flex: 1,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hostIcon: {
    marginRight: 4,
  },
  hostBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noParticipantsText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  leaveButton: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
