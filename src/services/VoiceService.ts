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
        console.log('🔊 Started speaking');
      });

      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        console.log('🔊 Finished speaking');
      });

      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        console.log('🔊 Speech cancelled');
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
        console.log('⏭️ Skipping announcement - already speaking');
        return;
      }

      if (!force && text === this.lastAnnouncement) {
        const timeSinceLastAnnouncement = Date.now() - this.lastAnnouncementTime;
        if (timeSinceLastAnnouncement < this.announcementCooldown) {
          console.log('⏭️ Skipping duplicate announcement');
          return;
        }
      }

      console.log(`🔊 Speaking: "${text}"`);
      
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
      console.log('⏭️ Skipping - TTS is busy');
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
      console.log(`⏭️ Skipping - recently announced: ${guidanceKey}`);
      return;
    }

    this.speak(navigationGuidance);
    this.announcedObjects.set(guidanceKey, Date.now());

    setTimeout(() => {
      this.announcedObjects.delete(guidanceKey);
    }, this.announcementCooldown);
  }

  private generateNavigationGuidance(objects: DetectedObject[]): string | null {
    const criticalObjects = objects.filter(obj => obj.confidence > 0.5);

    if (criticalObjects.length === 0) {
      return null;
    }

    const centerObjects = criticalObjects.filter(obj => obj.position === 'center');
    const leftObjects = criticalObjects.filter(obj => obj.position === 'left');
    const rightObjects = criticalObjects.filter(obj => obj.position === 'right');

    const veryCloseCenter = centerObjects.filter(obj => obj.distance === 'very close');
    const closeCenter = centerObjects.filter(obj => obj.distance === 'close');
    const veryCloseLeft = leftObjects.filter(obj => obj.distance === 'very close');
    const veryCloseRight = rightObjects.filter(obj => obj.distance === 'very close');

    if (veryCloseCenter.length > 0) {
      const obj = veryCloseCenter[0];
      const objectName = this.getObjectName(obj.class);
      
      if (veryCloseLeft.length > 0 && veryCloseRight.length === 0) {
        return `${objectName} ahead. Move right`;
      } else if (veryCloseRight.length > 0 && veryCloseLeft.length === 0) {
        return `${objectName} ahead. Move left`;
      } else if (veryCloseLeft.length === 0 && veryCloseRight.length === 0) {
        if (leftObjects.length < rightObjects.length) {
          return `${objectName} ahead. Move left`;
        } else {
          return `${objectName} ahead. Move right`;
        }
      } else {
        return `${objectName} blocking path. Stop`;
      }
    }

    if (closeCenter.length > 0) {
      const obj = closeCenter[0];
      const objectName = this.getObjectName(obj.class);
      
      if (leftObjects.length < rightObjects.length) {
        return `${objectName} ahead. Move left`;
      } else {
        return `${objectName} ahead. Move right`;
      }
    }

    if (veryCloseLeft.length > 0) {
      const obj = veryCloseLeft[0];
      const objectName = this.getObjectName(obj.class);
      return `${objectName} on left. Move right`;
    }

    if (veryCloseRight.length > 0) {
      const obj = veryCloseRight[0];
      const objectName = this.getObjectName(obj.class);
      return `${objectName} on right. Move left`;
    }

    const sortedByPriority = criticalObjects.sort((a, b) => {
      const getPriority = (obj: DetectedObject) => {
        let priority = 0;
        if (obj.distance === 'very close') priority += 100;
        else if (obj.distance === 'close') priority += 50;
        else if (obj.distance === 'medium') priority += 20;
        
        if (obj.position === 'center') priority += 30;
        priority += obj.confidence * 10;
        return priority;
      };
      return getPriority(b) - getPriority(a);
    });

    if (sortedByPriority.length > 0) {
      const obj = sortedByPriority[0];
      const objectName = this.getObjectName(obj.class);
      
      if (obj.position === 'left') {
        return `${objectName} on left`;
      } else if (obj.position === 'right') {
        return `${objectName} on right`;
      } else {
        return `${objectName} ahead`;
      }
    }

    return null;
  }

  private getObjectName(className: string): string {
    const friendlyNames: { [key: string]: string } = {
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

    return friendlyNames[className] || className;
  }

  setCooldown(milliseconds: number): void {
    this.announcementCooldown = milliseconds;
  }

  clearTracking(): void {
    this.announcedObjects.clear();
    this.lastAnnouncement = '';
    console.log('🧹 Cleared announcement tracking');
  }

  dispose(): void {
    this.stop();
    this.clearTracking();
    
    Tts.removeAllListeners('tts-start');
    Tts.removeAllListeners('tts-finish');
    Tts.removeAllListeners('tts-cancel');
    
    this.isInitialized = false;
    console.log('🧹 Voice service disposed');
  }
}

export default new VoiceService();