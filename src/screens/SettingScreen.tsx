// src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';

const SettingsScreen = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <View className="flex-1 bg-black px-6 pt-10">

      <Text className="text-white text-3xl font-bold mb-8">
        Settings
      </Text>

      {/* Audio */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-xl">
          Audio Guidance
        </Text>
        <Switch
          value={audioEnabled}
          onValueChange={setAudioEnabled}
        />
      </View>

      {/* Vibration */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-white text-xl">
          Vibration
        </Text>
        <Switch
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
        />
      </View>

      {/* Guidance Frequency */}
      <Text className="text-white text-xl mt-4 mb-2">
        Guidance Frequency
      </Text>

      <View className="bg-gray-800 rounded-xl p-4">
        <Text className="text-white text-lg">Medium</Text>
      </View>

    </View>
  );
};

export default SettingsScreen;
