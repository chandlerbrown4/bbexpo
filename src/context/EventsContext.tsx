import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../services/supabase';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  coverCharge: string;
  imageUrl: string;
  tags: string[];
  barId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EventsContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Event>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  fetchEvents: (barId?: string) => Promise<Event[]>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      const newEvent = {
        ...data,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      setEvents((prev) => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent = {
        ...data,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? updatedEvent : event))
      );
      return updatedEvent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (barId?: string) => {
    setLoading(true);
    try {
      let query = supabase.from('events').select('*');
      if (barId) {
        query = query.eq('barId', barId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formattedEvents = data.map((event) => ({
        ...event,
        date: new Date(event.date),
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
      }));

      setEvents(formattedEvents);
      return formattedEvents;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        fetchEvents,
      }}>
      {children}
    </EventsContext.Provider>
  );
};
