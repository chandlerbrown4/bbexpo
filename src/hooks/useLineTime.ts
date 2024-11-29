import { useState } from 'react';
import { supabase } from '../services/supabase';

interface LineTime {
  id: string;
  bar_id: string;
  user_name: string;
  line: string;
  minutes: number;
  timestamp: string;
}

interface UseLineTimeResult {
  lineTimes: LineTime[];
  loading: boolean;
  error: string | null;
  fetchLineTimes: (barId?: string) => Promise<void>;
  addLineTime: (barId: string, userName: string, line: string, minutes?: number) => Promise<void>;
  getEstimatedWaitTime: (posts: LineTime[]) => number;
  getLineCategoryFromMinutes: (minutes: number) => string;
}

const DEFAULT_WAIT_TIMES = {
  'No Line': 0,
  'Short Line (< 5 mins)': 5,
  'Medium Line (5-15 mins)': 10,
  'Long Line (15-30 mins)': 25,
  'Very Long Line (30+ mins)': 35,
};

// Constants for time-based filtering and weighting
const MAX_POST_AGE_HOURS = 2; // Only consider posts from last 2 hours
const WEIGHT_DECAY_FACTOR = 0.5; // How quickly older posts lose influence

const getLineCategoryFromMinutes = (minutes: number): string => {
  if (minutes <= 0) return 'No Line';
  if (minutes < 5) return 'Short Line (< 5 mins)';
  if (minutes < 15) return 'Medium Line (5-15 mins)';
  if (minutes < 30) return 'Long Line (15-30 mins)';
  return 'Very Long Line (30+ mins)';
};

export const useLineTime = (): UseLineTimeResult => {
  const [lineTimes, setLineTimes] = useState<LineTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEstimatedWaitTime = (posts: LineTime[]): number => {
    const now = new Date();
    
    // Filter posts within MAX_POST_AGE_HOURS and calculate weights
    const validPosts = posts
      .map(post => {
        const postTime = new Date(post.timestamp);
        const ageInHours = (now.getTime() - postTime.getTime()) / (1000 * 60 * 60);
        
        // Skip posts older than MAX_POST_AGE_HOURS
        if (ageInHours > MAX_POST_AGE_HOURS) {
          return null;
        }

        // Use the default wait time for the line category if minutes is not available
        const minutes = post.minutes || DEFAULT_WAIT_TIMES[post.line as keyof typeof DEFAULT_WAIT_TIMES] || 0;

        // Calculate weight based on age (newer posts have higher weight)
        const weight = Math.exp(-WEIGHT_DECAY_FACTOR * ageInHours);
        
        return {
          minutes,
          weight
        };
      })
      .filter((post): post is { minutes: number; weight: number } => post !== null);

    // If no valid posts, return 0
    if (validPosts.length === 0) {
      return 0;
    }

    // Calculate weighted average
    const totalWeight = validPosts.reduce((sum, post) => sum + post.weight, 0);
    const weightedSum = validPosts.reduce((sum, post) => sum + post.minutes * post.weight, 0);

    return Math.round(weightedSum / totalWeight);
  };

  const fetchLineTimes = async (barId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate the timestamp for MAX_POST_AGE_HOURS ago
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - MAX_POST_AGE_HOURS);

      let query = supabase
        .from('line_time_posts')
        .select('*')
        .gte('timestamp', cutoffTime.toISOString())
        .order('timestamp', { ascending: false });

      if (barId) {
        query = query.eq('bar_id', barId);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;
      setLineTimes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addLineTime = async (
    barId: string,
    userName: string,
    line: string,
    minutes?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Use provided minutes or get default wait time for the line category
      const waitTime = minutes ?? DEFAULT_WAIT_TIMES[line as keyof typeof DEFAULT_WAIT_TIMES] ?? 0;

      const { error: insertError } = await supabase.from('line_time_posts').insert([
        {
          bar_id: barId,
          user_name: userName,
          line,
          minutes: waitTime,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // Fetch updated line times after adding a new one
      await fetchLineTimes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    lineTimes,
    loading,
    error,
    fetchLineTimes,
    addLineTime,
    getEstimatedWaitTime,
    getLineCategoryFromMinutes,
  };
};
