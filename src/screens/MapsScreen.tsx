import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, PermissionsAndroid, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import PermissionService from '../services/PermissionService';
import VoiceService from '../services/VoiceService';

type RootStackParamList = {
  Home: undefined;
  Guidance: undefined;
  Maps: { destination: string };
  Settings: undefined;
};

type MapsScreenRouteProp = RouteProp<RootStackParamList, 'Maps'>;

interface Location {
  latitude: number;
  longitude: number;
}

const MapsScreen: React.FC = () => {
  const route = useRoute<MapsScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { destination } = route.params;

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
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
    const granted = await PermissionService.requestLocationPermission();
    if (!granted) {
      Alert.alert('Permission Denied', 'Location permission is required for navigation.');
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    if (isDemoMode) return;

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Current location found:', latitude, longitude);

        // Detect if it's the US default location
        if (latitude > 30 && latitude < 40 && longitude > -130 && longitude < -110) {
          console.log('⚠️ Detected US-based location (likely emulator default)');
        }

        setCurrentLocation({ latitude, longitude });
        startLocationTracking();
      },
      (error) => {
        console.error('📍 Location Error:', error);
        // If high accuracy fails, try with normal accuracy
        if (error.code === 3 || error.code === 2) { // Timeout or position unavailable
          Geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setCurrentLocation({ latitude, longitude });
              startLocationTracking();
            },
            (err) => {
              if (!currentLocation) {
                // Set a default location if everything fails, but warn user
                console.log('⚠️ Using default fallback location');
                setCurrentLocation({ latitude: 12.9716, longitude: 77.5946 }); // Bengaluru
              }
            },
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
          );
        } else {
          Alert.alert('Location Error', 'Please enable GPS/Location permissions.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const toggleDemoMode = () => {
    if (!isDemoMode) {
      // NITK Surathkal coordinates
      const nitkCoords = { latitude: 13.0110, longitude: 74.7943 };
      setCurrentLocation(nitkCoords);
      setIsDemoMode(true);
      Alert.alert('Demo Mode Enabled', 'Current location set to NITK Surathkal for testing purposes.');
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    } else {
      setIsDemoMode(false);
      getCurrentLocation();
    }
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
    try {
      console.log('🗺️ Geocoding address:', address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'VisionGuideAI/1.0',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCoords = {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        };
        console.log('✅ Found coordinates:', newCoords);
        setDestinationCoords(newCoords);
        if (currentLocation) {
          calculateRoute(currentLocation, newCoords);
        }
      } else {
        // Fallback to mock if search fails
        console.log('⚠️ Geocoding failed, using mock');
        if (currentLocation) {
          const mockDestination = {
            latitude: currentLocation.latitude + 0.005,
            longitude: currentLocation.longitude + 0.005,
          };
          setDestinationCoords(mockDestination);
          calculateRoute(currentLocation, mockDestination);
        }
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      Alert.alert('Error', 'Could not search for destination');
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
    if (!destinationCoords) {
      Alert.alert('Error', 'Destination not set. Please wait for geocoding.');
      return;
    }
    setIsNavigating(true);
    setCurrentInstruction(`Navigating to ${destination}`);
    VoiceService.speak(`Navigation started to ${destination}. It is approximately ${distance} away.`);
    Alert.alert(
      'Navigation Started',
      `Distance: ${distance}\nETA: ${eta}\n\nFollow the path shown on the map.`,
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

  const handleScanArea = () => {
    // Navigate to Guidance screen for real-time camera-based scanning
    Alert.alert(
      'Opening Camera',
      'Switching to Real-Time Guidance for obstacle detection.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: () => navigation.navigate('Guidance' as never),
        },
      ]
    );
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
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={
          isNavigating && destinationCoords
            ? {
              latitude: (currentLocation.latitude + destinationCoords.latitude) / 2,
              longitude: (currentLocation.longitude + destinationCoords.longitude) / 2,
              latitudeDelta: Math.abs(currentLocation.latitude - destinationCoords.latitude) * 2,
              longitudeDelta: Math.abs(currentLocation.longitude - destinationCoords.longitude) * 2,
            }
            : {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }
        }
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

      {/* Refresh Location Button */}
      <View style={styles.sideButtons}>
        <Pressable
          style={styles.refreshButton}
          onPress={getCurrentLocation}
          accessibilityLabel="Refresh current location"
        >
          <Text style={styles.refreshButtonText}>📍</Text>
        </Pressable>
        <Pressable
          style={[styles.refreshButton, isDemoMode && { backgroundColor: '#16a34a' }]}
          onPress={toggleDemoMode}
          accessibilityLabel="Toggle Demo Mode"
        >
          <Text style={[styles.refreshButtonText, { fontSize: 18 }]}>DEMO</Text>
        </Pressable>
      </View>

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
                onPress={handleScanArea}
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
  refreshButton: {
    backgroundColor: '#fff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 10,
  },
  refreshButtonText: {
    fontSize: 24,
  },
  sideButtons: {
    position: 'absolute',
    right: 20,
    top: 100,
    zIndex: 10,
  },
});

export default MapsScreen;