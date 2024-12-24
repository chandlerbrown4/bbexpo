/**
 * Sign Up Screen
 * 
 * Handles new user registration with email, password, and profile information.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │           Bar Scout             │ <- Logo
 * │                                 │
 * │        Create Account           │ <- Title
 * │                                 │
 * │ ┌─────────────────────────────┐ │
 * │ │ 📧 Email                    │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 👤 First Name               │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 👤 Last Name                │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 📅 Date of Birth            │ │ <- DatePicker
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 🔒 Password                 │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │ ┌─────────────────────────────┐ │
 * │ │ 🔒 Confirm Password         │ │ <- Input
 * │ └─────────────────────────────┘ │
 * │                                 │
 * │         [  Sign Up  ]          │ <- Button
 * │                                 │
 * │    Already have an account?     │
 * │          Sign In →             │ <- Navigation Link
 * └─────────────────────────────────┘
 * 
 * State:
 * - email: string
 * - firstName: string
 * - lastName: string
 * - password: string
 * - confirmPassword: string
 * - dateOfBirth: Date | null
 * - error: string | null
 * - loading: boolean
 * 
 * Validation:
 * - All fields required
 * - Password minimum 6 characters
 * - Password matching
 * - Valid email format
 * 
 * Authentication:
 * - Uses AuthContext.signUp(userData)
 * - Navigates to SignIn on success
 * - Displays error messages on failure
 * 
 * Components:
 * - KeyboardAvoidingView (adjusts for keyboard)
 * - ScrollView (handles overflow content)
 * - Input (form fields)
 * - DateTimePicker (native date selection)
 * - Button (sign up action)
 * - TouchableOpacity (navigation to sign in)
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
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme/theme';
import { supabase } from '../../services/supabase';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp } = useAuth();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate inputs
      if (!email || !firstName || !lastName || !password || !confirmPassword || !dateOfBirth) {
        throw new Error('All fields are required');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // First, sign up with Supabase auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user returned from sign up');

      // Then initialize the user profile and related records
      const profileData = {
        p_auth_id: authData.user.id,
        p_display_name: `${firstName.trim()} ${lastName.trim()}`,
        p_date_of_birth: dateOfBirth.toISOString().split('T')[0],
        p_bio: null,
        p_avatar_url: null
      };

      console.log('Attempting to create profile with data:', JSON.stringify(profileData, null, 2));

      const { data: userId, error: profileError } = await supabase.rpc(
        'handle_new_user_signup',
        profileData
      );

      if (profileError) {
        console.error('Profile creation error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });

        console.log('Auth user created:', {
          id: authData.user.id,
          email: authData.user.email
        });

        throw new Error(`Database error saving new user: ${profileError.message}`);
      }

      console.log('Profile creation successful. User ID:', userId);

      Alert.alert(
        'Success!',
        'Your account has been created. Please check your email for verification instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn')
          }
        ]
      );
        
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Join Bar Scout
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create your account
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
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            leftIcon="account"
          />
          <Input
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            leftIcon="account"
          />
          
          <TouchableOpacity
            style={[
              styles.dateButton,
              { borderColor: theme.colors.border }
            ]}
            onPress={() => setShowDatePicker(true)}>
            <Text style={[
              styles.dateButtonText,
              { color: dateOfBirth ? theme.colors.text : theme.colors.textSecondary }
            ]}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Date of Birth'}
            </Text>
          </TouchableOpacity>

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon="lock"
          />
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon="lock-check"
          />

          {error && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          )}

          <Button
            title={loading ? 'Creating account...' : 'Create Account'}
            onPress={handleSignUp}
            disabled={loading}
            style={styles.signUpButton}
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              {' Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
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
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: (width * 0.3) / 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
  },
  signUpButton: {
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
    marginTop: 24,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
