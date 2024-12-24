import React from 'react';
import { View, TextInput, Text, StyleSheet, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  leftIcon?: MaterialIconName;
  style?: any;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  leftIcon, 
  style,
  placeholder,
  ...props 
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      marginBottom: theme.spacing.xs,
      fontWeight: theme.typography.weights.medium as TextStyle['fontWeight'],
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      padding: theme.spacing.sm,
      fontSize: theme.typography.sizes.md,
    },
    error: {
      fontSize: theme.typography.sizes.sm,
      marginTop: theme.spacing.xs,
    }
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: error ? theme.colors.error : theme.colors.border
        },
        style
      ]}>
        {leftIcon && (
          <MaterialCommunityIcons
            name={leftIcon}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          {...props}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textSecondary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              backgroundColor: 'transparent'
            }
          ]}
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};
