/**
 * MainNavigator - Primary Navigation Configuration
 * 
 * Navigation Structure:
 * - Stack Navigator (Root)
 *   ├─ Tab Navigator (MainTabs)
 *   │  ├─ Home Tab (Bar List)
 *   │  ├─ Events Tab
 *   │  └─ Account Tab
 *   ├─ Bar Details Screen
 *   ├─ Line Times Screen
 *   ├─ Add Line Time Screen
 *   ├─ Add Event Screen
 *   ├─ Settings Screen
 *   ├─ Sign In Screen
 *   └─ Sign Up Screen
 * 
 * Features:
 * - Handles authentication flow
 * - Manages bottom tab navigation
 * - Configures screen transitions
 * - Implements consistent header styling
 * - Handles loading states
 * 
 * Theme Integration:
 * - Uses theme colors for navigation elements
 * - Consistent styling across all navigation components
 * - Custom header and tab bar configurations
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EventsScreen } from '../screens/EventsScreen';
import { BarDetailsScreen } from '../screens/BarDetailsScreen';
import { AddLineTimeScreen } from '../screens/AddLineTimeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { LineTimesScreen } from '../screens/LineTimesScreen';
import { RootStackParamList, MainTabParamList } from './types';
import { useTheme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 5,
        },
        headerStyle: {
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 5,
        },
        headerTitleStyle: {
          color: theme.colors.text,
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
        },
        headerTintColor: theme.colors.primary,
      }}>
      <Tab.Screen
        name="NearbyBars"
        component={LineTimesScreen}
        options={{
          title: 'Nearby Bars',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.card,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 5,
        },
        headerTitleStyle: {
          color: theme.colors.card,
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
        },
        headerTintColor: theme.colors.primary,
        headerBackTitleVisible: false,
        headerBackTitle: 'Back',
      }}>
      {user ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BarDetails"
            component={BarDetailsScreen}
            options={{ title: 'Bar Details' }}
          />
          <Stack.Screen
            name="AddLineTime"
            component={AddLineTimeScreen}
            options={{ title: 'Add Line Time' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
