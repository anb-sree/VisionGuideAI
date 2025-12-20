import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, PermissionsAndroid, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

type RootStackParamList = {
  Home: undefined;
  Guidance: { destination: string };
  Settings: undefined;
};

type GuidanceScreenRouteProp = RouteProp<RootStackParamList, 'Guidance'>;

interface Location {
  latitude: number;
  longitude: number;
}

const GuidanceScreen: React.FC = () => {
  const route = useRoute<GuidanceScreenRouteProp>();
  const navigation = useNavigation();
  const { destination } = route.params;

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [distance, setDistance] = useState<string>('Calculating...');
  const [eta, setEta] = useState<string>('');
  const [currentInstruction, setCurrentInstruction] = useState<string>('Ready to navigate');

  const watchId = useRef<number | null>(null);

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
    
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  useEffect(() => {
    if (destination && currentLocation) {
      geocodeDestination(destination);
    }
  }, [destination, currentLocation]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'VisionGuide needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        startLocationTracking();
      },
      (error) => {
        Alert.alert('Location Error', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const startLocationTracking = () => {
    watchId.current = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        updateNavigationInfo({ latitude, longitude });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
  };

  const geocodeDestination = async (address: string) => {
    // Mock destination near current location for testing
    // In production, use Google Geocoding API
    try {
      if (currentLocation) {
        const mockDestination = {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01,
        };
        setDestinationCoords(mockDestination);
        calculateRoute(currentLocation, mockDestination);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not find destination');
    }
  };

  const calculateRoute = async (start: Location, end: Location) => {
    // Drawing a straight line for now
    // In production, use Google Directions API
    setRouteCoordinates([start, end]);
    calculateDistance(start, end);
  };

  const calculateDistance = (start: Location, end: Location) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(start.latitude)) *
      Math.cos(toRad(end.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;
    
    setDistance(`${distanceKm.toFixed(2)} km`);
    
    // Calculate ETA (assuming 5 km/h walking speed)
    const timeMinutes = (distanceKm / 5) * 60;
    setEta(`${Math.round(timeMinutes)} min`);
  };

  const toRad = (value: number) => (value * Math.PI) / 180;

  const updateNavigationInfo = (location: Location) => {
    if (destinationCoords && isNavigating) {
      calculateDistance(location, destinationCoords);
      
      // Check if reached destination (within 20 meters)
      const distanceMeters = getDistanceInMeters(location, destinationCoords);
      if (distanceMeters < 20) {
        announceArrival();
      } else if (distanceMeters < 100) {
        setCurrentInstruction('Destination is nearby');
      }
    }
  };

  const getDistanceInMeters = (start: Location, end: Location) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(start.latitude)) *
      Math.cos(toRad(end.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startNavigation = () => {
    setIsNavigating(true);
    setCurrentInstruction(`Navigating to ${destination}`);
    Alert.alert(
      'Navigation Started',
      `Distance: ${distance}\nETA: ${eta}`,
      [{ text: 'OK' }]
    );
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentInstruction('Navigation stopped');
    Alert.alert('Navigation Stopped', 'Navigation has been ended', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const announceArrival = () => {
    setIsNavigating(false);
    setCurrentInstruction('You have arrived!');
    Alert.alert('Arrived', 'You have reached your destination!');
  };

  const detectObstacles = () => {
    // Simulated obstacle detection
    // In production, integrate with camera and AI model
    const obstacles = [
      'Clear path ahead',
      'Person detected on the right',
      'Obstacle on the left',
      'Stairs ahead',
      'Crosswalk detected',
    ];
    const detected = obstacles[Math.floor(Math.random() * obstacles.length)];
    setCurrentInstruction(detected);
    Alert.alert('Obstacle Detection', detected);
  };

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton
        followsUserLocation
      >
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            description={destination}
            pinColor="red"
          />
        )}
        
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#0066FF"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Current Instruction Banner */}
      {isNavigating && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>{currentInstruction}</Text>
        </View>
      )}

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.destinationText}>To: {destination}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distance}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{eta}</Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.buttonRow}>
          {!isNavigating ? (
            <Pressable
              style={[styles.button, styles.startButton]}
              onPress={startNavigation}
            >
              <Text style={styles.buttonText}>Start Navigation</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.button, styles.detectButton]}
                onPress={detectObstacles}
              >
                <Text style={styles.buttonText}>Scan Area</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.stopButton]}
                onPress={stopNavigation}
              >
                <Text style={styles.buttonText}>Stop</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  map: {
    flex: 1,
  },
  instructionBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 102, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  destinationText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#16a34a',
  },
  detectButton: {
    backgroundColor: '#f59e0b',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GuidanceScreen;