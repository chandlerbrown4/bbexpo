import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface UserProfile {
  id: string;
  auth_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  preferred_radius: number;
  preferred_bar_types: string[];
  notification_settings: any;
  privacy_settings: any;
}

interface User {
  id: string;
  email: string;
  profile?: UserProfile;
  preferences?: UserPreferences;
  reputation?: number;
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userWithProfile = await getUserWithProfile(session.user.id);
        setUser(userWithProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const getUserWithProfile = async (userId: string): Promise<User | null> => {
    try {
      // Get user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return null;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (preferencesError) throw preferencesError;

      // Calculate total reputation
      const { data: reputation, error: reputationError } = await supabase
        .from('reputation_events')
        .select('points')
        .eq('user_id', userId);

      if (reputationError) throw reputationError;

      const totalReputation = reputation?.reduce((sum, event) => sum + event.points, 0) || 0;

      return {
        id: user.id,
        email: user.email!,
        profile: profile || undefined,
        preferences: preferences || undefined,
        reputation: totalReputation,
      };
    } catch (error) {
      console.error('Error in getUserWithProfile:', error);
      return null;
    }
  };

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userWithProfile = await getUserWithProfile(user.id);
        setUser(userWithProfile);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async ({
    email,
    password,
    firstName,
    lastName,
    dateOfBirth,
  }: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  }) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error('No user returned from sign up');

    } catch (error) {
      console.error('Error in signUp:', error);
      await supabase.auth.signOut();
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
