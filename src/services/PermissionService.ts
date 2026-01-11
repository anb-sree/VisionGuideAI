// src/services/PermissionService.ts
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';

class PermissionService {
  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'VisionGuide needs access to your camera for object detection',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Camera permission granted');
          return true;
        } else {
          console.log('❌ Camera permission denied');
          Alert.alert(
            'Permission Required',
            'Camera access is required for guidance features. Please enable it in settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        // iOS
        const cameraPermission = await Camera.requestCameraPermission();
        if (cameraPermission === 'granted') {
          console.log('✅ Camera permission granted (iOS)');
          return true;
        } else {
          console.log('❌ Camera permission denied (iOS)');
          Alert.alert(
            'Permission Required',
            'Camera access is required for guidance features.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Check if camera permission is already granted
   */
  async checkCameraPermission(): Promise<boolean> {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      console.log('Camera permission status:', cameraPermission);
      return cameraPermission === 'granted';
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return false;
    }
  }

  /**
   * Request microphone permission (for voice commands)
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'VisionGuide needs microphone access for voice commands',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS - use Camera module's microphone permission
        const micPermission = await Camera.requestMicrophonePermission();
        return micPermission === 'granted';
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'VisionGuide needs access to your location for navigation',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS - location permission is handled by the OS when needed
        return true;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Request all required permissions at once
   */
  async requestAllPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    location: boolean;
  }> {
    const camera = await this.requestCameraPermission();
    const microphone = await this.requestMicrophonePermission();
    const location = await this.requestLocationPermission();
    
    return { camera, microphone, location };
  }
}

export default new PermissionService();