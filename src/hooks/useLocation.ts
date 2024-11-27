import { useState, useEffect } from 'react';
import { getCurrentLocation, requestLocationPermission } from '../services/location';
import { developmentConfig } from '../config/development';

interface Location {
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocation = async () => {
    try {
      console.log('useLocation: Starting location fetch...');
      setLoading(true);
      setError(null);

      // Use development location if configured
      if (developmentConfig.useDevLocation) {
        console.log('useLocation: Using development location:', developmentConfig.devLocation);
        setLocation(developmentConfig.devLocation);
        setLoading(false);
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        console.log('useLocation: No permission granted');
        throw new Error('Location permission denied');
      }

      const position = await getCurrentLocation();
      console.log('useLocation: Got position:', position);
      setLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    } catch (err) {
      console.error('useLocation: Error getting location:', err);
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useLocation: Initial location fetch');
    getLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refreshLocation: getLocation,
  };
};
