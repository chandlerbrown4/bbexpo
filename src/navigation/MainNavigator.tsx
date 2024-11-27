import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { BarDetailsScreen } from '../screens/BarDetailsScreen';
import { AddLineTimeScreen } from '../screens/AddLineTimeScreen';
import { AddEventScreen } from '../screens/AddEventScreen';
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
          color: theme.colors.text,
          fontSize: theme.typography.sizes.lg,
          fontWeight: theme.typography.weights.semibold,
        },
        headerTintColor: theme.colors.primary,
        headerBackTitleVisible: false,
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
          <Stack.Screen
            name="AddEvent"
            component={AddEventScreen}
            options={{ title: 'Add Event' }}
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
