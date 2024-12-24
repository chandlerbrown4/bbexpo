import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const theme = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
        return 'transparent';
      case 'destructive':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textSecondary;
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return theme.colors.white;
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: theme.colors.primary,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      color: getTextColor(),
      fontSize: theme.typography.sizes.md,
      fontWeight: theme.typography.weights.medium as TextStyle['fontWeight'],
      marginLeft: loading ? theme.spacing.sm : 0,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
