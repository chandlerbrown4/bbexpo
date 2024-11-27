import * as Location from 'expo-location';

export const requestLocationPermission = async () => {
  try {
    console.log('Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error requesting location permission:', err);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    console.log('Checking location permission...');
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('No location permission, throwing error');
      throw new Error('Location permission not granted');
    }

    console.log('Getting current position...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced, // Changed to Balanced for faster results
    });

    console.log('Got location:', location.coords);
    return location.coords;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number) => {
  return (value * Math.PI) / 180;
};
