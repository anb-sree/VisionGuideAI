import React, { useState, useEffect} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { startListening, stopListening } from '../services/voiceService';
import { speak } from '../services/ttsService';
import { vibrateObstacle } from '../services/hapticsService';

type RootStackParamList = {
  Home: undefined;
  Guidance: { destination: string };
  Settings: undefined;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'Home'>>();
  const [destination, setDestination] = useState('');

  const startGuidance = () => {
    if (!destination) return;

    speak('Guidance started');
    navigation.navigate('Guidance', { destination });
  };

  const endGuidance = () => {
    speak('Guidance ended');
    stopListening();

  };

  const handleVoiceCommand = (text: string) => {
    console.log('Voice command:', text);

    if (text.includes('start')) {
      startGuidance();
    } else if (text.includes('end') || text.includes('stop')) {
      endGuidance();
    }else if (text.includes('obstacle')) {
      obstacleAlert();
    }
  };

  const obstacleAlert = () => {
    speak('Obstacle ahead');
    vibrateObstacle();
  };

  
  useEffect(() => {
    startListening(handleVoiceCommand);

    const obstacleTimer = setTimeout(() => {
      obstacleAlert();
    }, 5000); // simulate after 5 seconds

    return () => {
      stopListening();
      clearTimeout(obstacleTimer);
    };
  }, []);




  return (
    <View style={styles.container}>
      {/* App Title */}
      <Text style={styles.title}>
        VisionGuide AI
      </Text>

      {/* Destination Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter destination"
        placeholderTextColor="#999"
        value={destination}
        onChangeText={setDestination}
        accessibilityLabel="Destination input"
      />

      {/* Start Guidance */}
      <Pressable
        style={styles.startButton}
        onPress={startGuidance}
        accessibilityLabel="Start guidance"
      >
        <Text style={styles.startButtonText}>
          Start Guidance
        </Text>
      </Pressable>

      {/* End Guidance */}
      <Pressable
        style={styles.endButton}
        onPress={endGuidance}
        accessibilityLabel="End guidance"
      >
        <Text style={styles.endButtonText}>
          End Guidance
        </Text>
      </Pressable>

      {/* Settings */}
      <Pressable
        style={styles.settingsButton}
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Open settings"
      >
        <Text style={styles.settingsButtonText}>
          Settings
        </Text>
      </Pressable>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    marginBottom: 24,
    color: '#000',
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
  endButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default HomeScreen;