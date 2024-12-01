/**
 * Line Times Screen
 * 
 * Displays a list of bars with their current line times and allows users to view and vote on reports.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │ 🔍 Search Bars                  │ <- SearchBar
 * ├─────────────────────────────────┤
 * │ ┌─────────────────────────────┐ │
 * │ │ Bar Name           🕒 5 min  │ │ <- BarCard
 * │ │ 📍 0.5 mi                    │ │
 * │ │ ├─────────────────────────┤ │ │
 * │ │ │ 👤 John - 4min (30m ago)│ │ │ <- LineTimeReport
 * │ │ │              [👍] [👎]  │ │ │
 * │ │ │ ▼                       │ │ │ <- ExpandButton
 * │ │ └─────────────────────────┘ │ │
 * │ └─────────────────────────────┘ │
 * │                                 │
 * │ ┌─────────────────────────────┐ │
 * │ │ Bar Name          🕒 15 min │ │
 * │ │ 📍 1.2 mi                    │ │
 * │ │ ├─────────────────────────┤ │ │
 * │ │ │ ⭐ Jane - 15min (5m ago)│ │ │
 * │ │ │              [👍] [👎]  │ │ │
 * │ │ │ ▼                       │ │ │
 * │ │ │ 👤 Bob - 12min (15m ago)│ │ │ <- Expanded Reports
 * │ │ │              [👍] [👎]  │ │ │
 * │ │ │ 👑 Amy - 18min (20m ago)│ │ │
 * │ │ │              [👍] [👎]  │ │ │
 * │ │ └─────────────────────────┘ │ │
 * │ └─────────────────────────────┘ │
 * └─────────────────────────────────┘
 * 
 * Input Data:
 * - User Context:
 *   - userId: string (UUID of current user)
 *   - userLocation: { latitude: number, longitude: number }
 * - Query Params:
 *   - searchQuery: string (optional)
 *   - maxDistance: number (in miles)
 * 
 * Database Queries:
 * 1. Nearby Bars (useNearbyBars):
 *    SELECT FROM bars WHERE
 *    - distance < maxDistance
 *    - name ILIKE searchQuery
 *    - ORDER BY distance
 * 
 * 2. Recent Line Times (useRecentLineTimes):
 *    SELECT FROM recent_line_times WHERE
 *    - timestamp > now() - interval '2 hours'
 *    - ORDER BY timestamp DESC
 *    Includes:
 *    - reporter_name, reporter_status
 *    - upvotes, downvotes
 *    - user's vote if exists
 * 
 * Vote Interactions:
 * 1. Insert into line_time_votes:
 *    - line_time_id: uuid
 *    - user_id: uuid
 *    - vote_type: 'up' | 'down'
 *    - created_at: timestamp
 * 
 * 2. Update user_reputation:
 *    - total_votes_received
 *    - positive_votes_received
 *    - reputation_points (+1 for up, -1 for down)
 * 
 * Components:
 * - SearchBar: Filters bars by name
 * - BarCard: Shows bar info and current estimated wait time
 *   - Bar name and distance
 *   - Current estimated wait time (top right)
 *   - Most recent line time report
 *   - Expandable list of older reports
 * - LineTimeReport: Individual wait time report
 *   - Reporter status emoji (👤regular, ⭐trusted, 👑expert)
 *   - Reporter name
 *   - Reported wait time
 *   - Time ago
 *   - Voting buttons (upvote/downvote)
 * 
 * Features:
 * - Pull to refresh
 * - Location-based sorting
 * - Time-weighted wait time estimation
 * - Vote-based report reliability
 * - Expert status indicators
 * 
 * Real-time Updates:
 * - Supabase realtime subscription to line_time_posts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNearbyBars } from '../hooks/useNearbyBars';
import { useRecentLineTimes } from '../hooks/useRecentLineTimes';
import { useLocation } from '../context/LocationContext';
import { useReputation } from '../context/ReputationContext';
import { theme as defaultTheme, useTheme } from '../theme/theme';
import { calculateDistance } from '../services/location';
import { calculateEstimatedWaitTime, formatLineTimeReport, EXPERT_STATUS_EMOJI } from '../utils/lineTimeUtils';

interface BarWithLineTime {
  id: string;
  name: string;
  distance: number;
  estimatedWait?: {
    minutes: number;
    category: string;
  };
  recentReports: Array<{
    id: string;
    minutes: number;
    timestamp: string;
    reporter_name: string;
    reporter_status: 'regular' | 'trusted' | 'expert';
    user_vote?: 'up' | 'down';
  }>;
}

export const LineTimesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const navState = useNavigationState(state => state);
  const { location } = useLocation();
  const { profile, barReports, voteOnLineTime } = useReputation();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBar, setExpandedBar] = useState<string | null>(null);

  const { bars, loading: barsLoading, error: barsError, refreshBars } = useNearbyBars(20);
  const { recentLineTimes, loading: lineTimesLoading, error: lineTimesError, refreshLineTimes } = useRecentLineTimes();

  const [recentLineTimesState, setRecentLineTimesState] = useState(recentLineTimes);

  useEffect(() => {
    setRecentLineTimesState(recentLineTimes);
  }, [recentLineTimes]);

  useEffect(() => {
    const currentRoute = navState.routes[navState.routes.length - 1];
    if (currentRoute?.params?.payload?.refresh) {
      refreshLineTimes();
      refreshBars();
    }
  }, [navState]);

  useEffect(() => {
    if (route.params?.refresh) {
      refreshLineTimes();
      refreshBars();
    }
  }, [route.params?.refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshLineTimes(), refreshBars()]);
    setRefreshing(false);
  }, [refreshLineTimes, refreshBars]);

  const processedBars: BarWithLineTime[] = bars.map(bar => {
    const barLineTimes = recentLineTimesState.filter(lt => lt.bar_id === bar.id);
    const estimatedWait = calculateEstimatedWaitTime(barLineTimes);

    return {
      id: bar.id,
      name: bar.name,
      distance: bar.distance,
      estimatedWait,
      recentReports: barLineTimes.map(lt => ({
        id: lt.id,
        minutes: lt.minutes,
        timestamp: lt.timestamp,  
        reporter_name: lt.reporter_name,
        reporter_status: lt.reporter_status,
        user_vote: lt.user_vote,
      })),
    };
  });

  const handleVote = async (reportId: string, voteType: 'up' | 'down') => {
    try {
      setRecentLineTimesState(prev => 
        prev.map(report => {
          if (report.id === reportId) {
            return {
              ...report,
              user_vote: voteType
            };
          }
          return report;
        })
      );

      await voteOnLineTime(reportId, voteType);
    } catch (err) {
      setRecentLineTimesState(recentLineTimes);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit vote');
    }
  };

  const renderBar = ({ item: bar }: { item: BarWithLineTime }) => {
    const isExpanded = expandedBar === bar.id;
    const barReport = barReports.find(report => report.bar_id === bar.id);
    const canAddLineTime = !barReport || 
      (Date.now() - new Date(barReport.last_report_at).getTime() > 5 * 60 * 1000);

    return (
      <TouchableOpacity
        style={[styles.barCard, { borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('BarDetails', { barId: bar.id })}
      >
        <View style={styles.barHeader}>
          <View style={styles.barInfo}>
            <Text style={[styles.barName, { color: theme.colors.text }]}>{bar.name}</Text>
            <Text style={[styles.distance, { color: theme.colors.textSecondary }]}>
              {bar.distance.toFixed(1)} miles away
            </Text>
          </View>
          {bar.estimatedWait && (
            <View style={styles.waitInfo}>
              <Text style={[styles.currentLineText, { color: theme.colors.text }]}>
                {bar.estimatedWait.category}
              </Text>
              {bar.estimatedWait.minutes > 0 && (
                <Text style={[styles.waitTime, { color: theme.colors.primary }]}>
                  ~{bar.estimatedWait.minutes} min
                </Text>
              )}
            </View>
          )}
        </View>

        {bar.recentReports.length > 0 && (
          <View style={styles.recentReports}>
            <View style={styles.reportHeader}>
              <View style={styles.reportContent}>
                <Text style={[styles.reportText, { color: theme.colors.text, flex: 1 }]}>
                  {formatLineTimeReport(bar.recentReports[0])}
                </Text>
                <View style={styles.voteButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.voteButton, 
                      styles.upvoteButton,
                      bar.recentReports[0].user_vote === 'up' && styles.votedButton,
                      bar.recentReports[0].user_vote === 'down' && styles.disabledButton
                    ]}
                    onPress={() => handleVote(bar.recentReports[0].id, 'up')}
                    disabled={bar.recentReports[0].user_vote === 'down'}
                  >
                    <MaterialCommunityIcons 
                      name="thumb-up" 
                      size={16} 
                      color={bar.recentReports[0].user_vote === 'up' 
                        ? theme.colors.primary 
                        : bar.recentReports[0].user_vote === 'down'
                        ? theme.colors.disabled
                        : theme.colors.text
                      } 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.voteButton, 
                      styles.downvoteButton,
                      bar.recentReports[0].user_vote === 'down' && styles.votedButton,
                      bar.recentReports[0].user_vote === 'up' && styles.disabledButton
                    ]}
                    onPress={() => handleVote(bar.recentReports[0].id, 'down')}
                    disabled={bar.recentReports[0].user_vote === 'up'}
                  >
                    <MaterialCommunityIcons 
                      name="thumb-down" 
                      size={16} 
                      color={bar.recentReports[0].user_vote === 'down' 
                        ? theme.colors.error 
                        : bar.recentReports[0].user_vote === 'up'
                        ? theme.colors.disabled
                        : theme.colors.text
                      } 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setExpandedBar(isExpanded ? null : bar.id)}
                style={styles.expandButton}
              >
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>
            
            {isExpanded && bar.recentReports.slice(1).map((report) => (
              <View key={report.id} style={styles.reportRow}>
                <Text style={[styles.reportText, { color: theme.colors.textSecondary, flex: 1 }]}>
                  {formatLineTimeReport(report)}
                </Text>
                <View style={styles.voteButtons}>
                  <TouchableOpacity 
                    style={[
                      styles.voteButton, 
                      styles.upvoteButton,
                      report.user_vote === 'up' && styles.votedButton,
                      report.user_vote === 'down' && styles.disabledButton
                    ]}
                    onPress={() => handleVote(report.id, 'up')}
                    disabled={report.user_vote === 'down'}
                  >
                    <MaterialCommunityIcons 
                      name="thumb-up" 
                      size={16} 
                      color={report.user_vote === 'up' 
                        ? theme.colors.primary 
                        : report.user_vote === 'down'
                        ? theme.colors.disabled
                        : theme.colors.text
                      } 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.voteButton, 
                      styles.downvoteButton,
                      report.user_vote === 'down' && styles.votedButton,
                      report.user_vote === 'up' && styles.disabledButton
                    ]}
                    onPress={() => handleVote(report.id, 'down')}
                    disabled={report.user_vote === 'up'}
                  >
                    <MaterialCommunityIcons 
                      name="thumb-down" 
                      size={16} 
                      color={report.user_vote === 'down' 
                        ? theme.colors.error 
                        : report.user_vote === 'up'
                        ? theme.colors.disabled
                        : theme.colors.text
                      } 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {canAddLineTime && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('AddLineTime', { barId: bar.id })}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Line Time</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (barsLoading || lineTimesLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (barsError || lineTimesError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {barsError || lineTimesError}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={processedBars}
        renderItem={renderBar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  barCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  barInfo: {
    flex: 1,
  },
  waitInfo: {
    alignItems: 'flex-end',
  },
  barName: {
    fontSize: 18,
    fontWeight: '600',
  },
  distance: {
    fontSize: 14,
    marginTop: 2,
  },
  currentLineText: {
    fontSize: 16,
    fontWeight: '500',
  },
  waitTime: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  recentReports: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: defaultTheme.colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    lineHeight: 20,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voteButton: {
    padding: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  upvoteButton: {
    borderColor: defaultTheme.colors.primary,
    borderWidth: 1,
  },
  downvoteButton: {
    borderColor: defaultTheme.colors.error,
    borderWidth: 1,
  },
  votedButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: defaultTheme.colors.disabled,
  },
  expandButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
});
