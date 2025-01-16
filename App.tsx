import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { EventsProvider } from './src/context/EventsContext';
import { LocationProvider } from './src/context/LocationContext';
import { ReputationProvider } from './src/context/ReputationContext';
import { MainNavigator } from './src/navigation/MainNavigator';
import { darkTheme, lightTheme } from './src/theme/theme';
import Toast from 'react-native-toast-message';

const Stack = createStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const customLightTheme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaProvider>
        <NavigationContainer theme={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
          <AuthProvider>
            <EventsProvider>
              <LocationProvider>
                <ReputationProvider>
                  <Stack.Navigator>
                    <Stack.Screen
                      name="Main"
                      component={MainNavigator}
                      options={{ headerShown: false }}
                    />
                  </Stack.Navigator>
                  <Toast />
                </ReputationProvider>
              </LocationProvider>
            </EventsProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
