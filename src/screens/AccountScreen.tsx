import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useTheme } from '../theme/theme';

type AccountScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  isEmailVerified: boolean;
}

export const AccountScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AccountScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    email: user?.email || '',
    fullName: '',
    phoneNumber: '',
    isEmailVerified: false,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.typography.sizes.xl,
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text,
    },
    section: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.card,
      marginTop: theme.spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.typography.sizes.lg,
      fontWeight: theme.typography.weights.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    buttonContainer: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    verificationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: profile.isEmailVerified ? theme.colors.success + '20' : theme.colors.warning + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.xs,
    },
    verificationText: {
      fontSize: theme.typography.sizes.sm,
      color: profile.isEmailVerified ? theme.colors.success : theme.colors.warning,
      fontWeight: theme.typography.weights.medium,
    },
  });

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      // TODO: Implement profile update logic
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.navigate('SignIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement account deletion logic
              await signOut();
              navigation.navigate('SignIn');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <Input
          label="Full Name"
          value={profile.fullName}
          onChangeText={(text) => setProfile({ ...profile, fullName: text })}
          placeholder="Enter your full name"
          autoCapitalize="words"
        />
        <Input
          label="Email"
          value={profile.email}
          onChangeText={(text) => setProfile({ ...profile, email: text })}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />
        {profile.email && (
          <View style={styles.verificationBadge}>
            <Text style={styles.verificationText}>
              {profile.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </Text>
          </View>
        )}
        <Input
          label="Phone Number"
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Update Profile"
          onPress={handleUpdateProfile}
          loading={loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
        />
        <View style={{ height: theme.spacing.md }} />
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          variant="destructive"
        />
      </View>
    </ScrollView>
  );
};
