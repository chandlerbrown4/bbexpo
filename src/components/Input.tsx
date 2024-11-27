import React from 'react';
import { View, TextInput, Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../theme/theme';

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
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.sizes.sm,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      fontWeight: theme.typography.weights.medium as TextStyle['fontWeight'],
    },
    input: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.spacing.sm,
      padding: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: theme.typography.sizes.md,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    error: {
      color: theme.colors.error,
      fontSize: theme.typography.sizes.sm,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          props.multiline && { height: props.numberOfLines ? props.numberOfLines * 40 : 100 },
        ]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.autoCapitalize}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        numberOfLines={props.numberOfLines}
        maxLength={props.maxLength}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};
