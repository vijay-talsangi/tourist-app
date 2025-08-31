import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const GEOCODING_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export const searchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 5000,
  types: string[] = ['tourist_attraction']
) => {
  try {
    const response = await axios.post(
      PLACES_BASE_URL,
      {
        locationRestriction: {
          circle: {
            center: { latitude, longitude },
            radius,
          },
        },
        includedTypes: types,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY || '',
          'X-Goog-FieldMask':
            'places.displayName,places.formattedAddress,places.location,places.photos',
        },
      }
    );

    return response.data.places || [];
  } catch (error: any) {
    console.error('Error fetching places:', error.response?.data || error);
    return [];
  }
};

export const getAddressFromCoords = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `${GEOCODING_BASE_URL}?latlng=${lat},${lon}&key=${API_KEY}`
    );
    return response.data.results[0]?.formatted_address || 'Address not found';
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Error fetching address';
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const getPhotoUrl = (photoName: string, width: number = 400) => {
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${width}&key=${API_KEY}`;
};