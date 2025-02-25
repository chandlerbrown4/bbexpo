import React, { 
  useState, 
  useEffect, 
  useLayoutEffect,
  useMemo, 
  useCallback 
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  StatusBar,
  TextInput,
  Modal,
  Switch,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  Linking
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useNavigationState,
} from '@react-navigation/native';
import {
  MaterialCommunityIcons,
  Ionicons,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNearbyBars } from '../hooks/useNearbyBars';
import { useLocation } from '../context/LocationContext';
import { theme as defaultTheme, useTheme } from '../theme/theme';
import { Bar } from '../types/bar';
import { supabase } from '../services/supabase';
import { useBarReports, BarReport } from '../hooks/useBarReports';
import { useBarFavorites } from '../hooks/useBarFavorites';
import { useBarDetails, formatRecurringSpecial, formatHours } from '../hooks/useBarDetails';

interface BarStatus {
  waitMinutes: number | null;
  capacityPercentage: number | null;
  crowdDensity: 'light' | 'moderate' | 'packed' | null;
  coverCharge: number | null;
  lastReportTime: string | null;
  confidence: number;
}

interface BarAttributes {
  musicType?: string;
  atmosphere?: string;
  dressCode?: string;
}

interface BarAmenities {
  poolTables?: boolean;
  darts?: boolean;
  danceFloor?: boolean;
  outdoorSeating?: boolean;
}

interface EnhancedBar extends Bar {
  status: BarStatus;
  attributes?: BarAttributes;
  amenities?: BarAmenities;
  happyHour?: {
    isActive: boolean;
    description: string;
    endsAt: string;
  };
  currentEvent?: {
    name: string;
    type: 'live_music' | 'dj' | 'special_event';
    coverCharge: number;
  };
}

interface FilterOptions {
  maxDistance: number;
  maxWaitTime: number | null;
  crowdDensity: ('light' | 'moderate' | 'packed')[];
  amenities: {
    poolTables: boolean;
    darts: boolean;
    danceFloor: boolean;
    outdoorSeating: boolean;
  };
}

const defaultFilters: FilterOptions = {
  maxDistance: 5,
  maxWaitTime: null,
  crowdDensity: [],
  amenities: {
    poolTables: false,
    darts: false,
    danceFloor: false,
    outdoorSeating: false,
  },
};

const SearchHeader: React.FC<{
  onSearch: (text: string) => void;
  onFilter: () => void;
}> = ({ onSearch, onFilter }) => {
  const theme = useTheme();
  
  const dynamicStyles = useMemo(() => ({
    filterButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    filterButtonText: {
      marginLeft: 4,
      color: theme.colors.text,
    },
    filterButtonTextActive: {
      color: theme.colors.primary,
    },
  }), [theme]);

  return (
    <View style={styles.searchHeader}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bars..."
            onChangeText={onSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={onFilter}>
          <Ionicons name="options" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const metersToMiles = (meters: number): string => {
  const miles = meters / 1609.34;
  return miles < 0.1 ? 'Less than 0.1 mi' : `${miles.toFixed(1)} mi`;
};

const StatusIndicator: React.FC<{
  waitMinutes: number | null;
  capacityPercentage: number | null;
  crowdDensity: string | null;
}> = ({ waitMinutes, capacityPercentage, crowdDensity }) => {
  const getStatusColor = () => {
    if (!waitMinutes) return '#666';
    if (waitMinutes < 15) return '#4CAF50';
    if (waitMinutes < 30) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.statusContainer}>
      <View style={[styles.waitBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.waitText}>{waitMinutes || 0} min</Text>
      </View>
      {capacityPercentage !== null && (
        <View style={styles.capacityBar}>
          <LinearGradient
            colors={['#4CAF50', '#FFC107', '#F44336']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.capacityFill, { width: `${capacityPercentage}%` }]}
          />
        </View>
      )}
      {crowdDensity && (
        <Text style={styles.crowdText}>{crowdDensity}</Text>
      )}
    </View>
  );
};

const FilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}> = ({ visible, onClose, filters, onApplyFilters }) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [distanceInput, setDistanceInput] = useState(filters.maxDistance.toString());
  const [waitTimeInput, setWaitTimeInput] = useState(filters.maxWaitTime?.toString() || '');

  const handleDistanceChange = (value: string) => {
    setDistanceInput(value);
  };

  const handleWaitTimeChange = (value: string) => {
    setWaitTimeInput(value);
  };

  const toggleCrowdDensity = (density: 'light' | 'moderate' | 'packed') => {
    setLocalFilters(prev => ({
      ...prev,
      crowdDensity: prev.crowdDensity.includes(density)
        ? prev.crowdDensity.filter(d => d !== density)
        : [...prev.crowdDensity, density],
    }));
  };

  const toggleAmenity = (amenity: keyof FilterOptions['amenities']) => {
    setLocalFilters(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity],
      },
    }));
  };

  const handleApply = () => {
    // Validate and sanitize inputs before applying
    const distance = Math.min(Math.max(parseFloat(distanceInput) || 0.1, 0.1), 5);
    const waitTime = parseInt(waitTimeInput);

    const sanitizedFilters = {
      ...localFilters,
      maxDistance: distance,
      maxWaitTime: !isNaN(waitTime) && waitTime > 0 ? waitTime : undefined,
    };

    onApplyFilters(sanitizedFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={filterStyles.modalOverlay}>
        <View style={filterStyles.modalContent}>
          <View style={filterStyles.modalHeader}>
            <Text style={filterStyles.modalTitle}>Filter Bars</Text>
            <TouchableOpacity 
              style={filterStyles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.scrollContent}>
            {/* Distance Filter */}
            <View style={filterStyles.filterSection}>
              <View style={filterStyles.filterTitleRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={filterStyles.filterTitle}>Maximum Distance</Text>
              </View>
              <View style={filterStyles.inputContainer}>
                <TextInput
                  style={filterStyles.input}
                  keyboardType="numeric"
                  value={distanceInput}
                  onChangeText={handleDistanceChange}
                  placeholder="Enter distance (0.1-5 miles)"
                />
                <Text style={filterStyles.inputUnit}>miles</Text>
              </View>
            </View>

            {/* Wait Time Filter */}
            <View style={filterStyles.filterSection}>
              <View style={filterStyles.filterTitleRow}>
                <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                <Text style={filterStyles.filterTitle}>Maximum Wait Time</Text>
              </View>
              <View style={filterStyles.inputContainer}>
                <TextInput
                  style={filterStyles.input}
                  keyboardType="numeric"
                  value={waitTimeInput}
                  onChangeText={handleWaitTimeChange}
                  placeholder="Enter max wait time"
                />
                <Text style={filterStyles.inputUnit}>mins</Text>
              </View>
            </View>

            {/* Crowd Density Filter */}
            <View style={filterStyles.filterSection}>
              <View style={filterStyles.filterTitleRow}>
                <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
                <Text style={filterStyles.filterTitle}>Crowd Density</Text>
              </View>
              <View style={filterStyles.densityOptionsContainer}>
                {(['light', 'moderate', 'packed'] as const).map((density) => (
                  <TouchableOpacity
                    key={density}
                    style={[
                      filterStyles.densityOption,
                      localFilters.crowdDensity.includes(density) && {
                        backgroundColor: theme.colors.primary + '15',
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => toggleCrowdDensity(density)}
                  >
                    <Ionicons
                      name={localFilters.crowdDensity.includes(density) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={localFilters.crowdDensity.includes(density) ? theme.colors.primary : '#666'}
                      style={filterStyles.densityIcon}
                    />
                    <Text
                      style={[
                        filterStyles.densityText,
                        localFilters.crowdDensity.includes(density) && {
                          color: theme.colors.primary,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {density.charAt(0).toUpperCase() + density.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amenities Filter */}
            <View style={filterStyles.filterSection}>
              <View style={filterStyles.filterTitleRow}>
                <Ionicons name="wine-outline" size={20} color={theme.colors.primary} />
                <Text style={filterStyles.filterTitle}>Amenities</Text>
              </View>
              <View style={filterStyles.amenitiesContainer}>
                {Object.entries(localFilters.amenities).map(([key, value]) => (
                  <View key={key} style={filterStyles.amenityRow}>
                    <Text style={filterStyles.amenityText}>
                      {formatAmenityName(key)}
                    </Text>
                    <Switch
                      value={value}
                      onValueChange={(newValue) =>
                        toggleAmenity(key as keyof typeof localFilters.amenities)
                      }
                      trackColor={{ false: '#ddd', true: theme.colors.primary + '50' }}
                      thumbColor={value ? theme.colors.primary : '#fff'}
                    />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={filterStyles.modalFooter}>
            <TouchableOpacity
              style={[filterStyles.footerButton, filterStyles.resetButton]}
              onPress={() => {
                setDistanceInput('0.1');
                setWaitTimeInput('');
                setLocalFilters(defaultFilters);
              }}
            >
              <Text style={filterStyles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[filterStyles.footerButton, filterStyles.applyButton]}
              onPress={handleApply}
            >
              <Text style={filterStyles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PhotoGallery: React.FC<{
  photos: { url: string; reportId: string }[];
  onClose: () => void;
  visible: boolean;
  initialIndex?: number;
}> = ({ photos, onClose, visible, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.galleryOverlay}>
        <TouchableOpacity
          style={styles.galleryCloseButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.reportId}
          onMomentumScrollEnd={(e) => {
            setCurrentIndex(
              Math.floor(e.nativeEvent.contentOffset.x / screenWidth)
            );
          }}
          renderItem={({ item }) => (
            <View style={[styles.galleryImage, { width: screenWidth }]}>
              <Image
                source={{ uri: item.url }}
                style={styles.galleryImageContent}
                resizeMode="contain"
              />
            </View>
          )}
        />
        
        <View style={styles.galleryPagination}>
          <Text style={styles.galleryPaginationText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const ReportHistoryModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  bar: Bar;
}> = ({ visible, onClose, bar }) => {
  const theme = useTheme();
  const { reports, loading, error, refreshReports, upvoteReport, downvoteReport } = useBarReports(bar.id);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const photos = useMemo(() => 
    reports
      .filter(report => report.photo_url)
      .map(report => ({
        url: report.photo_url!,
        reportId: report.report_id
      })),
    [reports]
  );

  const formatTime = (date: string) => {
    // Current time in Eastern Time (ET)
    const now = new Date('2024-12-24T18:12:25-05:00');
    
    // Parse the UTC timestamp and convert to local time
    const reportTime = new Date(date);
    
    const diffMs = now.getTime() - reportTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffMins < 1440) { // less than 24 hours
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMins < 10080) { // less than 7 days
      const days = Math.floor(diffMins / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      // Format date as MM/DD/YY
      return reportTime.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        timeZone: 'America/New_York'
      });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return '#4CAF50';
    if (score >= 0.4) return '#FFC107';
    return '#F44336';
  };

  const renderReport = ({ item: report }: { item: BarReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTime}>{formatTime(report.created_at)}</Text>
          {report.confidence_score && (
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(report.confidence_score) }]}>
              <Text style={styles.confidenceText}>
                {Math.round(report.confidence_score * 100)}% confidence
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.reportUser}>by {report.reporter_name || 'Anonymous'}</Text>
      </View>

      <View style={styles.reportContent}>
        <View style={styles.reportStats}>
          <Text style={styles.reportWaitTime}>{report.wait_minutes} min wait</Text>
          <Text style={styles.reportCrowdDensity}>
            {report.crowd_density.charAt(0).toUpperCase() + report.crowd_density.slice(1)} crowd
          </Text>
        </View>

        {report.notes && (
          <Text style={styles.reportNotes}>{report.notes}</Text>
        )}

        {report.photo_url && (
          <TouchableOpacity
            onPress={() => {
              const index = photos.findIndex(p => p.url === report.photo_url);
              setSelectedPhotoIndex(index);
              setShowGallery(true);
            }}
          >
            <Image
              source={{ uri: report.photo_url }}
              style={styles.reportPhoto}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.reportFooter}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            report.user_vote === 1 && styles.voteButtonActive
          ]}
          onPress={() => upvoteReport(report.report_id)}
        >
          <Ionicons
            name={report.user_vote === 1 ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={report.user_vote === 1 ? theme.colors.primary : theme.colors.text}
          />
          <Text style={[
            styles.voteCount,
            report.user_vote === 1 && styles.voteCountActive
          ]}>
            {report.upvotes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            report.user_vote === -1 && styles.voteButtonActive
          ]}
          onPress={() => downvoteReport(report.report_id)}
        >
          <Ionicons
            name={report.user_vote === -1 ? "thumbs-down" : "thumbs-down-outline"}
            size={20}
            color={report.user_vote === -1 ? theme.colors.error : theme.colors.text}
          />
          <Text style={[
            styles.voteCount,
            report.user_vote === -1 && styles.voteCountActive
          ]}>
            {report.downvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.historyTitle}>Line History - {bar.name}</Text>
          <View style={styles.headerButton} />
        </View>

        {loading ? (
          <ActivityIndicator style={styles.historyLoading} />
        ) : error ? (
          <Text style={styles.historyError}>{error}</Text>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReport}
            keyExtractor={item => item.report_id}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={refreshReports}
              />
            }
            ListEmptyComponent={
              <Text style={styles.historyEmpty}>No line reports yet</Text>
            }
          />
        )}
      </SafeAreaView>

      <PhotoGallery
        photos={photos}
        visible={showGallery}
        onClose={() => setShowGallery(false)}
        initialIndex={selectedPhotoIndex}
      />
    </Modal>
  );
};

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  bar: Bar;
  onSubmit: (report: LineReport) => Promise<void>;
}

interface LineReport {
  barId: string;                                           // UUID string
  waitMinutes: number;                                     // Integer
  capacityPercentage: number;                             // Integer
  crowdDensity: 'light' | 'moderate' | 'packed';          // Text (enum)
  coverCharge: number;                                     // Numeric
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, bar, onSubmit }) => {
  const theme = useTheme();
  const { location, errorMsg, loading: locationLoading, requestLocationPermission } = useLocation();
  const { isFavorite, toggleFavorite } = useBarFavorites();
  const [waitMinutes, setWaitMinutes] = useState('');
  const [crowdDensity, setCrowdDensity] = useState<'light' | 'moderate' | 'packed'>('moderate');
  const [capacityPercentage, setCapacityPercentage] = useState('');
  const [coverCharge, setCoverCharge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !location) {
      requestLocationPermission();
    }
  }, [visible, location, requestLocationPermission]);

  const handleSubmit = async () => {
    if (!location) {
      setError('Location permission is required to submit a report. Please enable location services and try again.');
      return;
    }

    if (!waitMinutes || parseInt(waitMinutes) < 0) {
      setError('Please enter a valid wait time');
      return;
    }

    if (!capacityPercentage || parseInt(capacityPercentage) < 0 || parseInt(capacityPercentage) > 100) {
      setError('Please enter a valid capacity percentage (0-100)');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        barId: bar.id,
        waitMinutes: parseInt(waitMinutes),
        capacityPercentage: parseInt(capacityPercentage),
        crowdDensity,
        coverCharge: parseFloat(coverCharge) || 0
      });

      // Clear form
      setWaitMinutes('');
      setCrowdDensity('moderate');
      setCapacityPercentage('');
      setCoverCharge('');
      onClose();
    } catch (err) {
      console.error('Modal submission error:', err);
      // Get the error message from the Error object
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit report';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicStyles = useMemo(() => ({
    filterButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    filterButtonText: {
      marginLeft: 4,
      color: theme.colors.text,
    },
    filterButtonTextActive: {
      color: theme.colors.primary,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    cancelButton: {
      backgroundColor: '#f5f5f5',
    },
    submitButton: {
      backgroundColor: '#4CAF50',
    },
    submitButtonText: {
      color: 'white',
    },
  }), [theme]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Line at {bar.name}</Text>
            <TouchableOpacity onPress={onClose} disabled={submitting}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Location Warning */}
            {!location && !locationLoading && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={24} color={theme.colors.warning} />
                <Text style={styles.warningText}>
                  {errorMsg || 'Location permission is required to submit a report. Please enable location services.'}
                </Text>
              </View>
            )}

            {/* Wait Time Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Wait Time (minutes)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={waitMinutes}
                onChangeText={setWaitMinutes}
                placeholder="Enter wait time"
                editable={!submitting}
              />
            </View>

            {/* Capacity Percentage */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Capacity Percentage (0-100)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={capacityPercentage}
                onChangeText={setCapacityPercentage}
                placeholder="Enter capacity percentage"
                editable={!submitting}
              />
            </View>

            {/* Cover Charge */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Cover Charge ($)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={coverCharge}
                onChangeText={setCoverCharge}
                placeholder="Enter cover charge (optional)"
                editable={!submitting}
              />
            </View>

            {/* Crowd Density Selection */}
            <Text style={styles.inputLabel}>Crowd Density</Text>
            <View style={styles.crowdDensityContainer}>
              {['light', 'moderate', 'packed'].map((density) => (
                <TouchableOpacity
                  key={density}
                  style={[
                    styles.densityOption,
                    crowdDensity === density && {
                      backgroundColor: theme.colors.primary + '20',
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => setCrowdDensity(density)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.densityText,
                      crowdDensity === density && { color: theme.colors.primary },
                    ]}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.submitButton,
                (!location || submitting || locationLoading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={!location || submitting || locationLoading}
            >
              {submitting || locationLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Info Modal Component
const InfoModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  bar: Bar;
}> = ({ visible, onClose, bar }) => {
  const theme = useTheme();
  const { contact, events, specials, hours, isLoading, error } = useBarDetails(bar.id);
  
  const infoStyles = StyleSheet.create({
    infoModalContent: {
      maxHeight: '80%',
    },
    infoSection: {
      marginBottom: 24,
    },
    infoSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoSectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
      color: theme.colors.text,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    infoLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    infoValue: {
      fontSize: 16,
      color: theme.colors.text,
    },
    link: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    rideButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 8,
    },
    rideButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    rideButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    specialsList: {
      marginTop: 8,
    },
    specialItem: {
      marginBottom: 12,
    },
    specialDay: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    specialDescription: {
      fontSize: 16,
      color: theme.colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 20,
    },
  });

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWebsitePress = (website: string) => {
    Linking.openURL(website.startsWith('http') ? website : `https://${website}`);
  };

  const handleAddressPress = (address: string) => {
    Linking.openURL(`https://maps.google.com?q=${encodeURIComponent(address)}`);
  };

  const handleRidePress = (service: 'uber' | 'lyft') => {
    // Use the bar's exact coordinates and name
    const destination = {
      latitude: bar.latitude,
      longitude: bar.longitude,
      name: bar.name,
      address: bar.address
    };

    console.log('Ride Press:', {
      service,
      destination
    });

    // Try app URLs first with exact coordinates
    const appUrl = service === 'uber'
      ? `uber://?action=setPickup&pickup=my_location`
        + `&dropoff[latitude]=${destination.latitude}`
        + `&dropoff[longitude]=${destination.longitude}`
        + `&dropoff[nickname]=${encodeURIComponent(destination.name)}`
        + `&dropoff[formatted_address]=${encodeURIComponent(destination.address)}`
      : `lyft://ridetype?id=lyft&pickup=my_location`
        + `&destination[latitude]=${destination.latitude}`
        + `&destination[longitude]=${destination.longitude}`
        + `&destination[address]=${encodeURIComponent(destination.address)}`;

    const webUrl = service === 'uber'
      ? `https://m.uber.com/ul?action=setPickup&pickup=my_location`
        + `&dropoff[latitude]=${destination.latitude}`
        + `&dropoff[longitude]=${destination.longitude}`
        + `&dropoff[nickname]=${encodeURIComponent(destination.name)}`
        + `&dropoff[formatted_address]=${encodeURIComponent(destination.address)}`
      : `https://ride.lyft.com/ridetype?id=lyft&pickup=my_location`
        + `&destination[latitude]=${destination.latitude}`
        + `&destination[longitude]=${destination.longitude}`
        + `&destination[address]=${encodeURIComponent(destination.address)}`;

    console.log('Attempting to open app URL:', {
      service,
      appUrl
    });

    Linking.canOpenURL(appUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(appUrl);
        } else {
          console.log('App not installed, falling back to web URL:', {
            service,
            webUrl
          });
          return Linking.openURL(webUrl);
        }
      })
      .then(() => {
        console.log('Successfully opened URL for', service);
      })
      .catch(error => {
        console.error('Error opening URL:', {
          service,
          error: error.message
        });
        // If there's an error with the app URL, try the web URL as fallback
        console.log('Error with app URL, trying web URL:', {
          service,
          webUrl
        });
        Linking.openURL(webUrl).catch(webError => {
          console.error('Error opening web URL:', {
            service,
            error: webError.message
          });
        });
      });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, infoStyles.infoModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{bar.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={infoStyles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : error ? (
            <Text style={infoStyles.errorText}>{error}</Text>
          ) : (
            <ScrollView style={styles.modalBody}>
              {/* Contact Information */}
              <View style={infoStyles.infoSection}>
                <View style={infoStyles.infoSectionHeader}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                  <Text style={infoStyles.infoSectionTitle}>Contact</Text>
                </View>
                {contact.phone && (
                  <TouchableOpacity 
                    style={infoStyles.infoRow}
                    onPress={() => handlePhonePress(contact.phone!)}
                  >
                    <Text style={infoStyles.infoLabel}>Phone</Text>
                    <Text style={[infoStyles.infoValue, infoStyles.link]}>{contact.phone}</Text>
                  </TouchableOpacity>
                )}
                {contact.website && (
                  <TouchableOpacity 
                    style={infoStyles.infoRow}
                    onPress={() => handleWebsitePress(contact.website!)}
                  >
                    <Text style={infoStyles.infoLabel}>Website</Text>
                    <Text style={[infoStyles.infoValue, infoStyles.link]}>{contact.website}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Hours & Location */}
              <View style={infoStyles.infoSection}>
                <View style={infoStyles.infoSectionHeader}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={infoStyles.infoSectionTitle}>Hours & Location</Text>
                </View>
                <View style={infoStyles.infoRow}>
                  <Text style={infoStyles.infoLabel}>Today's Hours</Text>
                  <Text style={infoStyles.infoValue}>{formatHours(hours)}</Text>
                </View>
                <TouchableOpacity 
                  style={infoStyles.infoRow}
                  onPress={() => handleAddressPress(bar.address)}
                >
                  <Text style={infoStyles.infoLabel}>Address</Text>
                  <Text style={[infoStyles.infoValue, infoStyles.link]}>{bar.address}</Text>
                </TouchableOpacity>
              </View>

              {/* Ride Services */}
              <View style={infoStyles.infoSection}>
                <View style={infoStyles.infoSectionHeader}>
                  <Ionicons name="car-outline" size={20} color={theme.colors.primary} />
                  <Text style={infoStyles.infoSectionTitle}>Get a Ride</Text>
                </View>
                <View style={infoStyles.rideButtons}>
                  <TouchableOpacity 
                    style={infoStyles.rideButton}
                    onPress={() => handleRidePress('uber')}
                  >
                    <Text style={infoStyles.rideButtonText}>Uber</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={infoStyles.rideButton}
                    onPress={() => handleRidePress('lyft')}
                  >
                    <Text style={infoStyles.rideButtonText}>Lyft</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Events */}
              {events.length > 0 && (
                <View style={infoStyles.infoSection}>
                  <View style={infoStyles.infoSectionHeader}>
                    <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                    <Text style={infoStyles.infoSectionTitle}>Upcoming Events</Text>
                  </View>
                  <View style={infoStyles.specialsList}>
                    {events.map(event => (
                      <View key={event.id} style={infoStyles.specialItem}>
                        <Text style={infoStyles.specialDay}>
                          {event.startTime.toLocaleDateString()} - {event.name}
                        </Text>
                        <Text style={infoStyles.specialDescription}>
                          {event.description}
                          {event.coverCharge ? ` ($${event.coverCharge} cover)` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Specials */}
              {specials.length > 0 && (
                <View style={infoStyles.infoSection}>
                  <View style={infoStyles.infoSectionHeader}>
                    <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
                    <Text style={infoStyles.infoSectionTitle}>Specials</Text>
                  </View>
                  <View style={infoStyles.specialsList}>
                    {specials.map(special => (
                      <View key={special.id} style={infoStyles.specialItem}>
                        <Text style={infoStyles.specialDay}>
                          {special.recurring ? formatRecurringSpecial(special) : special.startTime.toLocaleDateString()}
                          {' - '}{special.name}
                        </Text>
                        <Text style={infoStyles.specialDescription}>
                          {special.description}
                          {special.price ? ` ($${special.price})` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export const LineTimesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const navState = useNavigationState(state => state);
  const { location } = useLocation();
  const { isFavorite, toggleFavorite } = useBarFavorites();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedBar, setExpandedBar] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Round the distance to the nearest meter
  const radiusMeters = Math.round(filters.maxDistance * 1609.34);
  const { bars, loading, error, refreshBars } = useNearbyBars(radiusMeters);

  const filteredBars = useMemo(() => {
    return bars
      .map(bar => ({
        ...bar,
        status: {
          waitMinutes: bar.current_wait_minutes || 0,
          capacityPercentage: bar.capacity_percentage || null,
          crowdDensity: bar.crowd_density as BarStatus['crowdDensity'],
          coverCharge: null,
          lastReportTime: null,
          confidence: 1,
        },
      }))
      .filter(bar => {
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = bar.name.toLowerCase().includes(query);
          const matchesAddress = bar.address.toLowerCase().includes(query);
          if (!matchesName && !matchesAddress) return false;
        }

        // Wait time filter
        if (filters.maxWaitTime !== null && bar.current_wait_minutes !== null) {
          if (bar.current_wait_minutes > filters.maxWaitTime) return false;
        }

        // Crowd density filter
        if (filters.crowdDensity.length > 0 && bar.crowd_density) {
          if (!filters.crowdDensity.includes(bar.crowd_density as any)) return false;
        }

        // Amenities filter
        const hasSelectedAmenities = Object.entries(filters.amenities)
          .some(([key, value]) => value && bar.amenities?.[key as keyof typeof bar.amenities]);
        
        if (hasSelectedAmenities) {
          const matchesAllSelected = Object.entries(filters.amenities)
            .every(([key, value]) => !value || bar.amenities?.[key as keyof typeof bar.amenities]);
          if (!matchesAllSelected) return false;
        }

        // Favorites filter
        if (showFavoritesOnly && !isFavorite(bar.id)) return false;

        return true;
      });
  }, [bars, searchQuery, filters, showFavoritesOnly, isFavorite]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleFilter = () => {
    setShowFilters(true);
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBars();
    setRefreshing(false);
  }, [refreshBars]);

  const renderBar = ({ item }: { item: EnhancedBar }) => (
    <TouchableOpacity
      style={[
        styles.barCard,
        expandedBar === item.id && styles.expandedCard
      ]}
      onPress={() => setExpandedBar(expandedBar === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.barHeader}>
        <View style={styles.barInfo}>
          <View style={styles.barTitleContainer}>
            <Text style={styles.barName}>{item.name}</Text>
            {isFavorite(item.id) && (
              <Ionicons
                name="star"
                size={16}
                color={theme.colors.primary}
                style={styles.favoriteIcon}
              />
            )}
          </View>
          <Text style={styles.barAddress}>{item.address}</Text>
          <Text style={styles.distance}>
            {metersToMiles(item.distance_meters)} away
          </Text>
        </View>
        <StatusIndicator
          waitMinutes={item.status.waitMinutes}
          capacityPercentage={item.status.capacityPercentage}
          crowdDensity={item.status.crowdDensity}
        />
      </View>
      
      {expandedBar === item.id && (
        <View style={styles.expandedContent}>
          {item.amenities && (
            <View style={styles.amenitiesContainer}>
              {Object.entries(item.amenities).map(([key, value]) => (
                value && (
                  <View key={key} style={styles.amenityBadge}>
                    <MaterialCommunityIcons
                      name={getAmenityIcon(key)}
                      size={16}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.amenityText}>
                      {formatAmenityName(key)}
                    </Text>
                  </View>
                )
              ))}
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedBar(item);
                setShowReportModal(true);
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Report Line</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedBar(item);
                setShowHistory(true);
              }}
            >
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>View History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedBar(item);
                setShowInfo(true);
              }}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Info</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Ionicons
                name={isFavorite(item.id) ? "star" : "star-outline"}
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>{isFavorite(item.id) ? 'Unfavorite' : 'Favorite'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const handleReport = async (report: LineReport) => {
    if (!location) {
      throw new Error('Location permission is required to submit a report');
    }

    try {
      const params = {
        p_bar_id: report.barId,
        p_wait_minutes: Math.round(report.waitMinutes),
        p_capacity_percentage: Math.round(report.capacityPercentage),
        p_crowd_density: report.crowdDensity,
        p_cover_charge: Number(report.coverCharge) || 0,
        p_user_lat: Number(location.latitude),
        p_user_lng: Number(location.longitude)
      };

      console.log('Submitting report with params:', params);
      const { data, error } = await supabase.rpc(
        'submit_line_report',
        params
      );

      console.log('Response data:', data);
      console.log('Response error:', error);

      if (error) {
        throw new Error(error.details || error.message || 'Failed to submit report');
      }

      // The response is an array with one object
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format from server');
      }

      const result = data[0];
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }

      console.log('Report submitted successfully:', result);
      refreshBars();
    } catch (err) {
      console.error('Error in handleReport:', err);
      throw err;
    }
  };

  const dynamicStyles = useMemo(() => ({
    filterButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterButtonActive: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    filterButtonText: {
      marginLeft: 4,
      color: theme.colors.text,
    },
    filterButtonTextActive: {
      color: theme.colors.primary,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  }), [theme]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons 
            name={showFavoritesOnly ? "star" : "star-outline"} 
            size={24} 
            color={showFavoritesOnly ? theme.colors.primary : theme.colors.text} 
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, showFavoritesOnly, theme]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <SearchHeader 
        onSearch={handleSearch} 
        onFilter={handleFilter}
      />
      <FlatList
        data={filteredBars}
        renderItem={renderBar}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery || Object.values(filters.amenities).some(v => v)
              ? 'No bars match your search criteria'
              : 'No bars found nearby'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
      
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />

      {selectedBar && showReportModal && (
        <ReportModal
          visible={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedBar(null);
          }}
          bar={selectedBar}
          onSubmit={handleReport}
        />
      )}

      {selectedBar && showHistory && (
        <ReportHistoryModal
          visible={showHistory}
          onClose={() => {
            setShowHistory(false);
            setSelectedBar(null);
          }}
          bar={selectedBar}
        />
      )}

      {selectedBar && showInfo && (
        <InfoModal
          visible={showInfo}
          onClose={() => {
            setShowInfo(false);
            setSelectedBar(null);
          }}
          bar={selectedBar}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setSelectedBar(bars[0]); // For quick testing, use first bar
          setShowReportModal(true);
        }}
      >
        <MaterialCommunityIcons
          name="clock-plus-outline"
          size={24}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
};

const getAmenityIcon = (amenity: string): string => {
  const icons: Record<string, string> = {
    poolTables: 'pool',
    darts: 'target',
    danceFloor: 'dance-ballroom',
    outdoorSeating: 'umbrella-beach',
  };
  return icons[amenity] || 'help-circle-outline';
};

const formatAmenityName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  barCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expandedCard: {
    elevation: 4,
    shadowOpacity: 0.15,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barInfo: {
    flex: 1,
  },
  barTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  favoriteIcon: {
    marginLeft: 4,
  },
  barAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: '#888',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  waitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 4,
  },
  waitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  capacityBar: {
    width: 100,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  capacityFill: {
    height: '100%',
  },
  crowdText: {
    fontSize: 12,
    color: '#666',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
  densityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  densityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  crowdDensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  historyLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyError: {
    padding: 16,
    color: 'red',
    textAlign: 'center',
  },
  historyEmpty: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
  reportCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTime: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  reportUser: {
    fontSize: 14,
    color: '#666',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reportWaitTime: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 16,
  },
  reportCrowdDensity: {
    fontSize: 16,
    color: '#666',
  },
  reportNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reportPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  reportFooter: {
    flexDirection: 'row',
    marginTop: 8,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  voteCount: {
    marginLeft: 4,
    color: '#666',
  },
  galleryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  galleryCloseButton: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1,
  },
  galleryImage: {
    flex: 1,
    justifyContent: 'center',
  },
  galleryImageContent: {
    width: '100%',
    height: '100%',
  },
  galleryPagination: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  galleryPaginationText: {
    color: 'white',
    fontSize: 16,
  },
  warningContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 16,
    color: '#666',
  },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    gap: 16
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4
  },
  voteButtonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },
  voteCount: {
    fontSize: 14,
    color: '#666'
  },
  voteCountActive: {
    color: '#000'
  },
});

const filterStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputUnit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  densityOptionsContainer: {
    gap: 12,
  },
  densityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  densityIcon: {
    marginRight: 8,
  },
  densityText: {
    fontSize: 16,
    color: '#666',
  },
  amenitiesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  amenityText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
