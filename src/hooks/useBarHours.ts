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

export type FormattedHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
};

export const useBarHours = () => {
  const [hours, setHours] = useState<BarHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = async (barId: string) => {
    if (!barId) {
      setError('No barId provided to fetchHours');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hours')
        .select('*')
        .eq('bar_id', barId)
        .order('day_of_week');

      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }

      if (!data || data.length === 0) {
        setHours([]);
        return;
      }

      setHours(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: BarHours[]): FormattedHours[] => {
    const formattedHours = hours.map((hour) => ({
      dayOfWeek: hour.day_of_week,
      openTime: hour.time.split(' - ')[0],
      closeTime: hour.time.split(' - ')[1],
    }));

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
