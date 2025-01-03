import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface Friend {
  friend_id: string;
  friend_name: string;
  friend_avatar_url: string;
  friend_bio: string;
  friendship_status: string;
  friendship_created_at: string;
  friend_reputation_score: number;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: rpcError } = await supabase
        .rpc('get_user_friends', {
          p_user_id: user.id
        });

      if (rpcError) throw rpcError;

      setFriends(data || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    loading,
    error,
    refreshFriends: fetchFriends
  };
};
