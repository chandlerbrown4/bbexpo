/**
 * Settings Screen
 * 
 * User preferences and app configuration management screen.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │ Notifications                   │
 * │ ┌───────────────────┐ ┌──────┐ │
 * │ │ Push Notifications│ │ ✓ ON │ │
 * │ └───────────────────┘ └──────┘ │
 * │ ┌───────────────────┐ ┌──────┐ │
 * │ │ Line Time Alerts  │ │ ✓ ON │ │
 * │ └───────────────────┘ └──────┘ │
 * ├─────────────────────────────────┤
 * │ Privacy                         │
 * │ ┌───────────────────┐ ┌──────┐ │
 * │ │ Location Services │ │ ✓ ON │ │
 * │ └───────────────────┘ └──────┘ │
 * │ ┌───────────────────┐ ┌──────┐ │
 * │ │ Share Analytics   │ │ ✓ ON │ │
 * │ └───────────────────┘ └──────┘ │
 * │ ┌───────────────────────────┐  │
 * │ │ Clear App Data            │  │
 * │ └───────────────────────────┘  │
 * ├─────────────────────────────────┤
 * │ Support                         │
 * │ ┌───────────────────────────┐  │
 * │ │ Send Feedback             │  │
 * │ └───────────────────────────┘  │
 * │ ┌───────────────────────────┐  │
 * │ │ Privacy Policy            │  │
 * │ └───────────────────────────┘  │
 * │ ┌───────────────────────────┐  │
 * │ │ Terms of Service          │  │
 * │ └───────────────────────────┘  │
 * └─────────────────────────────────┘
 * 
 * Local Storage:
 * - pushNotifications: boolean
 * - lineTimeAlerts: boolean
 * - locationServices: boolean
 * - analytics: boolean
 * 
 * Settings Sections:
 * 1. Notifications
 *    - Push notifications toggle
 *    - Line time alerts toggle
 *    - Affects: Expo notifications
 * 
 * 2. Privacy
 *    - Location services toggle
 *    - Analytics sharing toggle
 *    - Data clearing functionality
 *    - Affects: Location tracking, analytics
 * 
 * 3. Support
 *    - Feedback submission
 *    - Policy documents
 *    - Terms of service
 *    - Affects: External links
 * 
 * Data Management:
 * - AsyncStorage for persistent settings
 * - Immediate UI updates on changes
 * - Confirmation dialogs for destructive actions
 * - Deep linking for external URLs
 * 
 * Components:
 * - Section headers with titles
 * - Toggle switches for boolean settings
 * - Action buttons for operations
 * - External link handlers
 * - Alert dialogs for confirmations
 * 
 * Error Handling:
 * - Storage read/write failures
 * - External URL errors
 * - Data clearing failures
 * - Network connectivity issues
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

interface SettingsSection {
  title: string;
  settings: Setting[];
}

interface Setting {
  key: string;
  title: string;
  type: 'toggle' | 'button' | 'link';
  value?: boolean;
  onPress?: () => void;
  url?: string;
}

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsSection[]>([
    {
      title: 'Notifications',
      settings: [
        {
          key: 'pushNotifications',
          title: 'Push Notifications',
          type: 'toggle',
          value: true,
        },
        {
          key: 'lineTimeAlerts',
          title: 'Line Time Alerts',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Privacy',
      settings: [
        {
          key: 'locationServices',
          title: 'Location Services',
          type: 'toggle',
          value: true,
        },
        {
          key: 'analytics',
          title: 'Share Analytics',
          type: 'toggle',
          value: true,
        },
        {
          key: 'clearData',
          title: 'Clear App Data',
          type: 'button',
          onPress: () => handleClearData(),
        },
      ],
    },
    {
      title: 'Support',
      settings: [
        {
          key: 'feedback',
          title: 'Send Feedback',
          type: 'button',
          onPress: () => handleSendFeedback(),
        },
        {
          key: 'privacyPolicy',
          title: 'Privacy Policy',
          type: 'link',
          url: 'https://barscout.com/privacy-policy',
        },
        {
          key: 'terms',
          title: 'Terms of Service',
          type: 'link',
          url: 'https://barscout.com/terms',
        },
      ],
    },
    {
      title: 'Account',
      settings: [
        {
          key: 'signOut',
          title: 'Sign Out',
          type: 'button',
          onPress: () => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: signOut,
                },
              ],
            );
          },
        },
      ],
    },
  ]);

  const handleToggle = async (sectionIndex: number, settingIndex: number) => {
    const newSettings = [...settings];
    const setting = newSettings[sectionIndex].settings[settingIndex];
    setting.value = !setting.value;
    setSettings(newSettings);

    try {
      await AsyncStorage.setItem(setting.key, JSON.stringify(setting.value));
    } catch (error) {
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear App Data',
      'Are you sure you want to clear all app data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'App data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear app data');
            }
          },
        },
      ]
    );
  };

  const handleSendFeedback = () => {
    Linking.openURL('mailto:contact@bar-scout.com');
  };

  const renderSetting = (setting: Setting, sectionIndex: number, settingIndex: number) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <View 
            key={setting.key} 
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            }}
          >
            <Text style={{
              fontSize: theme.typography.sizes.md,
              color: theme.colors.text,
            }}>
              {setting.title}
            </Text>
            <Switch
              value={setting.value}
              onValueChange={() => handleToggle(sectionIndex, settingIndex)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '80' }}
              thumbColor={setting.value ? theme.colors.primary : theme.colors.surface}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        );

      case 'button':
        return (
          <TouchableOpacity
            key={setting.key}
            style={{
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
            }}
            onPress={setting.onPress}
          >
            <Text style={{
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.primary,
            }}>
              {setting.title}
            </Text>
          </TouchableOpacity>
        );

      case 'link':
        return (
          <TouchableOpacity
            key={setting.key}
            style={{
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
              backgroundColor: theme.colors.surface,
            }}
            onPress={() => setting.url && Linking.openURL(setting.url)}
          >
            <Text style={{
              fontSize: theme.typography.sizes.md,
              fontWeight: theme.typography.weights.medium,
              color: theme.colors.primary,
            }}>
              {setting.title}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView 
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
      contentContainerStyle={{ 
        paddingVertical: theme.spacing.md 
      }}
    >
      {settings.map((section, sectionIndex) => (
        <View 
          key={section.title} 
          style={{
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text style={{
            fontSize: theme.typography.sizes.lg,
            fontWeight: theme.typography.weights.semibold,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
          }}>
            {section.title}
          </Text>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.colors.border,
          }}>
            {section.settings.map((setting, settingIndex) => (
              <React.Fragment key={setting.key}>
                {renderSetting(setting, sectionIndex, settingIndex)}
                {settingIndex < section.settings.length - 1 && (
                  <View style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: theme.colors.border,
                    marginLeft: theme.spacing.lg,
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <View style={{
        padding: theme.spacing.lg,
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.textSecondary,
        }}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};
