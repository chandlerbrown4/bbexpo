import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export interface RecentLineTime {
  id: string;
  bar_id: string;
  line: string;
  minutes: number;
  timestamp: string;
  user_id: string;
  verified: boolean;
  weight: number;
  upvotes: number;
  downvotes: number;
  reporter_name: string;
  reporter_reputation: number;
  reporter_status: 'regular' | 'trusted' | 'expert';
  user_vote?: 'up' | 'down' | null;
}

export const useRecentLineTimes = (barId?: string) => {
  const [recentLineTimes, setRecentLineTimes] = useState<RecentLineTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecentLineTimes = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('recent_line_times')
        .select(`
          *,
          user_vote:line_time_votes(vote_type)
        `);

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      if (user) {
        query = query.eq('line_time_votes.user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      console.log('Raw line times from DB:', data?.map(item => ({
        id: item.id,
        timestamp: item.timestamp
      })));

      setRecentLineTimes(data?.map(item => ({
        ...item,
        user_vote: item.user_vote?.[0]?.vote_type || null
      })) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent line times');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentLineTimes();
  }, [barId, user]);

  return {
    recentLineTimes,
    loading,
    error,
    refreshLineTimes: fetchRecentLineTimes,
  };
};
