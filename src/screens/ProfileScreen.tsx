/**
 * Profile Screen
 * 
 * Displays user profile, reputation metrics, and bar reporting history.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │    ┌─────────────────┐         │
 * │    │  Profile Image  │         │ <- Header
 * │    └─────────────────┘         │
 * │         Username                │
 * │                                 │
 * ├─────────────────────────────────┤
 * │ ┌───────┐ ┌───────┐ ┌───────┐  │
 * │ │ 150   │ │ 4.8★  │ │ 12    │  │ <- Stats
 * │ │Reports│ │Rating │ │Badges │  │
 * │ └───────┘ └───────┘ └───────┘  │
 * ├─────────────────────────────────┤
 * │ Badges                          │
 * │ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
 * │ │ 🎯 │ │ 🌟 │ │ 🎉 │ │ 📊 │   │ <- Badges
 * │ └────┘ └────┘ └────┘ └────┘   │
 * ├─────────────────────────────────┤
 * │ Bar Expertise                   │
 * │ ┌─────────────────────────┐    │
 * │ │ Bar Name                │    │
 * │ │ Reports: 25 | Rating: 4.9    │ <- Expertise
 * │ └─────────────────────────┘    │
 * │                                 │
 * └─────────────────────────────────┘
 * 
 * Data Sources:
 * 1. User Profile (useReputation):
 *    - Basic info (name, avatar)
 *    - Reputation metrics
 *    - Earned badges
 *    - Bar reporting history
 * 
 * Reputation Metrics:
 * - Total Reports: Number of line time reports
 * - Rating: Average accuracy rating (0-5)
 * - Badges: Count of earned achievements
 * 
 * Badge Categories:
 * - Accuracy: High rating consistency
 * - Volume: Number of reports submitted
 * - Streak: Consecutive days reporting
 * - Special: Event-based achievements
 * 
 * Bar Expertise:
 * - Most reported bars
 * - Rating per bar
 * - Report frequency
 * - Accuracy metrics
 * 
 * Features:
 * - Pull to refresh
 * - Dynamic stats calculation
 * - Interactive badges display
 * - Bar-specific reputation tracking
 * - Loading states and error handling
 * 
 * Components:
 * - Header with profile image
 * - Stats cards with metrics
 * - Badge collection display
 * - Bar expertise cards
 * - Loading indicator
 * - Error state display
 */

import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme';
import { useReputation } from '../context/ReputationContext';

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { profile, reputation, badges, barReports, loading, error, refreshProfile } = useReputation();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    name: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    statCard: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    statLabel: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    section: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      marginTop: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    badge: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    badgeText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    expertiseCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    barName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    expertiseStats: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    expertStatus: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.medium,
    },
    errorText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !profile || !reputation) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
      </View>
    );
  }

  const getExpertStatus = () => {
    if (reputation.reputation_points >= 1000) return '🏆 Expert Scout';
    if (reputation.reputation_points >= 500) return '⭐ Trusted Scout';
    return '🎯 Scout';
  };

  const getAccuracyRate = () => {
    if (reputation.total_votes === 0) return 0;
    return (reputation.positive_votes_received / reputation.total_votes) * 100;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/default-avatar.png')}
          style={styles.avatar}
        />
        <Text style={styles.title}>{getExpertStatus()}</Text>
        <Text style={styles.name}>{profile.display_name || `${profile.first_name} ${profile.last_name}`}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reputation.reputation_points || 0}</Text>
          <Text style={styles.statLabel}>Reputation</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reputation.total_reports || 0}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getAccuracyRate().toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 Badges</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {badges.map((badge) => (
            <View key={badge.id} style={styles.badge}>
              <Text style={styles.badgeText}>{badge.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bar Reports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 Bar Reports</Text>
        {barReports.map((report) => (
          <View key={report.id} style={styles.expertiseCard}>
            <Text style={styles.barName}>{report.bar_id}</Text>
            <Text style={styles.expertiseStats}>
              {report.reports_count} reports • {(report.accuracy_rate * 100).toFixed(1)}% accurate
            </Text>
            <Text style={styles.expertStatus}>
              {report.status === 'new' ? 'New Reporter' : 
               report.accuracy_rate >= 0.9 ? 'Expert' :
               report.accuracy_rate >= 0.7 ? 'Trusted' : 'Regular'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
