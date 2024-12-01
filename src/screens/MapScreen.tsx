/**
 * Map Screen
 * 
 * Interactive map view showing nearby bars and their current line status.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │                                 │
 * │           [MapView]             │
 * │                                 │
 * │     📍 User Location           │
 * │                                 │
 * │     🔵 Bar (Active Report)     │
 * │     ⚪ Bar (No Report)         │
 * │                                 │
 * │  ┌─────────────────────────┐    │
 * │  │     Bar Name            │    │
 * │  │     Current Line: 15min │    │ <- Callout
 * │  │     Updated: 5min ago   │    │
 * │  └─────────────────────────┘    │
 * │                                 │
 * └─────────────────────────────────┘
 * 
 * Input Data:
 * - User Context:
 *   - location: { latitude, longitude }
 * 
 * Database Queries:
 * 1. Nearby Bars:
 *    SELECT FROM bars WHERE
 *    - latitude BETWEEN (user_lat ± 0.1)
 *    - longitude BETWEEN (user_lng ± 0.1)
 *    Returns:
 *    - id, name, latitude, longitude
 * 
 * 2. Line Time Reports:
 *    SELECT FROM line_time_posts WHERE
 *    - timestamp > now() - 2 hours
 *    ORDER BY timestamp DESC
 *    Returns:
 *    - id, bar_id, line, minutes, timestamp
 * 
 * Features:
 * - Real-time location tracking
 * - Dynamic map region adjustment
 * - Color-coded bar markers
 *   - Active report: Primary color
 *   - No report: Secondary color
 * - Interactive markers with line info
 * - Auto-refresh on location change
 * 
 * Components:
 * - MapView: Main map component
 * - Marker: Individual bar locations
 * - Callout: Bar details popup
 * - Error View: Location error display
 * 
 * Map Configuration:
 * - Initial zoom: 0.0922 delta
 * - Default center: North Wilkesboro
 * - Auto-center on user location
 * - 2-hour report window
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView from 'react-native-maps';
import { Marker, Region, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { supabase } from '../services/supabase';
import { useLocation } from '../context/LocationContext';

interface Bar {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface LineTimeReport {
  id: string;
  bar_id: string;
  line: string;
  minutes: number;
  timestamp: string;
  user_name: string;
}

export const MapScreen: React.FC = () => {
  const theme = useTheme();
  const { location, errorMsg, loading } = useLocation();
  const [bars, setBars] = useState<Bar[]>([]);
  const [lineTimeReports, setLineTimeReports] = useState<LineTimeReport[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 36.1584, // Default to North Wilkesboro
    longitude: -81.1476,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (location) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Fetch nearby bars
      const fetchBars = async () => {
        const { data: nearbyBars, error: barsError } = await supabase
          .from('bars')
          .select('id, name, latitude, longitude')
          .filter('latitude', 'gte', location.latitude - 0.1)
          .filter('latitude', 'lte', location.latitude + 0.1)
          .filter('longitude', 'gte', location.longitude - 0.1)
          .filter('longitude', 'lte', location.longitude + 0.1);

        if (barsError) {
          console.error('Error fetching bars:', barsError);
        } else {
          setBars(nearbyBars || []);
        }
      };

      // Fetch active line time reports
      const fetchLineTimeReports = async () => {
        const { data: activeReports, error: reportsError } = await supabase
          .from('line_time_posts')
          .select('id, bar_id, line, minutes, timestamp')
          .gt('timestamp', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false });

        if (reportsError) {
          console.error('Error fetching line time reports:', reportsError);
        } else {
          setLineTimeReports(activeReports || []);
        }
      };

      fetchBars();
      fetchLineTimeReports();
    }
  }, [location]);

  const getMarkerColor = (bar: Bar) => {
    const hasActiveReport = lineTimeReports.some(report => report.bar_id === bar.id);
    return hasActiveReport ? theme.colors.primary : theme.colors.textSecondary;
  };

  if (errorMsg) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {bars.map((bar) => (
          <Marker
            key={bar.id}
            coordinate={{
              latitude: bar.latitude,
              longitude: bar.longitude,
            }}
            pinColor={getMarkerColor(bar)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={[styles.calloutTitle, { color: theme.colors.text }]}>{bar.name}</Text>
                {lineTimeReports.find(report => report.bar_id === bar.id) && (
                  <Text style={[styles.calloutSubtitle, { color: theme.colors.primary }]}>
                    Active Line Report!
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  callout: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 14,
  },
});
