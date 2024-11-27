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

type SignInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const { signIn } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await signIn(email, password);
      // Auth context will handle navigation via user state change
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
          Welcome Back
        </Text>
        <Text style={{
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textSecondary,
        }}>
          Sign in to continue
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
          title="Sign In"
          onPress={handleSignIn}
          loading={loading}
        />
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        style={{
          marginTop: 'auto',
          paddingVertical: theme.spacing.md,
          alignItems: 'center',
        }}>
        <Text style={{
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textSecondary,
        }}>
          Don't have an account?{' '}
          <Text style={{
            color: theme.colors.primary,
            fontWeight: '600',
          }}>
            Sign Up
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};
