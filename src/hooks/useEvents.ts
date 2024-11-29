import { useState } from 'react';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export interface Event {
  id: string;
  bar_id: string;
  name: string;
  description: string | null;
  date: string; // ISO string from database
  count: number;
  bar: {
    name: string;
    address: string;
  };
}

interface UseEventsResult {
  events: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  incrementEventCount: (eventId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useEvents = (): UseEventsResult => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      // First fetch all events
      const { data: eventsData, error: fetchError } = await supabase
        .from('events')
        .select(`
          *,
          bar:bars (
            name,
            address
          )
        `)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      // Format events
      const formattedEvents = (eventsData || []).map(event => ({
        ...event,
        date: event.date,
      }));

      setEvents(formattedEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const incrementEventCount = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase.rpc('increment_event_count', {
        event_id: eventId,
      });

      if (updateError) throw updateError;

      // Refresh the events list
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      await fetchEvents(today, thirtyDaysFromNow);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    await fetchEvents(now, thirtyDaysFromNow);
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    incrementEventCount,
    refetch,
  };
};
