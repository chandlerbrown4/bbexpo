import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface UseBarFavoritesReturn {
  favorites: Set<string>;
  loading: boolean;
  error: string | null;
  toggleFavorite: (barId: string) => Promise<void>;
  isFavorite: (barId: string) => boolean;
}

export const useBarFavorites = (): UseBarFavoritesReturn => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_favorites')
        .select('bar_id');

      if (fetchError) throw fetchError;

      setFavorites(new Set(data?.map(f => f.bar_id) || []));
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (barId: string) => {
    try {
      const { data, error } = await supabase.rpc('toggle_bar_favorite', {
        p_bar_id: barId
      });

      if (error) throw error;

      // Update local state based on the returned boolean
      setFavorites(prev => {
        const next = new Set(prev);
        if (data) {
          next.add(barId);
        } else {
          next.delete(barId);
        }
        return next;
      });
    } catch (err) {
      console.error('Error toggling favorite:', err);
      throw err;
    }
  };

  const isFavorite = (barId: string) => favorites.has(barId);

  useEffect(() => {
    fetchFavorites();
  }, []);

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite
  };
};
