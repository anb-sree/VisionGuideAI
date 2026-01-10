// src/screens/GuidanceScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { DetectedObject } from '../types/detection.types';
import DetectionService from '../services/DetectionService';
import VoiceService from '../services/VoiceService';
import DetectionOverlay from '../components/DetectionOverlay';
import PermissionService from '../services/PermissionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GuidanceScreen = () => {
  const [isGuidanceActive, setIsGuidanceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isModelReady, setIsModelReady] = useState(false);
  
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const detectionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const status = await PermissionService.requestCameraPermission();
      setHasPermission(status);

      if (!status) {
        console.log('❌ Camera permission denied');
        return;
      }

      await initializeDetection();
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  const checkPermissions = async () => {
    const granted = await PermissionService.checkCameraPermission();
    setHasPermission(granted);
    
    if (!granted) {
      console.log('⚠️ Camera permission not granted yet');
    }
  };

  const initializeDetection = async () => {
    console.log('🔧 Initializing detection service...');
    const success = await DetectionService.initialize();
    setIsModelReady(success);
    
    if (success) {
      console.log('✅ Detection service initialized');
      
      const voiceSuccess = await VoiceService.initialize();
      if (voiceSuccess) {
        console.log('✅ Voice service initialized');
        VoiceService.speak('VisionGuide ready');
      }
    } else {
      console.log('⚠️ Detection service failed to initialize');
      Alert.alert(
        'Server Connection Failed',
        'Could not connect to YOLO server. Make sure:\n\n1. Python server is running\n2. SERVER_URL is correct\n3. Both devices on same network',
        [{ text: 'OK' }]
      );
    }
  };

  const captureAndDetect = async () => {
    if (!cameraRef.current || !isModelReady) return;

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        enableAutoStabilization: false,
      });

      const result = await DetectionService.detectFromImage(
        `file://${photo.path}`,
        SCREEN_WIDTH,
        SCREEN_HEIGHT
      );

      setDetectedObjects(result.objects);

      VoiceService.announceObjects(result.objects);

    } catch (error) {
      console.error('❌ Capture/detect error:', error);
    }
  };

  const startDetectionLoop = () => {
    console.log('🎯 Starting detection loop...');
    
    detectionInterval.current = setInterval(() => {
      captureAndDetect();
    }, 2000);
  };

  const stopDetectionLoop = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
      console.log('⏹️ Detection loop stopped');
    }
  };

  const handleStartGuidance = async () => {
    console.log('🎬 Start Guidance pressed');
    setIsLoading(true);

    try {
      if (!hasPermission) {
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

      if (!isModelReady) {
        Alert.alert(
          'Server Not Ready',
          'YOLO detection server is not connected. Please start the server first.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      console.log('✅ Starting guidance mode...');
      setIsGuidanceActive(true);
      
      VoiceService.speak('Guidance started');
      
      setTimeout(() => {
        startDetectionLoop();
      }, 1000);
      
      console.log('🎯 Real-time object detection active');

    } catch (error) {
      console.error('❌ Error starting guidance:', error);
      Alert.alert('Error', 'Failed to start guidance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndGuidance = () => {
    console.log('🛑 End Guidance pressed');
    stopDetectionLoop();
    setIsGuidanceActive(false);
    setDetectedObjects([]);
    
    VoiceService.clearTracking();
    
    VoiceService.speak('Guidance ended');
    
    console.log('⏹️ Object detection stopped');
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Waiting for camera permission...</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isGuidanceActive && hasPermission ? (
        <>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isGuidanceActive}
            photo={true}
          />
          
          <DetectionOverlay
            objects={detectedObjects}
            frameWidth={SCREEN_WIDTH}
            frameHeight={SCREEN_HEIGHT}
          />
        </>
      ) : (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>🎯 Real-Time Guidance</Text>
          <Text style={styles.infoText}>
            Press "Start Guidance" to activate camera-based object detection.
          </Text>
          <Text style={styles.infoSubtext}>
            {isModelReady 
              ? '✅ YOLO server connected and ready'
              : '⚠️ YOLO server not connected'}
          </Text>
          
          {!isModelReady && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={initializeDetection}
            >
              <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.controlsContainer}>
        {__DEV__ && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FFA500', marginBottom: 10 }]}
            onPress={() => {
              console.log('🔊 Test button pressed!');
              import('react-native-tts').then(Tts => {
                console.log('🔊 Calling Tts.speak...');
                Tts.default.speak('Testing one two three', {
                  androidParams: {
                    KEY_PARAM_STREAM: 'STREAM_MUSIC',
                  }
                });
              }).catch(err => {
                console.error('❌ TTS import error:', err);
              });
            }}
          >
            <Text style={styles.buttonText}>🔊 TEST VOICE</Text>
          </TouchableOpacity>
        )}
        
        {!isGuidanceActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton, !isModelReady && styles.buttonDisabled]}
            onPress={handleStartGuidance}
            disabled={isLoading || !isModelReady}
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

        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}> Debug Info:</Text>
            <Text style={styles.debugText}>
              Camera: {device ? 'Working' : 'Failed to load camera'}
            </Text>
            <Text style={styles.debugText}>
              Permission: {hasPermission ? 'Permissions accessed' : 'Please check with the device permissions'}
            </Text>
            <Text style={styles.debugText}>
              Server: {isModelReady ? 'Server loaded succesfully' : 'Failed to load the server'}
            </Text>
            <Text style={styles.debugText}>
              Active: {isGuidanceActive ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Objects: {detectedObjects.length}
            </Text>
            <Text style={styles.debugText}>
              Mode:  REST API
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
    marginBottom: 15,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  buttonDisabled: {
    backgroundColor: '#666',
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