/**
 * Add Line Time Screen
 * 
 * Allows users to submit a new line time report for a bar.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │ ← Back                          │ <- Header
 * ├─────────────────────────────────┤
 * │                                 │
 * │ Report Line Time                │ <- Title
 * │                                 │
 * │ Bar Name                        │ <- Bar Info
 * │ 📍 123 Main St                  │
 * │                                 │
 * │ How long is the line?           │
 * │ ┌─────────────────────────────┐ │
 * │ │     🕒 15 minutes           │ │ <- Time Input
 * │ └─────────────────────────────┘ │
 * │                                 │
 * │ Categories:                     │ <- Categories
 * │ ┌───────┐ ┌───────┐ ┌───────┐  │
 * │ │No Line│ │ Short │ │Medium │  │
 * │ └───────┘ └───────┘ └───────┘  │
 * │ ┌───────┐ ┌───────────┐        │
 * │ │ Long  │ │Very Long  │        │
 * │ └───────┘ └───────────┘        │
 * │                                 │
 * │ [     Submit Report     ]       │ <- Submit Button
 * │                                 │
 * └─────────────────────────────────┘
 * 
 * Input Data:
 * - Route Params:
 *   - barId: string (UUID of the bar)
 *   - barName: string
 *   - barAddress: string
 * - User Context:
 *   - userId: string (UUID of current user)
 *   - userReputation: number
 * - Form Data:
 *   - minutes: number (wait time)
 *   - timestamp: Date (auto-generated)
 *   - location: { latitude: number, longitude: number }
 * 
 * Output Data:
 * - Success: Returns to previous screen
 * - Error: Shows error toast message
 * 
 * Database Interactions:
 * 1. Insert into line_time_posts:
 *    - id: uuid (generated)
 *    - bar_id: uuid (from route params)
 *    - user_id: uuid (from auth context)
 *    - minutes: number (from form)
 *    - timestamp: timestamp (server time)
 *    - location: point (from device)
 *    - verified: boolean (based on location)
 *    - weight: number (based on reputation)
 * 
 * 2. Update user_reputation:
 *    - increments accurate_reports
 *    - updates reputation_points
 *    - updates updated_at
 * 
 * 3. Triggers:
 *    - recent_line_times_trigger:
 *      - Updates materialized view for efficient querying
 *      - Recalculates weighted averages
 *      - Updates bar's current_line_time
 * 
 * Components:
 * - Header: Back navigation
 * - Bar Info: Name and address
 * - Time Input: Numeric input for minutes
 * - Categories: Quick selection buttons
 *   - No Line (0 min)
 *   - Short (1-4 min)
 *   - Medium (5-15 min)
 *   - Long (16-30 min)
 *   - Very Long (31+ min)
 * - Submit Button: Posts the report
 * 
 * Features:
 * - Quick category selection
 * - Manual minute input
 * - Location verification
 * - Duplicate report prevention (within 15 minutes)
 * - Reputation-based weighting
 * 
 * Error Handling:
 * - Location unavailable
 * - Too far from bar
 * - Recent duplicate report
 * - Network failure
 * - Database constraints
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextStyle,
} from 'react-native';
import { RouteProp, useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useLineTime } from '../hooks/useLineTime';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useReputation } from '../context/ReputationContext';
import { Input } from '../components/Input';
import { theme } from '../theme/theme';
import { calculateDistance } from '../services/location';
import { supabase } from '../services/supabase';

type AddLineTimeRouteProp = RouteProp<RootStackParamList, 'AddLineTime'>;

const LINE_OPTIONS = [
  { label: 'No Line', minMinutes: 0, maxMinutes: 0 },
  { label: 'Short Line', minMinutes: 1, maxMinutes: 4 },
  { label: 'Medium Line', minMinutes: 5, maxMinutes: 15 },
  { label: 'Long Line', minMinutes: 16, maxMinutes: 30 },
  { label: 'Very Long Line', minMinutes: 31, maxMinutes: 999 },
] as const;

const DEFAULT_WAIT_TIMES = {
  'No Line': 0,
  'Short Line': 4,
  'Medium Line': 10,
  'Long Line': 20,
  'Very Long Line': 30,
} as const;

const MAX_DISTANCE_MILES = 2; 

export const AddLineTimeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AddLineTimeRouteProp>();
  const { barId } = route.params;
  const { addLineTime, loading: submitLoading } = useLineTime();
  const { location } = useLocation();
  const { user } = useAuth();
  const { profile, reputation, barReports } = useReputation();
  const [bar, setBar] = useState<any>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [error, setError] = useState('');

  const validateMinutes = (selectedCategory: string, minutesValue: string) => {
    if (!minutesValue) return true;

    const minutes = parseInt(minutesValue);
    if (isNaN(minutes)) return false;
    
    const category = LINE_OPTIONS.find(opt => opt.label === selectedCategory);
    if (!category) return false;
    
    switch (selectedCategory) {
      case 'No Line':
        return minutes === 0;
      case 'Short Line':
        return minutes > 0 && minutes < 5;
      case 'Medium Line':
        return minutes >= 5 && minutes <= 15;
      case 'Long Line':
        return minutes > 15 && minutes <= 30;
      case 'Very Long Line':
        return minutes > 30;
      default:
        return false;
    }
  };

  useEffect(() => {
    const fetchBarAndCheckDistance = async () => {
      try {
        setLoading(true);
        setError('');

        if (!location) {
          throw new Error('Location not available');
        }

        const { data: barData, error: fetchError } = await supabase
          .from('bars')
          .select('*')
          .eq('id', barId)
          .single();

        if (fetchError) throw fetchError;
        if (!barData) throw new Error('Bar not found');

        setBar(barData);

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          barData.latitude,
          barData.longitude
        );

        setIsNearby(distance <= MAX_DISTANCE_MILES);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bar details');
      } finally {
        setLoading(false);
      }
    };

    fetchBarAndCheckDistance();
  }, [barId, location]);

  const handleSubmit = async () => {
    try {
      if (!user || !profile) {
        throw new Error('Must be logged in to submit line times');
      }

      if (!isNearby) {
        throw new Error('You must be within 2 miles of the bar to submit a line time');
      }

      if (!selectedLine) {
        throw new Error('Please select a line category');
      }

      const barReport = barReports.find(report => report.bar_id === barId);
      if (barReport) {
        const lastReportTime = new Date(barReport.last_report_at).getTime();
        const cooldownPeriod = 5 * 60 * 1000;
        
        if (Date.now() - lastReportTime < cooldownPeriod) {
          throw new Error('Please wait before submitting another line time');
        }
      }

      let minutesValue = minutes ? parseInt(minutes) : null;
      if (!minutesValue || !validateMinutes(selectedLine, minutes)) {
        minutesValue = DEFAULT_WAIT_TIMES[selectedLine as keyof typeof DEFAULT_WAIT_TIMES];
      }

      await addLineTime(barId, selectedLine, minutesValue);
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'LineTimes',
              params: { refresh: Date.now() }
            },
          ],
        })
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit line time');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!isNearby && (
          <Text style={styles.errorText}>
            You must be within 2 miles of the bar to submit a line time
          </Text>
        )}

        <Text style={styles.label}>How long is the line?</Text>
        <View style={styles.optionsContainer}>
          {LINE_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionButton,
                selectedLine === option.label && styles.selectedOption,
                index === LINE_OPTIONS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => setSelectedLine(option.label)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedLine === option.label && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Wait Time (Optional)</Text>
        <Input
          placeholder="Enter wait time in minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
          error={
            minutes && selectedLine
              ? !validateMinutes(selectedLine, minutes)
                ? 'Invalid wait time for selected line length'
                : undefined
              : undefined
          }
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedLine || !isNearby || submitLoading) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!selectedLine || !isNearby || submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Line Time</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as TextStyle['fontWeight'],
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  optionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.error,
    marginTop: 8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
