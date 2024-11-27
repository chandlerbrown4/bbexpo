import { useState } from 'react';
import { supabase } from '../services/supabase';

export interface SpecialItem {
  id: string;
  special_id: string;
  name: string;
  description: string | null;
  price: number;
}

export interface Special {
  id: string;
  bar_id: string;
  day_of_week: number;
  items: SpecialItem[];
}

interface UseSpecialsResult {
  specials: Special[];
  loading: boolean;
  error: string | null;
  fetchSpecials: (barId: string) => Promise<void>;
  fetchSpecialsByDay: (dayOfWeek: number) => Promise<void>;
}

export const useSpecials = (): UseSpecialsResult => {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecials = async (barId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: specialsData, error: specialsError } = await supabase
        .from('specials')
        .select('*')
        .eq('bar_id', barId);

      if (specialsError) throw specialsError;

      const specialsWithItems = await Promise.all(
        (specialsData || []).map(async (special) => {
          const { data: items, error: itemsError } = await supabase
            .from('special_items')
            .select('*')
            .eq('special_id', special.id);

          if (itemsError) throw itemsError;

          return {
            ...special,
            items: items || [],
          };
        })
      );

      setSpecials(specialsWithItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialsByDay = async (dayOfWeek: number) => {
    try {
      setLoading(true);
      setError(null);

      const { data: specialsData, error: specialsError } = await supabase
        .from('specials')
        .select(`
          *,
          bar:bars (
            id,
            name,
            address
          )
        `)
        .eq('day_of_week', dayOfWeek);

      if (specialsError) throw specialsError;

      const specialsWithItems = await Promise.all(
        (specialsData || []).map(async (special) => {
          const { data: items, error: itemsError } = await supabase
            .from('special_items')
            .select('*')
            .eq('special_id', special.id);

          if (itemsError) throw itemsError;

          return {
            ...special,
            items: items || [],
          };
        })
      );

      setSpecials(specialsWithItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    specials,
    loading,
    error,
    fetchSpecials,
    fetchSpecialsByDay,
  };
};
