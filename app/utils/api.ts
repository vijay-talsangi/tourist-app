import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY; 
const BASE_URL = "https://places.googleapis.com/v1/places:searchNearby";

export const searchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 5000,
  types: string[] = ["tourist_attraction"]
) => {
  try {
    const response = await axios.post(
      BASE_URL,
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
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY || "",
          "X-Goog-FieldMask":
            "places.displayName,places.formattedAddress,places.location",
        },
      }
    );

    return response.data.places || [];
  } catch (error: any) {
    console.error("Error fetching places:", error.response?.data || error);
    return [];
  }
};
