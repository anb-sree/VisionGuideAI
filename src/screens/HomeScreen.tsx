// src/screens/HomeScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import VoiceService from '../services/VoiceService';

type RootStackParamList = {
  Home: undefined;
  Guidance: undefined;              // Real-time camera guidance (new logic)
  Maps: { destination: string };    // Destination-based navigation (renamed from Guidance)
  Settings: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Home'>>();
  const [destination, setDestination] = useState('');

  useEffect(() => {
    VoiceService.initialize();
  }, []);

  // Start real-time camera guidance
  const startGuidance = () => {
    console.log('🎯 Navigating to Real-Time Guidance');
    navigation.navigate('Guidance');
  };

  // Navigate to maps with destination
  const openMaps = () => {
    if (!destination) {
      console.log('⚠️ Please enter a destination first');
      VoiceService.speak('ENTER_DESTINATION');
      return;
    }
    console.log('🗺️ Navigating to Maps with destination:', destination);
    navigation.navigate('Maps', { destination });
  };

  return (
    <View style={styles.container}>
      {/* App Title */}
      <Text style={styles.title}>VisionGuide AI</Text>

      {/* Destination Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter destination"
        placeholderTextColor="#999"
        value={destination}
        onChangeText={setDestination}
        accessibilityLabel="Destination input"
      />

      {/* Start Real-Time Guidance (Camera + Object Detection) */}
      <Pressable
        style={styles.startButton}
        onPress={startGuidance}
        accessibilityLabel="Start real-time guidance with camera"
      >
        <Text style={styles.startButtonText}>🎯 Start Real-Time Guidance</Text>
      </Pressable>

      {/* Open Maps View with Destination */}
      <Pressable
        style={styles.mapsButton}
        onPress={openMaps}
        accessibilityLabel="Open maps view"
      >
        <Text style={styles.mapsButtonText}>🗺️ View Maps</Text>
      </Pressable>

      {/* Settings */}
      <Pressable
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Open settings"
      >
        <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
      </Pressable>

      {/* Info Text */}
      <Text style={styles.infoText}>
        Real-Time Guidance uses your camera to detect obstacles and provide instructions.
        Maps view provides destination-based navigation.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    marginBottom: 24,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  startButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  mapsButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  mapsButtonText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default HomeScreen;