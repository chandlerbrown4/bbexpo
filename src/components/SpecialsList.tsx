import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Special, SpecialItem } from '../hooks/useSpecials';
import { useTheme } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SpecialsListProps {
  specials: Special[];
  loading?: boolean;
  onRefresh?: () => void;
  error?: string | null;
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const SpecialsList: React.FC<SpecialsListProps> = ({
  specials,
  loading = false,
  onRefresh,
  error,
}) => {
  const theme = useTheme();

  const isToday = (dayOfWeek: number) => {
    return new Date().getDay() === dayOfWeek;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    specialsList: {
      paddingHorizontal: theme.spacing.md,
    },
    specialContainer: {
      marginBottom: theme.spacing.md,
    },
    dayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    dayText: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
    },
    todayText: {
      color: theme.colors.primary,
    },
    todayBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.xl,
      marginLeft: theme.spacing.sm,
    },
    todayBadgeText: {
      fontSize: theme.typography.sizes.sm,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.white,
    },
    specialsItems: {
      gap: theme.spacing.sm,
    },
    specialItemContainer: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    specialItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    specialItemNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    specialItemName: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginLeft: theme.spacing.xs,
      flex: 1,
    },
    specialItemPrice: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.primary,
    },
    specialItemDescription: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    errorText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.error,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
    noDataText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
  });

  const renderSpecialItem = (item: SpecialItem) => (
    <View key={item.id} style={styles.specialItemContainer}>
      <View style={styles.specialItemHeader}>
        <View style={styles.specialItemNameContainer}>
          <MaterialCommunityIcons name="glass-cocktail" size={20} color={theme.colors.primary} />
          <Text style={styles.specialItemName}>{item.name}</Text>
        </View>
        <Text style={styles.specialItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      {item.description && (
        <Text style={styles.specialItemDescription}>{item.description}</Text>
      )}
    </View>
  );

  const renderSpecial = (special: Special) => (
    <View key={special.day_of_week} style={styles.specialContainer}>
      <View style={styles.dayHeader}>
        <Text style={[styles.dayText, isToday(special.day_of_week) && styles.todayText]}>
          {DAYS[special.day_of_week]}
        </Text>
        {isToday(special.day_of_week) && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        )}
      </View>
      <View style={styles.specialsItems}>
        {special.items.map(renderSpecialItem)}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert" size={24} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Specials</Text>
      {specials.length > 0 ? (
        <View style={styles.specialsList}>
          {specials.map(renderSpecial)}
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons 
            name="glass-cocktail-off" 
            size={24} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.noDataText}>No specials available</Text>
        </View>
      )}
    </View>
  );
};
