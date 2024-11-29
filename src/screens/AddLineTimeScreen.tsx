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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useLineTime } from '../hooks/useLineTime';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { useTheme } from '../theme/theme';
import { calculateDistance } from '../services/location';
import { supabase } from '../services/supabase';

type AddLineTimeRouteProp = RouteProp<RootStackParamList, 'AddLineTime'>;

const LINE_OPTIONS = [
  { label: 'No Line', minMinutes: 0, maxMinutes: 0 },
  { label: 'Short Line (< 5 mins)', minMinutes: 1, maxMinutes: 4 },
  { label: 'Medium Line (5-15 mins)', minMinutes: 5, maxMinutes: 15 },
  { label: 'Long Line (15-30 mins)', minMinutes: 15, maxMinutes: 30 },
  { label: 'Very Long Line (30+ mins)', minMinutes: 30, maxMinutes: 999 },
] as const;

const MAX_DISTANCE_MILES = 2; // Maximum distance in miles to add line time

const DEFAULT_WAIT_TIMES = {
  'No Line': 0,
  'Short Line (< 5 mins)': 5,
  'Medium Line (5-15 mins)': 10,
  'Long Line (15-30 mins)': 25,
  'Very Long Line (30+ mins)': 35,
};

export const AddLineTimeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AddLineTimeRouteProp>();
  const { barId } = route.params;
  const { addLineTime, loading: submitLoading } = useLineTime();
  const { location } = useLocation();
  const { user } = useAuth();
  const [bar, setBar] = useState<any>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [error, setError] = useState('');

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

  const validateMinutes = (selectedCategory: string, minutesValue: string) => {
    if (!minutesValue) return true; // Allow empty minutes

    const minutes = parseInt(minutesValue);
    const category = LINE_OPTIONS.find(opt => opt.label === selectedCategory);
    
    if (!category) return false;
    
    return minutes >= category.minMinutes && minutes <= category.maxMinutes;
  };

  useEffect(() => {
    const fetchBarAndCheckDistance = async () => {
      try {
        setLoading(true);
        setError('');

        if (!location) {
          throw new Error('Location not available');
        }

        // Fetch bar details to get its location
        const { data: barData, error: fetchError } = await supabase
          .from('bars')
          .select('*')
          .eq('id', barId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!barData) {
          throw new Error('Bar not found');
        }

        setBar(barData);

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          barData.latitude,
          barData.longitude
        );

        setIsNearby(distance <= MAX_DISTANCE_MILES);
        if (distance > MAX_DISTANCE_MILES) {
          setError(`You must be within ${MAX_DISTANCE_MILES} miles of the bar to add a line time (Current distance: ${distance.toFixed(1)} miles)`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bar details');
      } finally {
        setLoading(false);
      }
    };

    if (barId && location) {
      fetchBarAndCheckDistance();
    }
  }, [barId, location]);

  const handleSubmit = async () => {
    try {
      setError('');

      if (!user) {
        throw new Error('You must be logged in to add a line time');
      }

      if (!isNearby) {
        throw new Error(`You must be within ${MAX_DISTANCE_MILES} miles of the bar to add a line time`);
      }

      if (!selectedLine) {
        throw new Error('Please select a line status');
      }

      if (minutes && !validateMinutes(selectedLine, minutes)) {
        const category = LINE_OPTIONS.find(opt => opt.label === selectedLine);
        if (category) {
          if (category.maxMinutes === 999) {
            throw new Error(`For ${category.label}, wait time must be ${category.minMinutes} minutes or more`);
          } else if (category.minMinutes === category.maxMinutes) {
            throw new Error(`For ${category.label}, wait time must be ${category.minMinutes} minutes`);
          } else {
            throw new Error(`For ${category.label}, wait time must be between ${category.minMinutes}-${category.maxMinutes} minutes`);
          }
        }
        return;
      }

      const waitTime = minutes ? parseInt(minutes) : DEFAULT_WAIT_TIMES[selectedLine];

      await addLineTime(
        barId,
        user.email || 'Anonymous',
        selectedLine,
        waitTime
      );
      navigation.navigate('MainTabs', { screen: 'NearbyBars' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add line time');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.label}>Select Line Status:</Text>
          <View style={styles.optionsContainer}>
            {LINE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.optionButton,
                  selectedLine === option.label && styles.selectedOption,
                ]}
                onPress={() => {
                  setSelectedLine(option.label);
                  // Clear minutes if they don't match the new category
                  if (minutes && !validateMinutes(option.label, minutes)) {
                    setMinutes('');
                  }
                }}>
                <Text
                  style={[
                    styles.optionText,
                    selectedLine === option.label && styles.selectedOptionText,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Wait Time (optional):</Text>
          <Input
            placeholder="Enter wait time in minutes"
            value={minutes}
            onChangeText={(text) => {
              // Only allow numbers
              if (text === '' || /^\d+$/.test(text)) {
                setMinutes(text);
              }
            }}
            keyboardType="number-pad"
            maxLength={3}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, submitLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitLoading}>
            {submitLoading ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
