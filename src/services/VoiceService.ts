// src/services/VoiceService.ts

import Tts from 'react-native-tts';
import { DetectedObject } from '../types/detection.types';

class VoiceService {
  private isInitialized = false;
  private lastAnnouncement: string = '';
  private lastAnnouncementTime: number = 0;
  private announcementCooldown: number = 3000;
  private isSpeaking: boolean = false;
  private announcedObjects: Map<string, number> = new Map();

  async initialize(): Promise<boolean> {
    try {
      console.log('🔊 Initializing Text-to-Speech...');

      await Tts.getInitStatus();
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.6);
      await Tts.setDefaultPitch(1.0);
      await Tts.setDucking(true);

      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
      });

      this.isInitialized = true;
      console.log('✅ TTS initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize TTS:', error);
      this.isInitialized = false;
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  speak(text: string, force: boolean = false): void {
    if (!text) return;

    try {
      if (!force && this.isSpeaking) {
        return;
      }

      if (!force && text === this.lastAnnouncement) {
        const timeSinceLastAnnouncement = Date.now() - this.lastAnnouncementTime;
        if (timeSinceLastAnnouncement < this.announcementCooldown) {
          return;
        }
      }

      console.log(`🔊 "${text}"`);
      
      Tts.stop();
      Tts.speak(text, {
        androidParams: {
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        }
      });

      this.lastAnnouncement = text;
      this.lastAnnouncementTime = Date.now();

    } catch (error) {
      console.error('❌ TTS error:', error);
    }
  }

  stop(): void {
    try {
      Tts.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('❌ Error stopping TTS:', error);
    }
  }

  announceObjects(objects: DetectedObject[]): void {
    if (!this.isReady() || objects.length === 0) {
      return;
    }

    if (this.isSpeaking) {
      return;
    }

    const navigationGuidance = this.generateNavigationGuidance(objects);

    if (!navigationGuidance) {
      return;
    }

    const guidanceKey = navigationGuidance;
    const lastAnnouncedTime = this.announcedObjects.get(guidanceKey) || 0;
    const timeSinceLastAnnouncement = Date.now() - lastAnnouncedTime;

    if (timeSinceLastAnnouncement < this.announcementCooldown) {
      return;
    }

    this.speak(navigationGuidance);
    this.announcedObjects.set(guidanceKey, Date.now());

    setTimeout(() => {
      this.announcedObjects.delete(guidanceKey);
    }, this.announcementCooldown);
  }

  private generateNavigationGuidance(objects: DetectedObject[]): string | null {
    // Filter high-confidence objects
    const criticalObjects = objects.filter(obj => obj.confidence > 0.5);

    if (criticalObjects.length === 0) {
      return null;
    }

    // Log detected objects for debugging
    console.log('🎯 Detected:', criticalObjects.map(obj => 
      `${obj.class}[${obj.position},${obj.distance}]`
    ).join(' '));

    // Group by position
    const centerObjects = criticalObjects.filter(obj => obj.position === 'center');
    const leftObjects = criticalObjects.filter(obj => obj.position === 'left');
    const rightObjects = criticalObjects.filter(obj => obj.position === 'right');

    // Group by distance
    const veryCloseCenter = centerObjects.filter(obj => obj.distance === 'very close');
    const closeCenter = centerObjects.filter(obj => obj.distance === 'close');
    const veryCloseLeft = leftObjects.filter(obj => obj.distance === 'very close');
    const veryCloseRight = rightObjects.filter(obj => obj.distance === 'very close');

    // PRIORITY 1: Very close object in CENTER path
    if (veryCloseCenter.length > 0) {
      const obj = veryCloseCenter[0];
      const name = this.getObjectName(obj.class);
      
      // Both sides blocked - STOP
      if (veryCloseLeft.length > 0 && veryCloseRight.length > 0) {
        return `${name} blocking path. Stop`;
      }
      
      // Right blocked, left clear
      if (veryCloseRight.length > 0 && veryCloseLeft.length === 0) {
        return `${name} ahead. Move left`;
      }
      
      // Left blocked, right clear
      if (veryCloseLeft.length > 0 && veryCloseRight.length === 0) {
        return `${name} ahead. Move right`;
      }
      
      // Both clear - choose side with fewer obstacles
      if (leftObjects.length < rightObjects.length) {
        return `${name} ahead. Move left`;
      } else if (rightObjects.length < leftObjects.length) {
        return `${name} ahead. Move right`;
      } else {
        return `${name} ahead. Move left`;
      }
    }

    // PRIORITY 2: Close object in CENTER
    if (closeCenter.length > 0) {
      const obj = closeCenter[0];
      const name = this.getObjectName(obj.class);
      
      if (leftObjects.length < rightObjects.length) {
        return `${name} ahead. Move left`;
      } else if (rightObjects.length < leftObjects.length) {
        return `${name} ahead. Move right`;
      } else {
        return `${name} ahead. Move left`;
      }
    }

    // PRIORITY 3: Very close on LEFT
    if (veryCloseLeft.length > 0) {
      const obj = veryCloseLeft[0];
      const name = this.getObjectName(obj.class);
      return `${name} on left. Move right`;
    }

    // PRIORITY 4: Very close on RIGHT
    if (veryCloseRight.length > 0) {
      const obj = veryCloseRight[0];
      const name = this.getObjectName(obj.class);
      return `${name} on right. Move left`;
    }

    // PRIORITY 5: General awareness
    const sortedByPriority = [...criticalObjects].sort((a, b) => {
      const getPriority = (obj: DetectedObject) => {
        let score = 0;
        
        // Distance score
        if (obj.distance === 'very close') score += 100;
        else if (obj.distance === 'close') score += 50;
        else if (obj.distance === 'medium') score += 25;
        else score += 10;
        
        // Position score
        if (obj.position === 'center') score += 40;
        else if (obj.position === 'left' || obj.position === 'right') score += 20;
        
        // Confidence
        score += obj.confidence * 15;
        
        return score;
      };
      return getPriority(b) - getPriority(a);
    });

    if (sortedByPriority.length > 0) {
      const obj = sortedByPriority[0];
      const name = this.getObjectName(obj.class);
      
      if (obj.position === 'center') {
        return `${name} ahead`;
      } else if (obj.position === 'left') {
        return `${name} on left`;
      } else if (obj.position === 'right') {
        return `${name} on right`;
      }
    }

    return null;
  }

  private getObjectName(className: string): string {
    const names: { [key: string]: string } = {
      'person': 'person',
      'car': 'car',
      'truck': 'truck',
      'bus': 'bus',
      'bicycle': 'bike',
      'motorcycle': 'motorcycle',
      'chair': 'chair',
      'couch': 'sofa',
      'bed': 'bed',
      'dining table': 'table',
      'door': 'door',
      'cell phone': 'phone',
      'laptop': 'laptop',
      'bottle': 'bottle',
      'cup': 'cup',
      'book': 'book',
      'traffic light': 'traffic light',
      'stop sign': 'stop sign',
      'bench': 'bench',
      'backpack': 'bag',
      'handbag': 'bag',
      'suitcase': 'suitcase',
      'umbrella': 'umbrella',
      'tv': 'TV',
      'oven': 'oven',
      'microwave': 'microwave',
      'refrigerator': 'fridge',
      'sink': 'sink',
      'toilet': 'toilet',
      'potted plant': 'plant',
    };

    return names[className] || className;
  }

  setCooldown(milliseconds: number): void {
    this.announcementCooldown = milliseconds;
  }

  clearTracking(): void {
    this.announcedObjects.clear();
    this.lastAnnouncement = '';
  }

  dispose(): void {
    this.stop();
    this.clearTracking();
    
    Tts.removeAllListeners('tts-start');
    Tts.removeAllListeners('tts-finish');
    Tts.removeAllListeners('tts-cancel');
    
    this.isInitialized = false;
  }
}

export default new VoiceService();