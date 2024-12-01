import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { developmentConfig } from '../config/development';

interface LocationContextType {
  location: {
    latitude: number;
    longitude: number;
  } | null;
  errorMsg: string | null;
  loading: boolean;
  requestLocationPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationContextType['location']>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      // Use development location if configured
      if (developmentConfig.useDevLocation) {
        console.log('Using development location:', developmentConfig.devLocation);
        setLocation(developmentConfig.devLocation);
        return true;
      }

      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        return true;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        return true;
      }

      setErrorMsg('Permission to access location was denied');
      return false;
    } catch (error) {
      console.error('Location error:', error);
      setErrorMsg('Error requesting location permission');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request location permission when the component mounts
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Log state changes for debugging
  useEffect(() => {
    console.log('Location state:', { location, loading, errorMsg });
  }, [location, loading, errorMsg]);

  return (
    <LocationContext.Provider value={{ location, errorMsg, loading, requestLocationPermission }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
