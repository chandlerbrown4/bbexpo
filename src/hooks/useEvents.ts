import { useState } from 'react';
import { supabase } from '../services/supabase';

export interface Event {
  id: string;
  bar_id: string;
  name: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  coverCharge: number | null;
  imageUrl: string | null;
  tags: string[];
  bar: {
    name: string;
    address: string;
  };
}

export interface EventInput {
  bar_id: string;
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  coverCharge: number | null;
  imageUrl: string;
  tags: string[];
}

interface UseEventsResult {
  events: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: (startDate: Date, endDate: Date) => Promise<void>;
  incrementEventCount: (eventId: string) => Promise<void>;
  addEvent: (eventData: EventInput) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export const useEvents = (): UseEventsResult => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
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

      setEvents(data || []);
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

  const addEvent = async (eventData: EventInput) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([
          {
            bar_id: eventData.bar_id,
            name: eventData.name,
            description: eventData.description,
            date: eventData.date,
            start_time: eventData.startTime,
            end_time: eventData.endTime,
            cover_charge: eventData.coverCharge,
            image_url: eventData.imageUrl,
            tags: eventData.tags,
          },
        ])
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Refresh events list
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      await fetchEvents(today, thirtyDaysFromNow);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
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
    addEvent,
    refetch,
  };
};
