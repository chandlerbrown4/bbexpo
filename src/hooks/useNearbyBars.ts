import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { calculateDistance } from '../services/location';

export interface Bar {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  menu_link?: string;
  phone?: string;
  distance?: number;
  description?: string;
}

interface UseNearbyBarsProps {
  userLatitude: number;
  userLongitude: number;
  maxDistance?: number; // in miles
}

export const useNearbyBars = ({ 
  userLatitude, 
  userLongitude, 
  maxDistance = 20 
}: UseNearbyBarsProps) => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyBars = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all bars
      const { data: barsData, error: fetchError } = await supabase
        .from('bars')
        .select('*');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (!barsData) {
        setBars([]);
        return;
      }

      // Calculate distance for each bar and filter by maxDistance
      const barsWithDistance = barsData
        .map((bar) => ({
          ...bar,
          distance: calculateDistance(
            userLatitude,
            userLongitude,
            bar.latitude,
            bar.longitude
          ),
        }))
        .filter((bar) => bar.distance <= maxDistance)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setBars(barsWithDistance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyBars();
  }, [userLatitude, userLongitude]);

  return {
    bars,
    loading,
    error,
    refetch: fetchNearbyBars
  };
};
