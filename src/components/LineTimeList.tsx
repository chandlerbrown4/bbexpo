import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LineTime {
  id: string;
  user_name: string;
  line: string;
  minutes: number;
  timestamp: string;
}

interface LineTimeListProps {
  lineTimes: LineTime[];
  loading?: boolean;
  onRefresh?: () => void;
  error?: string | null;
}

export const LineTimeList: React.FC<LineTimeListProps> = ({
  lineTimes,
  loading = false,
  onRefresh,
  error,
}) => {
  const theme = useTheme();

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

  const getLineIcon = (line: string) => {
    switch (line.toLowerCase()) {
      case 'short':
        return 'account-multiple';
      case 'medium':
        return 'account-group';
      case 'long':
        return 'account-group-outline';
      default:
        return 'account-question';
    }
  };

  const getLineColor = (line: string) => {
    switch (line.toLowerCase()) {
      case 'short':
        return theme.colors.success;
      case 'medium':
        return theme.colors.warning;
      case 'long':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.sizes.md,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.lg,
    },
    emptyText: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.md,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      marginHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    iconContainer: {
      marginRight: theme.spacing.md,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    userName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    timestamp: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
    waitTime: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      marginTop: theme.spacing.xs,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (lineTimes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No line times reported yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={lineTimes}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        ) : undefined
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getLineIcon(item.line)}
              size={24}
              color={getLineColor(item.line)}
            />
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.userName}>{item.user_name}</Text>
              <Text style={styles.timestamp}>{getTimeAgo(item.timestamp)}</Text>
            </View>
            <Text style={styles.waitTime}>{item.minutes} minute wait</Text>
          </View>
        </View>
      )}
    />
  );
};
