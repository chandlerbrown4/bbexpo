import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-js';
import { useNavigation } from '@react-navigation/native';
import { AvatarPickerModal } from './AvatarPickerModal';
import { useProfile } from '../../hooks/useProfile';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdate?: () => void;
}

interface NotificationSettings {
  new_match: boolean;
  new_message: boolean;
  new_comment: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private';
  location_visibility: 'public' | 'friends' | 'private';
}

const BAR_TYPES = ['bar', 'pub', 'club'];
const VISIBILITY_OPTIONS = ['public', 'friends', 'private'];

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, onProfileUpdate }) => {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } = useUserPreferences();
  const { profile, loading: profileLoading } = useProfile();
  const navigation = useNavigation();
  
  const [editMode, setEditMode] = useState<'profile' | 'password' | null>(null);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(profile?.avatar_url || '');

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setCurrentAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleBarTypeToggle = async (type: string) => {
    const currentTypes = [...preferences.preferred_bar_types];
    const index = currentTypes.indexOf(type);
    
    if (index >= 0) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }
    
    await updatePreferences({
      preferred_bar_types: currentTypes
    });
  };

  const handleNotificationToggle = async (key: keyof NotificationSettings) => {
    const newSettings = {
      ...preferences.notification_settings,
      [key]: !preferences.notification_settings[key]
    };
    
    await updatePreferences({
      notification_settings: newSettings
    });
  };

  const handlePrivacyChange = async (key: keyof PrivacySettings, value: 'public' | 'friends' | 'private') => {
    const newSettings = {
      ...preferences.privacy_settings,
      [key]: value
    };
    
    await updatePreferences({
      privacy_settings: newSettings
    });
  };

  const handleRadiusChange = async (value: string) => {
    if (!preferences) return;
    const radius = parseFloat(value);
    if (!isNaN(radius) && radius > 0) {
      await updatePreferences({
        preferred_radius: radius
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;
    setUpdating(true);

    try {
      const { error } = await supabase.rpc('update_user_profile', {
        p_auth_id: user.id,
        p_display_name: displayName || profile.display_name,
        p_bio: bio || profile.bio,
        p_avatar_url: currentAvatarUrl,
        p_date_of_birth: profile.date_of_birth || null
      });

      if (error) throw error;
      
      onProfileUpdate?.();
      setEditMode(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (!user || !profile) return;
    
    try {
      const { error } = await supabase.rpc('update_user_profile', {
        p_auth_id: user.id,
        p_display_name: profile.display_name,
        p_bio: profile.bio,
        p_avatar_url: avatarUrl,
        p_date_of_birth: profile.date_of_birth || null
      });

      if (error) throw error;

      setCurrentAvatarUrl(avatarUrl);
      setShowAvatarPicker(false);
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      setEditMode(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      // @ts-ignore - We know this screen exists
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (profileLoading || prefsLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setEditMode('profile')}
            >
              <Text>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setEditMode('password')}
            >
              <Text>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setShowAvatarPicker(true)}
            >
              <Text>Change Profile Picture</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.option}>
              <Text>Search Radius (miles)</Text>
              <TextInput
                style={styles.radiusInput}
                value={preferences?.preferred_radius.toString()}
                onChangeText={handleRadiusChange}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.barTypesContainer}>
              <Text style={styles.subsectionTitle}>Preferred Bar Types</Text>
              {BAR_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.barTypeOption}
                  onPress={() => handleBarTypeToggle(type)}
                >
                  <Text style={styles.barTypeText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  <Switch
                    value={preferences.preferred_bar_types.includes(type)}
                    onValueChange={() => handleBarTypeToggle(type)}
                    trackColor={{ false: '#767577', true: '#FFA500' }}
                    thumbColor={preferences.preferred_bar_types.includes(type) ? '#fff' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {Object.entries(preferences.notification_settings).map(([key, value]) => (
              <View key={key} style={styles.option}>
                <Text>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Text>
                <Switch
                  value={value}
                  onValueChange={() => handleNotificationToggle(key as keyof NotificationSettings)}
                  trackColor={{ false: '#767577', true: '#FFA500' }}
                  thumbColor={value ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
            ))}
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            {Object.entries(preferences.privacy_settings).map(([key, value]) => (
              <View key={key} style={styles.privacyOption}>
                <Text>{key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Text>
                <View style={styles.visibilityButtons}>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.visibilityButton,
                        value === option && styles.visibilityButtonActive
                      ]}
                      onPress={() => handlePrivacyChange(
                        key as keyof PrivacySettings,
                        option as 'public' | 'friends' | 'private'
                      )}
                    >
                      <Text style={[
                        styles.visibilityButtonText,
                        value === option && styles.visibilityButtonTextActive
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={editMode === 'profile'}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.editContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setEditMode(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={handleUpdateProfile} disabled={updating}>
                <Text style={{ color: '#FFA500' }}>
                  {updating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editContent}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowAvatarPicker(true)}
              >
                <Text style={styles.avatarButtonText}>Change Profile Picture</Text>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Enter bio"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={editMode === 'password'}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.editContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setEditMode(null)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Change Password</Text>
              <TouchableOpacity onPress={handleUpdatePassword} disabled={updating}>
                <Text style={{ color: '#FFA500' }}>
                  {updating ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Enter new password"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Confirm new password"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>

        <AvatarPickerModal
          visible={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onSelectAvatar={handleUpdateAvatar}
          currentAvatarUrl={currentAvatarUrl}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    width: 60,
    textAlign: 'center',
  },
  barTypesContainer: {
    marginTop: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  barTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  barTypeText: {
    fontSize: 14,
  },
  privacyOption: {
    marginVertical: 8,
  },
  visibilityButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  visibilityButtonActive: {
    backgroundColor: '#FFA500',
    borderColor: '#FFA500',
  },
  visibilityButtonText: {
    fontSize: 12,
    color: '#666',
  },
  visibilityButtonTextActive: {
    color: '#fff',
  },
  signOutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editContent: {
    padding: 16,
  },
  avatarButton: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarButtonText: {
    color: '#FFA500',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default SettingsModal;
