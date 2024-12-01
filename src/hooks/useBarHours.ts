import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface BarHours {
  id: string;
  bar_id: string;
  day_of_week: number;
  time: string;
}

interface FormattedHours {
  day_of_week: number;
  open: string;
  close: string;
}

export const useBarHours = (barId: string) => {
  const [hours, setHours] = useState<FormattedHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTimeString = (timeString: string): { open: string; close: string } => {
    const [open, close] = timeString.split(' - ');
    return { open, close };
  };

  const fetchHours = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hours')
        .select('*')
        .eq('bar_id', barId)
        .order('day_of_week');

      if (fetchError) throw fetchError;

      const formattedHours = data?.map((hour: BarHours) => ({
        day_of_week: hour.day_of_week,
        ...formatTimeString(hour.time)
      })) || [];

      setHours(formattedHours);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bar hours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHours();
  }, [barId]);

  return { hours, loading, error, refreshHours: fetchHours };
};
