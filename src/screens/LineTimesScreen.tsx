/**
 * LineTimesScreen - Nearby Bars with Line Times
 * 
 * Layout:
 * ┌─────────────────────────────┐
 * │     Nearby Bars (Title)     │
 * ├─────────────────────────────┤
 * │ ┌─────────────────────────┐ │
 * │ │    Bar Card             │ │
 * │ │ ┌───────┐              │ │
 * │ │ │  Bar  │ Bar Name     │ │
 * │ │ │ Icon  │ Distance     │ │
 * │ │ └───────┘              │ │
 * │ │ Current Line: Medium    │ │
 * │ │ Wait Time: ~15 mins    │ │
 * │ │ Updated: 2 mins ago    │ │
 * │ └─────────────────────────┘ │
 * │ ┌─────────────────────────┐ │
 * │ │    Bar Card             │ │
 * │ │    ...                  │ │
 * │ └─────────────────────────┘ │
 * └─────────────────────────────┘
 * 
 * Core Functionality:
 * - Displays bars within 20 miles of user's location
 * - Shows current line status for each bar
 * - Real-time line time updates
 * - Pull-to-refresh functionality
 * - Distance-based sorting (nearest first)
 * - Navigation to bar details
 * - Add line time capability
 * 
 * Data Flow:
 * - Uses useNearbyBars hook for location-based bar filtering
 * - Uses useLineTime hook for line time data
 * - Uses useLocation hook for user's position
 * - Auto-refreshes on screen focus
 * - Filters bars > 20 miles away
 * 
 * Bar Card Display:
 * - Bar name and distance
 * - Current line status (No Line → Very Long Line)
 * - Average wait time from recent submissions
 * - Time elapsed since last update
 * - Color-coded wait times:
 *   • Green: No line/Short
 *   • Orange: Medium
 *   • Red: Long/Very Long
 * 
 * Line Time Calculation:
 * - Only considers submissions from last 2 hours
 * - Uses weighted average system:
 *   • Newer posts have higher weight (exponential decay)
 *   • Weight = e^(-0.5 * ageInHours)
 *   • Final time = Σ(weight * minutes) / Σ(weight)
 * - Default wait times if no minutes specified:
 *   • No Line: 0 mins
 *   • Short: 5 mins
 *   • Medium: 10 mins
 *   • Long: 25 mins
 *   • Very Long: 35 mins
 */


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNearbyBars } from '../hooks/useNearbyBars';
import { useLineTime } from '../hooks/useLineTime';
import { useLocation } from '../hooks/useLocation';
import { theme as defaultTheme, useTheme } from '../theme/theme';
import { calculateDistance } from '../services/location';

interface BarWithLineTime {
  id: string;
  name: string;
  distance: number;
  lastLineTime?: {
    line: string;
    averageMinutes: number;
    numSubmissions: number;
    latestTimestamp: string;
  };
}

export const LineTimesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { location } = useLocation();
  const { bars, loading: barsLoading, error: barsError } = useNearbyBars({
    userLatitude: location?.latitude ?? 36.1584,
    userLongitude: location?.longitude ?? -81.1476,
    maxDistance: 20,
  });
  const { lineTimes, loading: lineTimesLoading, error: lineTimesError, fetchLineTimes, getLineCategoryFromMinutes } = useLineTime();
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      padding: 16,
    },
    barCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.sm,
      padding: theme.spacing.md,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    barName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    distance: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    lineTimeContainer: {
      marginTop: theme.spacing.sm,
    },
    lineTimeInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    lineStatus: {
      fontSize: 16,
      fontWeight: '600',
    },
    waitTime: {
      fontSize: 16,
      fontWeight: '500',
    },
    submissionInfo: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    timestamp: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    noLineTime: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
      fontStyle: 'italic',
    },
    addButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginTop: theme.spacing.xs,
    },
    addButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
      fontWeight: '500',
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
  });

  useEffect(() => {
    fetchLineTimes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        await fetchLineTimes();
      };
      refreshData();
    }, [fetchLineTimes])
  );

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  };

  const getAverageLineTime = (barLineTimes: typeof lineTimes) => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const recentLineTimes = barLineTimes.filter(lt => {
      const timestamp = new Date(lt.timestamp);
      return timestamp >= twoHoursAgo;
    });

    if (recentLineTimes.length === 0) {
      return null;
    }

    const totalWeight = recentLineTimes.reduce((sum, lt) => {
      const ageInHours = (now.getTime() - new Date(lt.timestamp).getTime()) / (60 * 60 * 1000);
      const weight = Math.exp(-0.5 * ageInHours);
      return sum + weight;
    }, 0);

    const weightedAverageMinutes = recentLineTimes.reduce((sum, lt) => {
      const ageInHours = (now.getTime() - new Date(lt.timestamp).getTime()) / (60 * 60 * 1000);
      const weight = Math.exp(-0.5 * ageInHours);
      return sum + weight * lt.minutes;
    }, 0) / totalWeight;

    const lineStatusCount: { [key: string]: number } = {};
    recentLineTimes.forEach(lt => {
      lineStatusCount[lt.line] = (lineStatusCount[lt.line] || 0) + 1;
    });
    const mostCommonLine = Object.entries(lineStatusCount)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      line: mostCommonLine,
      averageMinutes: weightedAverageMinutes,
      numSubmissions: recentLineTimes.length,
      latestTimestamp: recentLineTimes[0].timestamp,
    };
  };

  const getWaitTimeColor = (minutes: number): string => {
    if (minutes <= 0) return theme.colors.success;
    if (minutes < 5) return '#4CAF50';  
    if (minutes < 15) return '#FFA726';  
    if (minutes < 30) return '#FF7043';  
    return '#E53935';  
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(1)} mi`;
  };

  const barsWithLineTimes: BarWithLineTime[] = bars.map(bar => {
    const barLineTimes = lineTimes
      .filter(lt => lt.bar_id === bar.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const averageLineTime = getAverageLineTime(barLineTimes);

    return {
      id: bar.id,
      name: bar.name,
      distance: bar.distance || 0,
      lastLineTime: averageLineTime || undefined,
    };
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLineTimes(),
    ]);
    setRefreshing(false);
  };

  const renderBar = ({ item }: { item: BarWithLineTime }) => (
    <TouchableOpacity
      style={[styles.barCard, { borderLeftWidth: 4, borderLeftColor: item.lastLineTime ? getWaitTimeColor(item.lastLineTime.averageMinutes) : theme.colors.border }]}
      onPress={() => navigation.navigate('BarDetails', { barId: item.id })}>
      <View style={styles.barHeader}>
        <Text style={styles.barName}>{item.name}</Text>
        <Text style={styles.distance}>{formatDistance(item.distance)}</Text>
      </View>

      <View style={styles.lineTimeContainer}>
        {item.lastLineTime ? (
          <>
            <View style={styles.lineTimeInfo}>
              <Text style={[styles.lineStatus, { color: getWaitTimeColor(item.lastLineTime.averageMinutes) }]}>
                {getLineCategoryFromMinutes(item.lastLineTime.averageMinutes)}
              </Text>
              <Text style={[styles.waitTime, { color: getWaitTimeColor(item.lastLineTime.averageMinutes) }]}>
                {item.lastLineTime.averageMinutes.toFixed(0)} min wait
              </Text>
            </View>
            <Text style={styles.submissionInfo}>
              Based on {item.lastLineTime.numSubmissions} {item.lastLineTime.numSubmissions === 1 ? 'report' : 'reports'}
            </Text>
            <Text style={styles.timestamp}>
              Last updated {getTimeAgo(item.lastLineTime.latestTimestamp)}
            </Text>
          </>
        ) : (
          <Text style={styles.noLineTime}>No recent line times</Text>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => navigation.navigate('AddLineTime', { barId: item.id })}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Add Line Time</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (barsLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={barsWithLineTimes}
        renderItem={renderBar}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary}/>
        }
      />
    </View>
  );
};
