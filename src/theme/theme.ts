import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';

export interface Theme {
  colors: {
    primary: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    border: string;
    card: string;
    shadow: string;
    white: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      thin: "100";
      extralight: "200";
      light: "300";
      normal: "400";
      medium: "500";
      semibold: "600";
      bold: "700";
      extrabold: "800";
      black: "900";
    };
    h1: {
      fontSize: number;
      fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    };
    h2: {
      fontSize: number;
      fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    };
    h3: {
      fontSize: number;
      fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    };
    body: {
      fontSize: number;
      fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    };
    caption: {
      fontSize: number;
      fontWeight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

export const lightTheme: Theme = {
  colors: {
    primary: '#fb923c',        // Main orange from logo
    primaryLight: '#f48f51',   // Light orange
    secondary: '#ea580c',      // Darker orange variation
    accent: '#fb923c',         // Using main orange as accent
    background: '#FFFFFF',     // White
    surface: '#F5F6F7',        // Light gray background ###########
    text: '#1F2937',          // Dark text for contrast
    textSecondary: '#6B7280',  // Secondary text color
    error: '#DC2626',         // Red for errors
    success: '#059669',       // Green for success
    warning: '#D97706',       // Amber for warnings
    info: '#3B82F6',         // Blue for info
    border: '#E2E4E9',       // Light grey        ##########
    card: '#FFFFFF',         // White for cards ##############
    shadow: 'rgba(0, 0, 0, 0.1)', // Subtle shadow ############
    white: '#FFFFFF',        // Pure white
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    h1: {
      fontSize: 32,
      fontWeight: '700',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal',
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    primary: '#fb923c',        // Keep the same primary color
    primaryLight: '#f48f51',   // Keep the same primary light
    secondary: '#60a5fa',      // Keep the same secondary
    accent: '#f59e0b',        // Keep the same accent
    background: '#111827',     // Dark background
    surface: '#1F2937',        // Slightly lighter dark
    text: '#F9FAFB',          // Light text for contrast
    textSecondary: '#9CA3AF',  // Secondary text color
    error: '#ef4444',         // Keep the same error color
    success: '#22c55e',       // Keep the same success color
    warning: '#f59e0b',       // Keep the same warning color
    info: '#3b82f6',         // Keep the same info color
    border: '#374151',        // Darker border
    card: '#1F2937',          // Dark card background
    shadow: 'rgba(0, 0, 0, 0.3)', // Darker shadow
    white: '#ffffff',         // Keep white the same
  },
};

export const useTheme = () => {
  // Using Appearance.getColorScheme() directly as a fallback
  const colorScheme = useColorScheme() || Appearance.getColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Export the default theme as an alias for backward compatibility
export const theme = lightTheme;
