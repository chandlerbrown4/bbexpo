import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export type BarHours = {
  id: string;  // uuid
  bar_id: string;  // uuid
  day_of_week: number;  // int4
  time: string;  // text, format: "11:00 AM - 11:00 PM"
};

const DAY_MAP = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday'
};

export const useBarHours = () => {
  const [hours, setHours] = useState<BarHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = useCallback(async (barId: string) => {
    if (!barId) {
      console.error('No barId provided to fetchHours');
      return;
    }

    try {
      console.log('Starting to fetch hours for bar:', barId);
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hours')
        .select('*')
        .eq('bar_id', barId)
        .order('day_of_week');

      console.log('Hours query response:', { data, error: supabaseError });

      if (supabaseError) {
        console.error('Error fetching hours:', supabaseError);
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        console.log('No hours found for bar:', barId);
      } else {
        console.log('Successfully fetched hours:', data);
      }

      setHours(data || []);
    } catch (err) {
      console.error('Error in fetchHours:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bar hours');
      setHours([]);
    } finally {
      setLoading(false);
      console.log('Finished fetching hours');
    }
  }, []);

  const formatHours = (hours: BarHours[]): Record<string, string> => {
    console.log('Formatting hours:', hours);
    
    // Initialize with all days
    const formattedHours = Object.values(DAY_MAP).reduce<Record<string, string>>((acc, day) => {
      acc[day] = 'Not available';
      return acc;
    }, {});

    // Fill in the available hours
    hours.forEach(hour => {
      const dayName = DAY_MAP[hour.day_of_week as keyof typeof DAY_MAP];
      if (dayName) {
        formattedHours[dayName] = hour.time;
      }
    });

    console.log('Formatted hours:', formattedHours);
    return formattedHours;
  };

  return {
    hours,
    loading,
    error,
    fetchHours,
    formatHours,
  };
};
