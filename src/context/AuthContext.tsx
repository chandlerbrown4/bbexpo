import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  profile?: UserProfile;
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
      
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }


      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User fetch error:', userError);
        throw userError;
      }


      return {
        id: user.id,
        email: user.email!,
        profile: profile || undefined,
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
      // Verify age
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
        age--;
      }
      
      if (age < 13) {
        throw new Error('You must be 13 or older to use this app');
      }

      
      // Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      if (!data.user) throw new Error('No user returned from sign up');

      const userId = data.user.id;
      // Start a Supabase transaction for all inserts
      const { error: transactionError } = await supabase.rpc('create_user_records', {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
      });

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        // Attempt to clean up auth user if record creation fails
        await supabase.auth.signOut();
        throw transactionError;
      }


    } catch (error) {
      console.error('Error in signUp:', error);
      // Clean up any partial data if possible
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
