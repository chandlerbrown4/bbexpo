export const developmentConfig = {
  // Set this to true to use the development location instead of actual GPS
  useDevLocation: true,
  
  // Development location coordinates (North Wilkesboro)
  devLocation: {
    latitude: 36.1584,
    longitude: -81.1476,
  },
  
  // Other development locations for testing
  locations: {
    northWilkesboro: {
      latitude: 36.1584,
      longitude: -81.1476,
    },
    charlotte: {
      latitude: 35.2271,
      longitude: -80.8431,
    },
    // Add a location near your test bar for development
    nearBar: {
      latitude: 36.1584,  // Update these coordinates to be within 2 miles of your test bar
      longitude: -81.1476,
    },
  },
};
