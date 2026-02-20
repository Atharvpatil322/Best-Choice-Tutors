import axios from 'axios';

/**
 * Converts a string address/city into Latitude and Longitude
 * @param {string} address - The city or address string from the tutor
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const geocodeAddress = async (address) => {
  try {
    // Nominatim requires a User-Agent header (standard OSM policy)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'TutorPlatformApp/1.0' 
      }
    });

    if (response.data && response.data.length > 0) {
      const { lat, lon } = response.data[0];
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lon)
      };
    }
    
    throw new Error('Could not find coordinates for this location.');
  } catch (error) {
    console.error('Geocoding Error:', error.message);
    return null;
  }
};