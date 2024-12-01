/**
 * Events Screen
 * 
 * Displays and filters upcoming events at local bars.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │ [All] Today Week Weekend        │ <- Filter Tabs
 * ├─────────────────────────────────┤
 * │ ┌─────────────────────────────┐ │
 * │ │ Event Title                 │ │ <- Event Card
 * │ │ @ Bar Name                  │ │
 * │ │ 📅 Fri, Dec 15 • 9:00 PM   │ │
 * │ │                             │ │
 * │ │ Event description text...   │ │
 * │ └─────────────────────────────┘ │
 * │                                 │
 * │ ┌─────────────────────────────┐ │
 * │ │ Event Title                 │ │
 * │ │ @ Bar Name                  │ │
 * │ │ 📅 Sat, Dec 16 • 8:00 PM   │ │
 * │ │                             │ │
 * │ │ Event description text...   │ │
 * │ └─────────────────────────────┘ │
 * └─────────────────────────────────┘
 * 
 * Input Data:
 * - User Context:
 *   - userId: string (for event interactions)
 *   - userLocation: { latitude, longitude }
 * 
 * Database Queries:
 * 1. Events (useEvents):
 *    SELECT FROM events WHERE
 *    - date >= startDate
 *    - date <= endDate
 *    - ORDER BY date ASC
 *    Includes:
 *    - name, description, date
 *    - bar_id, bar_name
 *    - count (attendance/interest)
 * 
 * Filter Options:
 * - All: No date filtering
 * - Today: Events on current date
 * - Week: Events in next 7 days
 * - Weekend: Events Fri-Sun
 * 
 * Components:
 * - Filter tabs for date range selection
 * - EventDisplay: Individual event card
 *   - Title and bar name
 *   - Formatted date and time
 *   - Description preview
 * 
 * Features:
 * - Date-based filtering
 * - Pull to refresh
 * - Navigation to bar details
 * - Chronological sorting
 * - Description truncation
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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvents, Event as EventType } from '../hooks/useEvents';
import { useTheme } from '../theme/theme';
import { format } from 'date-fns';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

type EventsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface EventDisplayProps {
  event: EventType;
  onPress: (eventId: string) => void;
}

const EventDisplay: React.FC<EventDisplayProps> = ({ event, onPress }) => {
  const theme = useTheme();
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    title: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    barName: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    date: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    description: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(event.id)}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.barName}>{event.bar?.name}</Text>
      <Text style={styles.date}>{format(new Date(event.date), 'EEE, MMM d • h:mm a')}</Text>
      {event.description && (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const EventsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const { events, loading, error, fetchEvents, refetch } = useEvents();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'weekend'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEventPress = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.bar_id) {
      navigation.navigate('BarDetails', { barId: event.bar_id });
    }
  };

  const filterEvents = (events: EventType[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (selectedFilter) {
      case 'today':
        return events.filter((event) => event.date && event.date.startsWith(today));
      case 'week':
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return events.filter(
          (event) => event.date && new Date(event.date) <= nextWeek && new Date(event.date) >= now
        );
      case 'weekend':
        return events.filter((event) => {
          const eventDate = event.date ? new Date(event.date) : null;
          return eventDate && isWeekend(eventDate);
        });
      default:
        return events;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContent: {
      padding: theme.spacing.md,
    },
    fab: {
      position: 'absolute',
      bottom: theme.spacing.md,
      right: theme.spacing.md,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabText: {
      fontSize: theme.typography.sizes.lg,
      color: theme.colors.white,
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: theme.colors.error }}>Error: {error}</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: theme.colors.textSecondary }}>No upcoming events found nearby</Text>
      </View>
    );
  }

  const filteredEvents = filterEvents(events);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEvents}
        renderItem={({ item }) => (
          <EventDisplay event={item} onPress={handleEventPress} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};
