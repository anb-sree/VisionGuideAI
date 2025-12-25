// src/components/DetectionOverlay.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DetectedObject } from '../types/detection.types';

interface DetectionOverlayProps {
  objects: DetectedObject[];
  frameWidth: number;
  frameHeight: number;
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  objects,
  frameWidth,
  frameHeight,
}) => {
  // Color coding based on object type
  const getBoxColor = (objectClass: string): string => {
    if (['person'].includes(objectClass)) return '#ff0000'; // Red for people
    if (['car', 'truck', 'bus', 'bicycle', 'motorcycle'].includes(objectClass)) {
      return '#ff6600'; // Orange for vehicles
    }
    if (['chair', 'couch', 'bed', 'dining table'].includes(objectClass)) {
      return '#ffcc00'; // Yellow for furniture
    }
    if (['door'].includes(objectClass)) return '#00ff00'; // Green for doors
    return '#00ccff'; // Cyan for other objects
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {objects.map((obj, index) => {
        const boxColor = getBoxColor(obj.class);
        const confidencePercent = Math.round(obj.confidence * 100);

        return (
          <View key={index}>
            {/* Bounding Box */}
            <View
              style={[
                styles.boundingBox,
                {
                  left: obj.bbox.x,
                  top: obj.bbox.y,
                  width: obj.bbox.width,
                  height: obj.bbox.height,
                  borderColor: boxColor,
                },
              ]}
            />

            {/* Label */}
            <View
              style={[
                styles.label,
                {
                  left: obj.bbox.x,
                  top: obj.bbox.y - 25,
                  backgroundColor: boxColor,
                },
              ]}
            >
              <Text style={styles.labelText}>
                {obj.class} {confidencePercent}%
              </Text>
              <Text style={styles.positionText}>
                {obj.position} • {obj.distance}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Detection Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          🎯 Objects: {objects.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  positionText: {
    color: '#fff',
    fontSize: 12,
  },
  statsContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsText: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetectionOverlay;