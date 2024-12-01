import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }
    
    return true;
  } catch (error) {
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location;
  } catch (error) {
    throw error;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance / 1609.34; // Convert to miles
};
