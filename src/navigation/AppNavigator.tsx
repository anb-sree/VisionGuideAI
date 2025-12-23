// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ✅ UPDATED IMPORTS
import HomeScreen from '../screens/HomeScreen';
import MapsScreen from '../screens/MapsScreen';        // ← RENAMED from GuidanceScreen (old map view)
import GuidanceScreen from '../screens/GuidanceScreen'; // ← NEW camera-based real-time guidance
import SettingsScreen from '../screens/SettingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Home Screen */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'VisionGuide AI',
            headerShown: true,
          }}
        />

        {/* Maps Screen (renamed from old Guidance - shows map view) */}
        <Stack.Screen 
          name="Maps" 
          component={MapsScreen}
          options={{ 
            title: 'Maps View',
          }}
        />

        {/* Real-Time Guidance Screen (NEW - camera-based object detection) */}
        <Stack.Screen 
          name="Guidance" 
          component={GuidanceScreen}
          options={{ 
            title: 'Real-Time Guidance',
            headerStyle: {
              backgroundColor: '#000',
            },
            headerTintColor: '#fff',
          }}
        />

        {/* Settings Screen */}
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ 
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}