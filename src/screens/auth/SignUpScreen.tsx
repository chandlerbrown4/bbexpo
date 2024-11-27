import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/theme';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await signUp(email, password);
      // The auth context will handle navigation via the user state change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
      }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{
        marginTop: theme.spacing.xl * 2,
        marginBottom: theme.spacing.xl,
      }}>
        <Text style={{
          fontSize: theme.typography.h1.fontSize,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.sm,
        }}>
          Create Account
        </Text>
        <Text style={{
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textSecondary,
        }}>
          Sign up to get started
        </Text>
      </View>

      <View style={{
        gap: theme.spacing.md,
      }}>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {error && (
          <Text style={{
            fontSize: theme.typography.caption.fontSize,
            color: theme.colors.error,
            textAlign: 'center',
          }}>
            {error}
          </Text>
        )}
        <Button
          title="Sign Up"
          onPress={handleSignUp}
          loading={loading}
        />
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        style={{
          marginTop: 'auto',
          paddingVertical: theme.spacing.md,
          alignItems: 'center',
        }}>
        <Text style={{
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textSecondary,
        }}>
          Already have an account?{' '}
          <Text style={{
            color: theme.colors.primary,
            fontWeight: '600',
          }}>
            Sign In
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};
