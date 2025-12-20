import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GuidanceScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Guidance Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});

export default GuidanceScreen;