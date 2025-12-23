// src/screens/GuidanceScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import PermissionService from '../services/PermissionService';

const GuidanceScreen = () => {
  const [isGuidanceActive, setIsGuidanceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const { hasPermission: cameraPermission } = useCameraPermission();

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await PermissionService.checkCameraPermission();
    setHasPermission(granted);
    
    if (!granted) {
      console.log('⚠️ Camera permission not granted yet');
    }
  };

  const handleStartGuidance = async () => {
    console.log('🎬 Start Guidance pressed');
    setIsLoading(true);

    try {
      // Request permission if not granted
      if (!hasPermission && !cameraPermission) {
        console.log('📸 Requesting camera permission...');
        const granted = await PermissionService.requestCameraPermission();
        
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Camera access is needed to detect obstacles and guide you safely.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }
        
        setHasPermission(true);
      }

      // Start guidance
      console.log('✅ Starting guidance mode...');
      setIsGuidanceActive(true);
      
      // TODO: Start object detection here (Phase 2)
      console.log('🎯 Object detection will be connected in Phase 2');
      
      // TODO: Start voice announcements here (Phase 3)
      console.log('🔊 Voice feedback will be connected in Phase 3');

    } catch (error) {
      console.error('❌ Error starting guidance:', error);
      Alert.alert('Error', 'Failed to start guidance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGuidance = () => {
    console.log('🛑 End Guidance pressed');
    
    // Stop guidance
    setIsGuidanceActive(false);
    
    // TODO: Stop object detection here (Phase 2)
    console.log('⏹️ Stopping object detection...');
    
    // TODO: Stop voice announcements here (Phase 3)
    console.log('🔇 Stopping voice feedback...');
  };

  // Show loading state
  if (device == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      {isGuidanceActive && hasPermission ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isGuidanceActive}
          photo={false}
          video={false}
          audio={false}
        />
      ) : (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>🎯 Real-Time Guidance</Text>
          <Text style={styles.infoText}>
            Press "Start Guidance" to activate camera-based object detection.
          </Text>
          <Text style={styles.infoSubtext}>
            The system will detect obstacles and provide voice instructions.
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isGuidanceActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartGuidance}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Start Guidance</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.endButton]}
            onPress={handleEndGuidance}
          >
            <Text style={styles.buttonText}>End Guidance</Text>
          </TouchableOpacity>
        )}

        {/* Debug Info */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              📊 Debug Info:
            </Text>
            <Text style={styles.debugText}>
              Camera: {device ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Permission: {hasPermission || cameraPermission ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Active: {isGuidanceActive ? '✅' : '❌'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  infoSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  endButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  debugContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  debugText: {
    color: '#0f0',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default GuidanceScreen;