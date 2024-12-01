import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { EventsProvider } from './src/context/EventsContext';
import { LocationProvider } from './src/context/LocationContext';
import { ReputationProvider } from './src/context/ReputationContext';
import { MainNavigator } from './src/navigation/MainNavigator';
import { darkTheme, lightTheme } from './src/theme/theme';

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
                  <MainNavigator />
                </ReputationProvider>
              </LocationProvider>
            </EventsProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
