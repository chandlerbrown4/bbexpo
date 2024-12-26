import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Bar } from '../types/bar';

export interface BarHours {
  openTime: string;
  closeTime: string;
}

export interface BarEvent {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  eventType: string;
  coverCharge: number | null;
}

export interface BarSpecial {
  id: string;
  name: string;
  description: string;
  specialType: string;
  price: number | null;
  startTime: Date;
  endTime: Date;
  recurring: boolean;
  recurrencePattern: string;
}

export interface BarDetails {
  contact: {
    phone: string | null;
    website: string | null;
  };
  hours: BarHours | null;
  events: BarEvent[];
  specials: BarSpecial[];
  isLoading: boolean;
  error: string | null;
}

export const useBarDetails = (barId: string): BarDetails => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<BarDetails['contact']>({ phone: null, website: null });
  const [hours, setHours] = useState<BarHours | null>(null);
  const [events, setEvents] = useState<BarEvent[]>([]);
  const [specials, setSpecials] = useState<BarSpecial[]>([]);

  useEffect(() => {
    const fetchBarDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch contact information
        const { data: barData, error: barError } = await supabase
          .from('bars')
          .select('phone, website')
          .eq('id', barId)
          .single();

        if (barError) throw new Error('Failed to fetch bar contact information');
        if (barData) {
          setContact({
            phone: barData.phone,
            website: barData.website,
          });
        }

        // Fetch today's hours
        const { data: hoursData, error: hoursError } = await supabase
          .rpc('get_todays_hours', { bar_uuid: barId });

        if (hoursError) {
          console.error('Hours Error:', hoursError);
        }
        if (hoursData && hoursData.length > 0) {
          setHours({
            openTime: hoursData[0].open_time,
            closeTime: hoursData[0].close_time,
          });
        } else {
          setHours(null);
        }

        // Fetch upcoming events
        const now = new Date();
        const twoDaysFromNow = new Date(now);
        twoDaysFromNow.setHours(now.getHours() + 48);

        // Get events for next 48 hours
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('bar_id', barId)
          .gte('start_time', now.toISOString())
          .lte('start_time', twoDaysFromNow.toISOString())
          .order('start_time', { ascending: true });

        if (eventsError) {
          console.error('Events Error:', eventsError);
          throw new Error('Failed to fetch bar events');
        }
        if (eventsData) {
          const mappedEvents = eventsData.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            startTime: new Date(event.start_time),
            endTime: new Date(event.end_time),
            eventType: event.event_type,
            coverCharge: event.cover_charge,
          }));
          setEvents(mappedEvents);
        }

        // Get specials that are either:
        // 1. Recurring
        // 2. Non-recurring but happening in the next 48 hours
        const { data: specialsData, error: specialsError } = await supabase
          .from('specials')
          .select('*')
          .eq('bar_id', barId)
          .or(`recurring.eq.true,and(recurring.eq.false,start_time.gte.${now.toISOString()},start_time.lte.${twoDaysFromNow.toISOString()})`)
          .order('start_time', { ascending: true });

        if (specialsError) {
          console.error('Specials Error:', specialsError);
          throw new Error('Failed to fetch bar specials');
        }
        if (specialsData) {
          // For recurring specials, we'll only show them if they're active today or tomorrow
          const mappedSpecials = specialsData
            .filter(special => {
              if (!special.recurring) {
                // Non-recurring specials are already filtered by the query
                return true;
              }
              
              // For recurring specials, check if they match today or tomorrow's pattern
              const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
              const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
                .toLocaleDateString('en-US', { weekday: 'long' })
                .toLowerCase();
              
              if (special.recurrence_pattern === 'daily') {
                return true;
              }
              
              const [frequency, day] = special.recurrence_pattern.split(',');
              return day === today || day === tomorrow;
            })
            .map(special => ({
              id: special.id,
              name: special.name,
              description: special.description,
              specialType: special.special_type,
              price: special.price,
              startTime: new Date(special.start_time),
              endTime: new Date(special.end_time),
              recurring: special.recurring,
              recurrencePattern: special.recurrence_pattern,
            }))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
          setSpecials(mappedSpecials);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (barId) {
      fetchBarDetails();
    }
  }, [barId]);

  return {
    contact,
    hours,
    events,
    specials,
    isLoading,
    error,
  };
};

// Helper function to format recurring specials
export const formatRecurringSpecial = (special: BarSpecial): string => {
  if (!special.recurring) return '';

  const pattern = special.recurrencePattern.toLowerCase();
  if (pattern.includes('daily')) {
    return 'Daily';
  } else if (pattern.includes('weekly')) {
    const days = pattern.split(',').map(day => 
      day.trim().charAt(0).toUpperCase() + day.trim().slice(1)
    ).join(', ');
    return `Every ${days}`;
  }
  return special.recurrencePattern;
};

// Helper function to format hours
export const formatHours = (hours: BarHours | null): string => {
  if (!hours) return 'Hours not available';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  return `${formatTime(hours.openTime)} - ${formatTime(hours.closeTime)}`;
};
