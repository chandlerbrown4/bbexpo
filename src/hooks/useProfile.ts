import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface UserProfile {
  display_name: string;
  bio: string;
  avatar_url: string;
  reputation_score: number;
  status: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user?.id) {
      setError('No user ID available');
      setLoading(false);
      return;
    }

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_user_profile', {
          p_auth_id: user.id
        });

      if (rpcError) throw rpcError;

      if (data && data.length > 0) {
        setProfile(data[0] as UserProfile);
      } else {
        setError('Profile not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const refreshProfile = () => {
    setLoading(true);
    fetchProfile();
  };

  return {
    profile,
    loading,
    error,
    refreshProfile
  };
};
