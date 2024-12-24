import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useLocation } from '../context/LocationContext';
import { Bar } from '../types/bar';

interface UseNearbyBarsReturn {
  bars: Bar[];
  loading: boolean;
  error: string | null;
  refreshBars: () => Promise<void>;
}

export const useNearbyBars = (radiusMeters: number = 5000): UseNearbyBarsReturn => {
  const { location } = useLocation();
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyBars = async () => {
    console.log('Fetching nearby bars with location:', location);
    console.log('Search radius (meters):', Math.round(radiusMeters));
    
    if (!location) {
      console.log('No location available');
      setLoading(false);
      setError('Location not available');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('search_bars_by_location', {
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_radius_meters: Math.round(radiusMeters) // Ensure integer value
      });

      console.log('Received bars data:', data);
      console.log('Fetch error:', fetchError);

      if (fetchError) throw fetchError;
      setBars(data || []);
    } catch (err) {
      console.error('Error in fetchNearbyBars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby bars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useNearbyBars effect triggered. Location:', location);
    fetchNearbyBars();
  }, [location, radiusMeters]);

  return {
    bars,
    loading,
    error,
    refreshBars: fetchNearbyBars
  };
};
