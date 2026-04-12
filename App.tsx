import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // Firebase sanity check using new modular API
  try {
    getApp();
  } catch (error) {
    console.log('Firebase not initialized');
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;