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

export const SettingsScreen = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState<SettingsSection[]>([
    {
      title: 'General',
      settings: [
        {
          key: 'autoRefresh',
          title: 'Auto-refresh Data',
          type: 'toggle',
          value: true,
        },
        {
          key: 'saveSearchHistory',
          title: 'Save Search History',
          type: 'toggle',
          value: true,
        },
      ],
    },
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
        {
          key: 'specialsAlerts',
          title: 'Specials Alerts',
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
          key: 'help',
          title: 'Help Center',
          type: 'link',
          url: 'https://barscout.com/help',
        },
        {
          key: 'privacy',
          title: 'Privacy Policy',
          type: 'link',
          url: 'https://barscout.com/privacy',
        },
        {
          key: 'terms',
          title: 'Terms of Service',
          type: 'link',
          url: 'https://barscout.com/terms',
        },
        {
          key: 'feedback',
          title: 'Send Feedback',
          type: 'button',
          onPress: () => handleSendFeedback(),
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
    Linking.openURL('mailto:feedback@barscout.com');
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
