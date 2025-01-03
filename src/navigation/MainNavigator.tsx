/**
 * MainNavigator - Primary Navigation Configuration
 * 
 * Navigation Structure:
 * - Stack Navigator (Root)
 *   ├─ Tab Navigator (MainTabs)
 *   │  ├─ Home Tab (Bar List)
 *   │  ├─ Events Tab
 *   │  ├─ Map Tab
 *   │  ├─ Profile Tab (Authenticated Users)
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LineTimesScreen } from '../screens/LineTimesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SocialHubScreen from '../screens/SocialHubScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { useTheme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  NearbyBars: undefined;
  Social: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        headerShown: true,
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
        name="Social"
        component={SocialHubScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}>
      {!user ? (
        // Auth screens
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        // App screens
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};
