import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface UserPreferences {
  preferred_radius: number;
  preferred_bar_types: string[];
  notification_settings: {
    push_enabled: boolean;
    email_enabled: boolean;
    marketing_enabled: boolean;
  };
  privacy_settings: {
    profile_visible: boolean;
    location_sharing: boolean;
    activity_visible: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  preferred_radius: 5, // 5 miles default
  preferred_bar_types: [],
  notification_settings: {
    push_enabled: true,
    email_enabled: true,
    marketing_enabled: false,
  },
  privacy_settings: {
    profile_visible: true,
    location_sharing: true,
    activity_visible: true,
  },
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // If no preferences exist, create default ones
        await createDefaultPreferences();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([{ user_id: user?.id, ...defaultPreferences }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ ...newPreferences })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetPreferences = async () => {
    await updatePreferences(defaultPreferences);
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
    fetchPreferences,
  };
};
