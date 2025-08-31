import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PlaceCard } from '../../components/PlaceCard';
import { getAddressFromCoords, searchNearbyPlaces } from '../utils/api';

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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [touristAttractions, setTouristAttractions] = useState<Place[]>([]);
  const [accommodations, setAccommodations] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('attractions');
  const scrollY = new Animated.Value(0);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [220, 120],
    extrapolate: 'clamp',
  });

  const fetchLocationAndPlaces = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const fetchedAddress = await getAddressFromCoords(
        location.coords.latitude,
        location.coords.longitude
      );
      setAddress(fetchedAddress);

      const attractions = await searchNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        5000,
        ['tourist_attraction']
      );
      setTouristAttractions(attractions);

      const lodgings = await searchNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        5000,
        ['lodging']
      );
      setAccommodations(lodgings);
    } catch (err) {
      setErrorMsg('Failed to fetch location or places.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocationAndPlaces();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocationAndPlaces();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Finding amazing places near you...</Text>
          <Text style={styles.loadingSubText}>Exploring your surroundings</Text>
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLocationAndPlaces}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.greeting}>Explore Nearby</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={18} color="#FFF" />
            <Text style={styles.address} numberOfLines={15}>
              {address || 'Your current location'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        <View style={styles.content}>
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={[styles.categoryButton, activeCategory === 'attractions' && styles.activeCategory]}
              onPress={() => setActiveCategory('attractions')}
            >
              <Text style={[styles.categoryText, activeCategory === 'attractions' && styles.activeCategoryText]}>
                Attractions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryButton, activeCategory === 'accommodations' && styles.activeCategory]}
              onPress={() => setActiveCategory('accommodations')}
            >
              <Text style={[styles.categoryText, activeCategory === 'accommodations' && styles.activeCategoryText]}>
                Stays
              </Text>
            </TouchableOpacity>
          </View>

          {activeCategory === 'attractions' ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tourist Attractions</Text>
                <Text style={styles.sectionSubtitle}>{touristAttractions.length} places nearby</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {touristAttractions.map((place, index) => (
                  <PlaceCard
                    key={`attraction-${index}`}
                    place={place}
                    userLocation={location?.coords ?? null}
                  />
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Accommodations</Text>
                <Text style={styles.sectionSubtitle}>{accommodations.length} places to stay</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {accommodations.map((place, index) => (
                  <PlaceCard
                    key={`accommodation-${index}`}
                    place={place}
                    userLocation={location?.coords ?? null}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Discover More</Text>
            </View>
            <View style={styles.discoverGrid}>
              <TouchableOpacity style={styles.discoverCard}>
                <LinearGradient
                  colors={['#EC4899', '#8B5CF6']}
                  style={styles.discoverIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="restaurant" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.discoverText}>Restaurants</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discoverCard}>
                <LinearGradient
                  colors={['#3B82F6', '#06B6D4']}
                  style={styles.discoverIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="cafe" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.discoverText}>Cafés</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discoverCard}>
                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  style={styles.discoverIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="cart" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.discoverText}>Shopping</Text>
              </TouchableOpacity>
            </View>
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  loadingSubText: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  gradientHeader: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 16,
    color: '#E0E7FF',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 24,
  },
  categoryContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeCategory: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeCategoryText: {
    color: '#6366F1',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  horizontalScroll: {
    paddingVertical: 4,
  },
  discoverGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discoverCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 48) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  discoverIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  discoverText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
});