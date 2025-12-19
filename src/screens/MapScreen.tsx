// src/screens/MapScreen.tsx

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { destination } = route.params as { destination: string };

  return (
    <View className="flex-1">

      {/* Map */}
      <MapView
        className="flex-1"
        initialRegion={{
          latitude: 17.385,
          longitude: 78.4867,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{ latitude: 17.385, longitude: 78.4867 }}
          title="You"
        />

        <Marker
          coordinate={{ latitude: 17.39, longitude: 78.49 }}
          title={destination}
        />

        <Polyline
          coordinates={[
            { latitude: 17.385, longitude: 78.4867 },
            { latitude: 17.39, longitude: 78.49 },
          ]}
          strokeWidth={5}
          strokeColor="#22c55e"
        />
      </MapView>

      {/* End Guidance */}
      <Pressable
        className="absolute bottom-6 self-center bg-red-600 px-8 py-4 rounded-xl"
        onPress={() => navigation.goBack()}
        accessibilityLabel="End guidance"
      >
        <Text className="text-white text-lg font-semibold">
          End Guidance
        </Text>
      </Pressable>

    </View>
  );
};

export default MapScreen;
