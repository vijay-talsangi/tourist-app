// components/PlaceCard.tsx

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  calculateDistance,
  getPhotoUrl,
} from '../app/utils/api';

// Define the Place type
interface Place {
  displayName?: {
    text: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  photos?: { name: string }[];
}

interface PlaceCardProps {
  place: Place;
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

const openMaps = (lat: number, lon: number, label: string) => {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const latLng = `${lat},${lon}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  if (url) {
    Linking.openURL(url);
  }
};

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  userLocation,
}) => {
  const photoUrl =
    place.photos && place.photos.length > 0
      ? getPhotoUrl(place.photos[0].name)
      : null;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.imageContainer}>
        <Image
          source={
            photoUrl
              ? { uri: photoUrl }
              : require('../assets/images/placeholder.jpg')
          }
          style={cardStyles.image}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={cardStyles.gradientOverlay}
        />
        <View style={cardStyles.distanceBadge}>
          <Ionicons name="location" size={12} color="#FFF" />
          <Text style={cardStyles.distanceText}>
            {userLocation
              ? `${calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  place.location.latitude,
                  place.location.longitude
                ).toFixed(1)} km`
              : 'N/A'}
          </Text>
        </View>
      </View>
      <View style={cardStyles.infoContainer}>
        <Text style={cardStyles.name} numberOfLines={5}>
          {place.displayName?.text || 'No Name'}
        </Text>
        <TouchableOpacity
          style={cardStyles.button}
          onPress={() =>
            openMaps(
              place.location.latitude,
              place.location.longitude,
              place.displayName?.text || 'Destination'
            )
          }
        >
          <Text style={cardStyles.buttonText}>Directions</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
});