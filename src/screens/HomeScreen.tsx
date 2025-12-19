// src/screens/HomeScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [destination, setDestination] = useState('');

  return (
    <View className="flex-1 bg-black px-6 justify-center">
      
      {/* App Title */}
      <Text className="text-white text-3xl font-bold text-center mb-8">
        VisionGuide AI
      </Text>

      {/* Destination Input */}
      <TextInput
        className="bg-white rounded-xl px-4 py-4 text-lg mb-6"
        placeholder="Enter destination"
        value={destination}
        onChangeText={setDestination}
        accessibilityLabel="Destination input"
      />

      {/* Start Guidance */}
      <Pressable
        className="bg-green-600 py-5 rounded-xl mb-4"
        onPress={() =>
          navigation.navigate('Map', { destination })
        }
        accessibilityLabel="Start guidance"
      >
        <Text className="text-white text-xl text-center font-semibold">
          Start Guidance
        </Text>
      </Pressable>

      {/* End Guidance */}
      <Pressable
        className="bg-red-600 py-5 rounded-xl mb-4"
        accessibilityLabel="End guidance"
      >
        <Text className="text-white text-xl text-center font-semibold">
          End Guidance
        </Text>
      </Pressable>

      {/* Settings */}
      <Pressable
        className="bg-gray-700 py-4 rounded-xl"
        onPress={() => navigation.navigate('Settings')}
        accessibilityLabel="Open settings"
      >
        <Text className="text-white text-lg text-center">
          Settings
        </Text>
      </Pressable>

    </View>
  );
};

export default HomeScreen;
