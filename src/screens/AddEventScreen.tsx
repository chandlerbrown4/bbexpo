import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextStyle,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useEvents } from '../hooks/useEvents';
import { Input } from '../components/Input';
import { useTheme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';

type AddEventScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEvent'>;
type AddEventScreenRouteProp = RouteProp<RootStackParamList, 'AddEvent'>;

const TAGS = [
  'Live Music',
  'DJ',
  'Karaoke',
  'Trivia',
  'Happy Hour',
  'Sports',
  'Food Special',
  'Dance',
  'Comedy',
  'Other',
];

export const AddEventScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddEventScreenNavigationProp>();
  const route = useRoute<AddEventScreenRouteProp>();
  const { barId } = route.params;
  const { addEvent, loading } = useEvents();

  interface FormData {
    title: string;
    description: string;
    date: Date;
    startTime: string;
    endTime: string;
    coverCharge: string;
    imageUrl: string;
    tags: string[];
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: new Date(),
    startTime: '',
    endTime: '',
    coverCharge: '',
    imageUrl: '',
    tags: [],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [error, setError] = useState('');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    imagePreviewContainer: {
      width: '100%',
      height: 200,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    addImageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    addImageText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    pickerButton: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    },
    pickerButtonText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.text,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -theme.spacing.xs,
    },
    tagButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      margin: theme.spacing.xs,
    },
    selectedTagButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tagText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
    },
    selectedTagText: {
      color: theme.colors.white,
      fontWeight: theme.typography.weights.semibold,
    },
    errorText: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: theme.typography.sizes.md,
      color: theme.colors.white,
      fontWeight: theme.typography.weights.semibold,
    },
  });

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, imageUrl: result.assets[0].uri }));
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleDateConfirm = (date: Date) => {
    setFormData((prev) => ({ ...prev, date }));
    setShowDatePicker(false);
  };

  const handleStartTimeConfirm = (date: Date) => {
    setFormData((prev) => ({ ...prev, startTime: format(date, 'HH:mm') }));
    setShowStartTimePicker(false);
  };

  const handleEndTimeConfirm = (date: Date) => {
    setFormData((prev) => ({ ...prev, endTime: format(date, 'HH:mm') }));
    setShowEndTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Please enter an event title');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter an event description');
      return;
    }

    if (formData.tags.length === 0) {
      setError('Please select at least one tag');
      return;
    }

    try {
      const coverCharge = formData.coverCharge.trim() === '' 
        ? null 
        : parseFloat(formData.coverCharge);

      await addEvent({
        bar_id: barId,
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        coverCharge,
        imageUrl: formData.imageUrl,
        tags: formData.tags,
      });

      Alert.alert('Success', 'Event added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.label}>Event Image</Text>
          <TouchableOpacity
            style={styles.imagePreviewContainer}
            onPress={handleImagePick}>
            {formData.imageUrl ? (
              <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.addImageText}>Tap to add an image</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Input
            label="Event Title"
            value={formData.title}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
            placeholder="Enter event title"
          />
        </View>

        <View style={styles.section}>
          <Input
            label="Description"
            value={formData.description}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
            placeholder="Enter event description"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerButtonText}>
              {format(formData.date, 'MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <TouchableOpacity
              style={[styles.pickerButton, { flex: 1 }]}
              onPress={() => setShowStartTimePicker(true)}>
              <Text style={styles.pickerButtonText}>
                {formData.startTime || 'Start Time'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pickerButton, { flex: 1 }]}
              onPress={() => setShowEndTimePicker(true)}>
              <Text style={styles.pickerButtonText}>
                {formData.endTime || 'End Time'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Input
            label="Cover Charge"
            value={formData.coverCharge}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, coverCharge: text }))}
            placeholder="Enter cover charge amount"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.tagsContainer}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  formData.tags.includes(tag) && styles.selectedTagButton,
                ]}
                onPress={() => toggleTag(tag)}>
                <Text
                  style={[
                    styles.tagText,
                    formData.tags.includes(tag) && styles.selectedTagText,
                  ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={(_, date) => date && handleDateConfirm(date)}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={formData.startTime ? parse(formData.startTime, 'HH:mm', new Date()) : new Date()}
          mode="time"
          display="default"
          onChange={(_, date) => date && handleStartTimeConfirm(date)}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={formData.endTime ? parse(formData.endTime, 'HH:mm', new Date()) : new Date()}
          mode="time"
          display="default"
          onChange={(_, date) => date && handleEndTimeConfirm(date)}
        />
      )}
    </KeyboardAvoidingView>
  );
};
