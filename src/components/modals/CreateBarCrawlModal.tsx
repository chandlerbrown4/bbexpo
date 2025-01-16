import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Bar } from '../../types/bar';
import { BarSearchInput } from '../inputs/BarSearchInput';
import DraggableFlatList, { 
  RenderItemParams,
  ScaleDecorator 
} from 'react-native-draggable-flatlist';
import { supabase } from '../../services/supabase';
import { format } from 'date-fns';
import { useNearbyBars } from '../../hooks/useNearbyBars';

interface CreateBarCrawlModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BarCrawlStop {
  bar_id: string;
  bar_name: string;
  order_index: number;
  duration_minutes: number;
  travel_time_to_next: number;
  planned_start_time: Date;
  planned_end_time: Date;
}

const DEFAULT_DURATION = 60; // 1 hour default stay
const DEFAULT_TRAVEL_TIME = 15; // 15 minutes default travel time
const DURATION_OPTIONS = [30, 45, 60, 90, 120];
const TRAVEL_TIME_OPTIONS = [5, 10, 15, 20, 30];

export const CreateBarCrawlModal: React.FC<CreateBarCrawlModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date(),
    is_private: false,
    invite_code: '',
    stops: [] as BarCrawlStop[],
  });

  const themedStyles = useMemo(() => ({
    modalContainer: { backgroundColor: '#fff' },
    modalContent: { backgroundColor: '#fff' },
    header: { backgroundColor: '#fb923c' },
    timePickerContent: { 
      borderTopColor: '#fb923c',
      borderTopWidth: 1,
      padding: 16,
    },
    timePickerTitle: { color: '#fb923c' },
    nextButton: { backgroundColor: '#fb923c' },
    selectedStopBorder: { borderColor: '#fb923c' },
    buttonText: { color: '#fff' },
  }), []);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  const [dateTimeError, setDateTimeError] = useState<string | null>(null);
  const now = new Date();

  const validateDateTime = (date: Date): boolean => {
    // Convert both dates to UTC for comparison
    const dateUTC = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const nowUTC = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    
    // Add a small buffer (1 minute) to prevent edge cases
    if (dateUTC.getTime() <= nowUTC.getTime() + 60000) {
      const errorMsg = 'Bar crawl must start at least 1 minute in the future! Please select a future date and time.';
      setDateTimeError(errorMsg);
      Alert.alert(
        'Invalid Start Time',
        errorMsg,
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    setDateTimeError(null);
    return true;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Keep the time from the current startDate but update the date
      const newDate = new Date(selectedDate);
      newDate.setHours(formData.start_date.getHours());
      newDate.setMinutes(formData.start_date.getMinutes());
      
      // Validate the new datetime
      if (validateDateTime(newDate)) {
        setFormData({ ...formData, start_date: newDate });
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Keep the date from the current startDate but update the time
      const newDate = new Date(formData.start_date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      
      // Validate the new datetime
      if (validateDateTime(newDate)) {
        setFormData({ ...formData, start_date: newDate });
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const SEARCH_RADIUS_MILES = 20;
  const METERS_PER_MILE = 1609.34;
  const radiusMeters = Math.round(SEARCH_RADIUS_MILES * METERS_PER_MILE);
  const [searchQuery, setSearchQuery] = useState('');
  const { bars: nearbyBars, loading: searching } = useNearbyBars(radiusMeters);

  const formatDistance = (meters: number | null | undefined): string => {
    if (meters == null) return '';
    const miles = meters / METERS_PER_MILE;
    return `${miles.toFixed(1)} miles away`;
  };

  const filteredBars = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return nearbyBars
      .filter(bar => {
        const matchesName = bar.name.toLowerCase().includes(query);
        const matchesAddress = bar.address.toLowerCase().includes(query);
        return matchesName || matchesAddress;
      })
      .sort((a, b) => a.distance - b.distance);
  }, [nearbyBars, searchQuery]);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async () => {
    try {
      if (!user?.profile?.id) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Please enter a name for your bar crawl');
      }

      if (formData.stops.length < 2) {
        throw new Error('Please add at least 2 stops to your bar crawl');
      }

      // If private, generate invite code
      if (formData.is_private && !formData.invite_code) {
        setFormData(prev => ({
          ...prev,
          invite_code: generateInviteCode()
        }));
      }

      // Create bar crawl
      const { data: barCrawl, error: crawlError } = await supabase
        .from('bar_crawls')
        .insert({
          host_id: user.profile.id,
          name: formData.name,
          description: formData.description,
          start_date: new Date(formData.start_date.getTime() - formData.start_date.getTimezoneOffset() * 60000).toISOString(),
          is_private: formData.is_private,
          invite_code: formData.is_private ? formData.invite_code : null,
          status: 'planned'
        })
        .select()
        .single();

      if (crawlError) throw crawlError;

      // Create bar crawl stops
      const { error: stopsError } = await supabase
        .from('bar_crawl_stops')
        .insert(
          formData.stops.map((stop, index) => ({
            bar_crawl_id: barCrawl.id,
            bar_id: stop.bar_id,
            order_index: index + 1,
            planned_start_time: new Date(stop.planned_start_time.getTime() - stop.planned_start_time.getTimezoneOffset() * 60000).toISOString(),
            planned_end_time: new Date(stop.planned_end_time.getTime() - stop.planned_end_time.getTimezoneOffset() * 60000).toISOString(),
            travel_time_to_next: stop.travel_time_to_next,
            status: 'pending'
          }))
        );

      if (stopsError) throw stopsError;

      // Add creator as first participant
      const { error: participantError } = await supabase
        .from('bar_crawl_participants')
        .insert({
          bar_crawl_id: barCrawl.id,
          user_id: user.profile.id,
          status: 'joined'
        });

      if (participantError) throw participantError;

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bar crawl');
      console.error('Error creating bar crawl:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 2) {
      if (!formData.name.trim()) {
        const errorMsg = 'Please enter a name for your bar crawl';
        setError(errorMsg);
        Alert.alert(
          'Missing Information',
          errorMsg,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      if (!validateDateTime(formData.start_date)) {
        return;
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const calculateTimes = (stops: BarCrawlStop[]): BarCrawlStop[] => {
    let currentTime = new Date(formData.start_date);
    
    return stops.map((stop, index) => {
      const updatedStop = {
        ...stop,
        planned_start_time: new Date(currentTime),
      };
      
      // Calculate end time based on duration
      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + stop.duration_minutes);
      updatedStop.planned_end_time = endTime;
      
      // Update current time for next stop
      currentTime = new Date(endTime);
      if (index < stops.length - 1) {
        currentTime.setMinutes(currentTime.getMinutes() + (stop.travel_time_to_next || DEFAULT_TRAVEL_TIME));
      }
      
      return updatedStop;
    });
  };

  const handleAddStop = (bar: any) => {
    const isAlreadyAdded = formData.stops.some(stop => stop.bar_id === bar.id);
    if (isAlreadyAdded) {
      return;
    }

    const newStop: BarCrawlStop = {
      bar_id: bar.id,
      bar_name: bar.name,
      order_index: formData.stops.length + 1,
      duration_minutes: DEFAULT_DURATION,
      travel_time_to_next: DEFAULT_TRAVEL_TIME,
      planned_start_time: new Date(),
      planned_end_time: new Date()
    };

    const newStops = [...formData.stops, newStop];
    const updatedStops = calculateTimes(newStops);
    
    setFormData(prev => ({
      ...prev,
      stops: updatedStops
    }));
    setSearchQuery('');
  };

  const handleUpdateDuration = (stopId: string, duration: number) => {
    const updatedStops = formData.stops.map(stop => 
      stop.bar_id === stopId ? { ...stop, duration_minutes: duration } : stop
    );
    setFormData(prev => ({
      ...prev,
      stops: calculateTimes(updatedStops),
    }));
  };

  const handleUpdateTravelTime = (stopId: string, travelTime: number) => {
    const updatedStops = formData.stops.map(stop => 
      stop.bar_id === stopId ? { ...stop, travel_time_to_next: travelTime } : stop
    );
    setFormData(prev => ({
      ...prev,
      stops: calculateTimes(updatedStops),
    }));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2].map((step) => (
        <View
          key={step}
          style={[
            styles.step,
            currentStep === step && styles.activeStep,
            currentStep > step && styles.completedStep,
          ]}
        >
          <Text
            style={[
              styles.stepText,
              (currentStep === step || currentStep > step) && styles.activeStepText,
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Crawl Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter a name for your bar crawl"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          placeholder="Describe your bar crawl experience..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Start Date & Time</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={20} color="#666" />
            <Text style={styles.dateTimeText}>
              {format(formData.start_date, 'MMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <MaterialIcons name="access-time" size={20} color="#666" />
            <Text style={styles.dateTimeText}>
              {format(formData.start_date, 'h:mm a')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {dateTimeError && (
          <Text style={styles.errorText}>{dateTimeError}</Text>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={formData.start_date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={now}
            themeVariant="light"
            accentColor="#fb923c"
            textColor="#000000"
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={formData.start_date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            themeVariant="light"
            accentColor="#fb923c"
            textColor="#000000"
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Private Crawl</Text>
        <View style={styles.switchContainer}>
          <Text>Private Crawl</Text>
          <Switch
            value={formData.is_private}
            onValueChange={(value) =>
              setFormData({ ...formData, is_private: value })
            }
          />
        </View>
      </View>
    </View>
  );

  const renderStopsSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, themedStyles.timePickerTitle]}>Add Stops</Text>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { borderColor: themedStyles.timePickerContent.borderTopColor }]}>
        <MaterialIcons name="search" size={24} color="#666" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for bars to add..."
          placeholderTextColor="#666"
        />
        {searching && <ActivityIndicator size="small" color={themedStyles.timePickerContent.borderTopColor} />}
      </View>

      {/* Search Results */}
      {searchQuery.trim().length >= 2 && (
        <View style={styles.searchResults}>
          {filteredBars.length > 0 ? (
            filteredBars.map(bar => (
              <TouchableOpacity
                key={bar.id}
                style={styles.searchResultItem}
                onPress={() => handleAddStop(bar)}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={[styles.searchResultName, themedStyles.timePickerTitle]}>{bar.name}</Text>
                  <Text style={styles.searchResultAddress}>
                    {bar.address} {formatDistance(bar.distance) && ` • ${formatDistance(bar.distance)}`}
                  </Text>
                  {bar.current_wait_estimate > 0 && (
                    <Text style={[styles.searchResultWait, themedStyles.timePickerTitle]}>
                      {bar.current_wait_estimate}min wait • {bar.current_capacity_estimate}% full
                    </Text>
                  )}
                </View>
                {formData.stops.some(stop => stop.bar_id === bar.id) && (
                  <MaterialIcons name="check-circle" size={24} color="#4CD964" />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No bars found matching "{searchQuery}"</Text>
            </View>
          )}
        </View>
      )}

      {/* Selected Stops List */}
      <View style={styles.selectedStopsContainer}>
        <Text style={[styles.sectionTitle, themedStyles.timePickerTitle]}>Selected Stops</Text>
        <View style={styles.selectedStopsScrollContainer}>
          {formData.stops.length > 0 ? (
            <DraggableFlatList
              data={formData.stops}
              onDragEnd={({ data }) => {
                const updatedStops = data.map((stop, index) => ({
                  ...stop,
                  order_index: index + 1
                }));
                setFormData(prev => ({
                  ...prev,
                  stops: calculateTimes(updatedStops)
                }));
              }}
              keyExtractor={item => item.bar_id}
              scrollEnabled={true}
              containerStyle={{ flexGrow: 1 }}
              renderItem={renderStopItem}
            />
          ) : (
            searchQuery.trim().length < 2 && (
              <Text style={styles.emptyStopsText}>No stops added yet. Search for bars above to add them to your crawl.</Text>
            )
          )}
        </View>
      </View>

      {/* Time Pickers */}
      <Modal
        visible={showStartTimePicker || showEndTimePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.timePickerModalContainer}>
          <View style={[styles.timePickerContent, themedStyles.timePickerContent]}>
            <View style={styles.timePickerHeader}>
              <Text style={[styles.timePickerTitle, themedStyles.timePickerTitle]}>
                Select {showStartTimePicker ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }}
                style={styles.timePickerCloseButton}
              >
                <MaterialIcons name="close" size={24} color={themedStyles.timePickerContent.borderTopColor} />
              </TouchableOpacity>
            </View>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={
                  (showStartTimePicker
                    ? formData.stops.find(stop => stop.bar_id === selectedStopId)?.planned_start_time
                    : formData.stops.find(stop => stop.bar_id === selectedStopId)?.planned_end_time) || new Date()
                }
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (event.type !== 'dismissed' && date) {
                    // handleTimeChange(date, showStartTimePicker);
                  }
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }}
                textColor="black"
                themeVariant="light"
              />
            ) : (
              <DateTimePicker
                value={
                  (showStartTimePicker
                    ? formData.stops.find(stop => stop.bar_id === selectedStopId)?.planned_start_time
                    : formData.stops.find(stop => stop.bar_id === selectedStopId)?.planned_end_time) || new Date()
                }
                mode="time"
                display="default"
                onChange={(event, date) => {
                  if (event.type === 'set' && date) {
                    // handleTimeChange(date, showStartTimePicker);
                  }
                  setShowStartTimePicker(false);
                  setShowEndTimePicker(false);
                }}
                textColor="black"
                themeVariant="light"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderStopItem = ({ item, drag, isActive }: any) => (
    <ScaleDecorator>
      <>
        <View
          style={[
            styles.stopItem,
            { borderColor: '#fb923c' },
            isActive && styles.activeStopItem,
          ]}
        >
          <TouchableOpacity 
            onLongPress={drag} 
            style={styles.dragHandle}
            delayLongPress={200}
          >
            <MaterialIcons name="drag-handle" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.stopContent}>
            <View style={styles.stopHeader}>
              <Text style={styles.stopTime}>
                {format(item.planned_start_time, 'h:mm a')}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    stops: prev.stops
                      .filter(stop => stop.bar_id !== item.bar_id)
                      .map((stop, index) => ({
                        ...stop,
                        order_index: index + 1
                      }))
                  }));
                }}
              >
                <MaterialIcons name="remove-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <Text style={styles.stopName}>{item.bar_name}</Text>

            <View style={styles.durationContainer}>
              <Text style={styles.durationLabel}>Duration:</Text>
              <View style={styles.durationButtons}>
                {DURATION_OPTIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      item.duration_minutes === duration && styles.durationButtonSelected
                    ]}
                    onPress={() => handleUpdateDuration(item.bar_id, duration)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      item.duration_minutes === duration && styles.durationButtonTextSelected,
                    ]}>
                      {duration >= 60 ? `${duration / 60}h` : `${duration}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Travel time section - only show for non-last items */}
        {formData.stops[formData.stops.length - 1].bar_id !== item.bar_id && (
          <View style={styles.travelTimeSection}>
            <View style={styles.travelTimeLine} />
            <View style={styles.travelTimeContent}>
              <View style={styles.travelTimeHeader}>
                <MaterialIcons name="directions-walk" size={20} color="#666" />
                <Text style={styles.travelTimeLabel}>Travel Time:</Text>
              </View>
              <View style={styles.travelTimeButtons}>
                {TRAVEL_TIME_OPTIONS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.durationButton,
                      item.travel_time_to_next === time && styles.durationButtonSelected
                    ]}
                    onPress={() => handleUpdateTravelTime(item.bar_id, time)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      item.travel_time_to_next === time && styles.durationButtonTextSelected,
                    ]}>
                      {`${time}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.travelTimeLine} />
          </View>
        )}
      </>
    </ScaleDecorator>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, themedStyles.modalContainer]}>
        <View style={[styles.modalContent, themedStyles.modalContent]}>
          <View style={[styles.header, themedStyles.header]}>
            {currentStep > 1 && (
              <TouchableOpacity onPress={handleBack}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Create Bar Crawl</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.stepContent}>
            {currentStep === 1 ? renderBasicInfo() : renderStopsSelection()}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {loading ? (
              <ActivityIndicator size="large" color="#fb923c" />
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.nextButton, themedStyles.nextButton]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, themedStyles.buttonText]}>
                  {currentStep === 2 ? 'Create Crawl' : 'Next'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeStep: {
    backgroundColor: '#fb923c',
  },
  completedStep: {
    backgroundColor: '#4CD964',
  },
  stepText: {
    color: '#666',
    fontWeight: '600',
  },
  activeStepText: {
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
  },
  activeStopItem: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#fff',
  },
  dragHandle: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  stopContent: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  stopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  durationContainer: {
    marginTop: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  durationButtonSelected: {
    backgroundColor: '#fb923c',
    borderColor: '#fb923c',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  durationButtonTextSelected: {
    color: '#fff',
  },
  travelTimeSection: {
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  travelTimeLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  travelTimeContent: {
    paddingVertical: 8,
  },
  travelTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  travelTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  travelTimeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 28, // Align with the content
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  searchResults: {
    position: 'absolute',
    top: 140, // Adjust based on your layout
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 1,
    elevation: 3,
    maxHeight: '60%',
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultWait: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  selectedStopsContainer: {
    flex: 1,
    marginTop: 16,
  },
  selectedStopsScrollContainer: {
    flex: 1,
    paddingBottom: 80, // Add padding to account for footer height
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyStopsText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  timeButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  timeToText: {
    marginHorizontal: 8,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  timePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  timePickerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  timePickerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateTimeText: {
    color: '#000',
    fontSize: 16,
  },
});
