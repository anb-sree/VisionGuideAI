// src/services/DetectionService.ts
import { DetectedObject, DetectionResult } from '../types/detection.types';
import { calculatePosition, estimateDistance } from '../utils/positionCalculator';

const SERVER_URL = 'http://192.168.137.1:8000';
//use this if running on mobile phone -- this is the system ip address
// const SERVER_URL = 'http://10.0.2.2:8000'; 
// for android emulator

class DetectionService {
  private isInitialized = false;
  private isDetecting = false;

  /**
   * Initialize the detection service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🤖 Initializing Detection Service...');
      console.log(`🌐 Server URL: ${SERVER_URL}`);

      // Test server connection
      const response = await fetch(`${SERVER_URL}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.status === 'online') {
        console.log('✅ Connected to YOLO server');
        console.log(`📦 Model: ${data.model}`);
        this.isInitialized = true;
        return true;
      } else {
        console.log('⚠️ Server responded but status not online');
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to connect to YOLO server:', error);
      console.error('💡 Make sure:');
      console.error('   1. Python server is running (python yolo_server.py)');
      console.error(`   2. SERVER_URL is correct: ${SERVER_URL}`);
      console.error('   3. Firewall allows port 8000');
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Detect objects in image data
   */
  async detectFromImage(
    imageUri: string,
    imageWidth: number,
    imageHeight: number,
    screenWidth: number,
    screenHeight: number
  ): Promise<DetectionResult> {
    if (!this.isReady()) {
      console.log('⚠️ Detection service not ready');
      return {
        objects: [],
        timestamp: Date.now(),
        frameSize: { width: screenWidth, height: screenHeight },
      };
    }

    if (this.isDetecting) {
      return {
        objects: [],
        timestamp: Date.now(),
        frameSize: { width: screenWidth, height: screenHeight },
      };
    }

    this.isDetecting = true;

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'frame.jpg',
      } as any);

      // Send to server
      const response = await fetch(`${SERVER_URL}/detect`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (!data.success || !data.detections) {
        console.log('⚠️ No detections returned');
        return {
          objects: [],
          timestamp: Date.now(),
          frameSize: { width: screenWidth, height: screenHeight },
        };
      }

      // Calculate scale factors
      const scaleX = screenWidth / imageWidth;
      const scaleY = screenHeight / imageHeight;

      // Convert server detections to our format
      const detectedObjects: DetectedObject[] = data.detections.map((det: any) => {
        // CRITICAL: Calculate position/distance based on ACTUAL IMAGE size
        // This fixes the "always on right side" bug
        const position = calculatePosition(det.bbox, imageWidth);
        const distance = estimateDistance(det.bbox, imageWidth, imageHeight);

        const [x1, y1, x2, y2] = det.bbox;

        return {
          class: det.class,
          confidence: det.confidence,
          bbox: {
            x: x1 * scaleX,
            y: y1 * scaleY,
            width: (x2 - x1) * scaleX,
            height: (y2 - y1) * scaleY,
          },
          position,
          distance,
        };
      });

      console.log(`🎯 Detected ${detectedObjects.length} objects`);

      return {
        objects: detectedObjects,
        timestamp: Date.now(),
        frameSize: { width: screenWidth, height: screenHeight },
      };

    } catch (error) {
      console.error('❌ Detection error:', error);
      return {
        objects: [],
        timestamp: Date.now(),
        frameSize: { width: screenWidth, height: screenHeight },
      };
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Filter objects by confidence threshold
   */
  filterByConfidence(
    objects: DetectedObject[],
    minConfidence: number = 0.5
  ): DetectedObject[] {
    return objects.filter((obj) => obj.confidence >= minConfidence);
  }

  /**
   * Get only critical/important objects
   */
  getCriticalObjects(objects: DetectedObject[]): DetectedObject[] {
    const criticalClasses = [
      'person',
      'bicycle',
      'car',
      'motorcycle',
      'bus',
      'truck',
      'traffic light',
      'stop sign',
      'chair',
      'couch',
      'door',
      'stairs',
    ];

    return objects.filter((obj) => criticalClasses.includes(obj.class));
  }

  /**
   * Sort objects by priority
   */
  sortByPriority(objects: DetectedObject[]): DetectedObject[] {
    return objects.sort((a, b) => {
      const positionScore = (obj: DetectedObject) => {
        if (obj.position === 'center') return 3;
        if (obj.position === 'left' || obj.position === 'right') return 2;
        return 1;
      };

      const distanceScore = (obj: DetectedObject) => {
        if (obj.distance === 'very close') return 4;
        if (obj.distance === 'close') return 3;
        if (obj.distance === 'medium') return 2;
        return 1;
      };

      const scoreA = positionScore(a) * distanceScore(a);
      const scoreB = positionScore(b) * distanceScore(b);

      return scoreB - scoreA;
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    console.log('🧹 Cleaning up detection service');
    this.isInitialized = false;
  }
}

export default new DetectionService();