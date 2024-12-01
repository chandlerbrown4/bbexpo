/**
 * Sign In Screen
 * 
 * Handles user authentication through email and password login.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │           Bar Scout             │ <- Logo
 * │                                 │
 * │      Welcome to Bar Scout       │ <- Title
 * │    Your nightlife companion     │ <- Subtitle
 * │                                 │
 * │ ┌─────────────────────────────┐ │
 * │ │ 📧 Email                    │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 🔒 Password                 │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │                                 │
 * │         [  Sign In  ]          │ <- Button
 * │                                 │
 * │     Don't have an account?     │
 * │          Sign Up →             │ <- Navigation Link
 * └─────────────────────────────────┘
 * 
 * State:
 * - email: string
 * - password: string
 * - error: string | null (displays validation/auth errors)
 * - loading: boolean (disables form during submission)
 * 
 * Authentication:
 * - Uses AuthContext.signIn(email, password)
 * - Automatic navigation on successful auth
 * - Error display on failed auth
 * 
 * Components:
 * - KeyboardAvoidingView (adjusts for keyboard)
 * - Input (email and password fields)
 * - Button (sign in action)
 * - TouchableOpacity (navigation to sign up)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  Dimensions,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to Bar Scout
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your nightlife companion
        </Text>
      </View>

      <View style={styles.formContainer}>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon="email"
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon="lock"
        />
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
        <Button
          title={loading ? 'Signing in...' : 'Sign In'}
          onPress={handleSignIn}
          disabled={loading}
          style={styles.signInButton}
        />
      </View>

      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>
            {' Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: (width * 0.4) / 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  signInButton: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
