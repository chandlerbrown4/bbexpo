import { useState } from 'react';
import { supabase } from '../services/supabase';

export interface Hours {
  id: string;
  bar_id: string;
  day_of_week: number;
  time: string;
}

interface UseHoursResult {
  hours: Hours[];
  loading: boolean;
  error: string | null;
  fetchHours: (barId: string) => Promise<void>;
  isOpen: (barId: string) => boolean;
}

export const useHours = (): UseHoursResult => {
  const [hours, setHours] = useState<Hours[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = async (barId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hours')
        .select('*')
        .eq('bar_id', barId)
        .order('day_of_week', { ascending: true });

      if (fetchError) throw fetchError;

      setHours(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isOpen = (barId: string): boolean => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const todayHours = hours.find(
      (h) => h.bar_id === barId && h.day_of_week === currentDay
    );

    if (!todayHours) return false;

    // Parse hours string (format: "HH:MM-HH:MM")
    const [openTime, closeTime] = todayHours.time.split('-');
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    // Convert current time to minutes since midnight
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTimeInMinutes = openHour * 60 + openMinute;
    let closeTimeInMinutes = closeHour * 60 + closeMinute;

    // Handle cases where closing time is after midnight
    if (closeTimeInMinutes < openTimeInMinutes) {
      closeTimeInMinutes += 24 * 60;
    }

    return (
      currentTimeInMinutes >= openTimeInMinutes &&
      currentTimeInMinutes <= closeTimeInMinutes
    );
  };

  return {
    hours,
    loading,
    error,
    fetchHours,
    isOpen,
  };
};
