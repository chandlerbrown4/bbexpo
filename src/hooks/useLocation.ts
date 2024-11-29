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

  const fetchLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (developmentConfig.useDevLocation) {
        setLocation(developmentConfig.devLocation);
        setLoading(false);
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        return;
      }

      const position = await getCurrentLocation();
      setLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    loading,
    error,
    refreshLocation: fetchLocation,
  };
};
