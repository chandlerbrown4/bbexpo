import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useHours } from '../hooks/useHours';
import { Bar } from '../hooks/useNearbyBars';
import { useTheme } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BarCardProps {
  bar: Bar;
  onPress: () => void;
}

export const BarCard: React.FC<BarCardProps> = ({ bar, onPress }) => {
  const theme = useTheme();
  const { isOpen, loading, error } = useHours();

  const handleCallPress = () => {
    if (bar.phone) {
      Linking.openURL(`tel:${bar.phone}`);
    }
  };

  const handleMenuPress = () => {
    if (bar.menu_link) {
      Linking.openURL(bar.menu_link);
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return 'Distance unknown';
    if (distance < 0.1) return 'Less than 0.1 miles away';
    return `${distance.toFixed(1)} miles away`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginVertical: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    name: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    infoText: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm,
    },
    address: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    distance: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.xs,
    },
    actionButtonText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.semibold,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{bar.name}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : error ? (
          <Text style={[styles.statusText, { color: theme.colors.error }]}>
            Status unavailable
          </Text>
        ) : (
          <Text
            style={[
              styles.statusText,
              { color: isOpen(bar.id) ? theme.colors.success : theme.colors.error },
            ]}>
            {isOpen(bar.id) ? 'Open' : 'Closed'}
          </Text>
        )}
      </View>

      <Text style={styles.address}>{bar.address}</Text>
      <Text style={styles.distance}>{formatDistance(bar.distance)}</Text>

      <View style={styles.actions}>
        {bar.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCallPress}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        )}

        {bar.menu_link && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}>
            <MaterialCommunityIcons name="food-fork-drink" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Menu</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};
