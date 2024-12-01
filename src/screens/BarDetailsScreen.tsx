import { calculateDistance } from '../services/location';

/**
 * BarDetailsScreen - Individual Bar Information Screen
 * 
 * Layout:
 * - Bar image/header at the top
 * - Bar information section (name, address, description)
 * - Actions section (call, directions, menu)
 * - Tabbed content section (info, specials)
 * - Info tab: hours, about, amenities
 * - Specials tab: list of specials
 * 
 * Core Functionality:
 * - Displays detailed information about a specific bar
 * - Shows hours, about, and amenities information
 * - Displays list of specials
 * - Provides navigation to directions and menu
 * - Refresh mechanism to update bar data
 * 
 * Data Flow:
 * - Receives barId through navigation params
 * - Uses useNearbyBars hook for fetching nearby bars
 * - Uses useSpecials hook for fetching specials
 * - Uses useBarHours hook for fetching bar hours
 * - Uses useLocation hook for fetching user location
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useNearbyBars } from '../hooks/useNearbyBars';
import { useSpecials } from '../hooks/useSpecials';
import { useLocation } from '../context/LocationContext';
import { useBarHours } from '../hooks/useBarHours';
import { useLineTime } from '../hooks/useLineTime';
import { SpecialsList } from '../components/SpecialsList';
import { useTheme } from '../theme/theme';

type BarDetailsRouteProp = RouteProp<RootStackParamList, 'BarDetails'>;
type BarDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DAY_MAP = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const BarDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<BarDetailsRouteProp>();
  const navigation = useNavigation<BarDetailsNavigationProp>();
  const { barId } = route.params;
  const [activeTab, setActiveTab] = useState<'info' | 'specials'>('info');
  const { location } = useLocation();
  const { lineTimes, loading: lineTimesLoading, error: lineTimesError, refreshLineTimes } = useLineTime();
  const { hours, loading: hoursLoading, error: hoursError } = useBarHours(barId);
  const { bars, loading: barsLoading } = useNearbyBars();
  
  const bar = bars.find(b => b.id === barId);
  const { specials, loading: specialsLoading, fetchSpecials } = useSpecials();

  useEffect(() => {
    if (!barId) return;
    
    fetchSpecials(barId);
  }, [barId]);

  const handleDirections = () => {
    if (!bar) return;
    const address = encodeURIComponent(bar.address);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `google.navigation:q=${address}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  const distance = useMemo(() => {
    if (!location || !bar) return null;
    return calculateDistance(
      location.latitude,
      location.longitude,
      bar.latitude,
      bar.longitude
    );
  }, [location, bar]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerImage: {
      width: '100%',
      height: 200,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    name: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold as TextStyle['fontWeight'],
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    address: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    actionButton: {
      alignItems: 'center',
      padding: 8,
    },
    actionButtonText: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.primary,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weights.bold as TextStyle['fontWeight'],
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.bold as TextStyle['fontWeight'],
      color: theme.colors.text,
      marginTop: 24,
      marginBottom: 12,
    },
    description: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      lineHeight: 24,
    },
    noDataText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    hoursContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    hourRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dayText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
      fontWeight: '500',
    },
    hoursText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.textSecondary,
    },
    amenitiesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
    },
    amenityItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      margin: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    amenityText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 8,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
    },
    errorText: {
      color: theme.colors.error,
      padding: 16,
      textAlign: 'center',
    },
  });

  if (barsLoading || !bar) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bar.image_url && (
        <Image source={{ uri: bar.image_url }} style={styles.headerImage} />
      )}
      
      <View style={styles.header}>
        <Text style={styles.name}>{bar.name}</Text>
        <Text style={styles.address}>{bar.address}</Text>
        
        <View style={styles.actions}>
          {bar.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(`tel:${bar.phone}`)}>
              <MaterialCommunityIcons name="phone" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDirections}>
            <MaterialCommunityIcons name="directions" size={24} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>

          {bar.menu_link && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Linking.openURL(bar.menu_link!)}>
              <MaterialCommunityIcons name="food-fork-drink" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Menu</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'info' && styles.activeTabText,
              ]}>
              Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'specials' && styles.activeTab]}
            onPress={() => setActiveTab('specials')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'specials' && styles.activeTabText,
              ]}>
              Specials
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {activeTab === 'info' && (
          <View>
            <Text style={styles.sectionTitle}>Hours</Text>
            <View style={styles.hoursContainer}>
              {hoursLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading hours...</Text>
                </View>
              ) : hoursError ? (
                <Text style={styles.errorText}>{hoursError}</Text>
              ) : hours.length > 0 ? (
                hours.map((hour) => (
                  <View key={hour.day_of_week} style={styles.hourRow}>
                    <Text style={styles.dayText}>{DAY_MAP[hour.day_of_week]}</Text>
                    <Text style={styles.hoursText}>{`${hour.open} - ${hour.close}`}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Hours not available</Text>
              )}
            </View>
            
            <Text style={styles.sectionTitle}>About</Text>
            {bar.description ? (
              <Text style={styles.description}>{bar.description}</Text>
            ) : (
              <Text style={styles.noDataText}>No description available</Text>
            )}

            {bar.amenities && bar.amenities.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesContainer}>
                  {bar.amenities.map((amenity, index) => (
                    <View key={index} style={styles.amenityItem}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'specials' && (
          <View>
            {specialsLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <SpecialsList specials={specials} />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
