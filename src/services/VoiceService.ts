// src/services/VoiceService.ts

import Tts from 'react-native-tts';
import { DetectedObject } from '../types/detection.types';

class VoiceService {
  private isInitialized = false;
  private lastAnnouncement: string = '';
  private lastAnnouncementTime: number = 0;
  private announcementCooldown: number = 3000; // 3 seconds between same announcement

  /**
   * Initialize TTS
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔊 Initializing Text-to-Speech...');

      await Tts.getInitStatus();
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.5); // Speech speed
      await Tts.setDefaultPitch(1.0); // Voice pitch
      await Tts.setDucking(true); // Lower other audio when speaking

      this.isInitialized = true;
      console.log('✅ TTS initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize TTS:', error);
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
   * Speak text
   */
  speak(text: string, force: boolean = false): void {
    if (!text) return;

    try {
      // Prevent repeating same announcement too quickly
      if (!force && text === this.lastAnnouncement) {
        const timeSinceLastAnnouncement = Date.now() - this.lastAnnouncementTime;
        if (timeSinceLastAnnouncement < this.announcementCooldown) {
          return; // Skip duplicate announcement
        }
      }

      console.log(`🔊 Speaking: "${text}"`);
      
      // Stop any current speech
      Tts.stop();
      
      // Speak the text
      Tts.speak(text);

      this.lastAnnouncement = text;
      this.lastAnnouncementTime = Date.now();

    } catch (error) {
      console.error('❌ TTS error:', error);
    }
  }

  /**
   * Stop speaking
   */
  stop(): void {
    try {
      Tts.stop();
    } catch (error) {
      console.error('❌ Error stopping TTS:', error);
    }
  }

  /**
   * Announce detected objects
   */
  announceObjects(objects: DetectedObject[]): void {
    if (!this.isReady() || objects.length === 0) {
      return;
    }

    // Get critical objects (closest, centered, high priority)
    const criticalObjects = this.getCriticalObjects(objects);

    if (criticalObjects.length === 0) {
      return;
    }

    // Announce the most important object
    const mostImportant = criticalObjects[0];
    const announcement = this.formatAnnouncement(mostImportant);
    
    this.speak(announcement);
  }

  /**
   * Get critical objects that need immediate announcement
   */
  private getCriticalObjects(objects: DetectedObject[]): DetectedObject[] {
    return objects
      .filter(obj => {
        // Only announce if confidence is high enough
        if (obj.confidence < 0.6) return false;

        // Critical: Object in center and close
        if (obj.position === 'center' && 
            (obj.distance === 'very close' || obj.distance === 'close')) {
          return true;
        }

        // Critical: Object very close on any side
        if (obj.distance === 'very close') {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        // Sort by priority
        const getPriority = (obj: DetectedObject) => {
          let priority = 0;

          // Distance priority
          if (obj.distance === 'very close') priority += 100;
          else if (obj.distance === 'close') priority += 50;
          else if (obj.distance === 'medium') priority += 20;

          // Position priority
          if (obj.position === 'center') priority += 30;
          else priority += 10;

          // Confidence priority
          priority += obj.confidence * 10;

          return priority;
        };

        return getPriority(b) - getPriority(a);
      });
  }

  /**
   * Format announcement for an object
   */
  private formatAnnouncement(obj: DetectedObject): string {
    const objectName = this.getObjectName(obj.class);
    const distance = obj.distance;
    const position = obj.position;

    // Different announcement styles based on urgency
    if (distance === 'very close' && position === 'center') {
      return `Warning! ${objectName} directly ahead, very close!`;
    }

    if (distance === 'very close') {
      return `${objectName} very close on your ${position}`;
    }

    if (distance === 'close' && position === 'center') {
      return `${objectName} ahead`;
    }

    return `${objectName} on your ${position}`;
  }

  /**
   * Get friendly object name
   */
  private getObjectName(className: string): string {
    const friendlyNames: { [key: string]: string } = {
      'person': 'person',
      'car': 'vehicle',
      'truck': 'truck',
      'bus': 'bus',
      'bicycle': 'bicycle',
      'motorcycle': 'motorcycle',
      'chair': 'chair',
      'couch': 'sofa',
      'door': 'door',
      'cell phone': 'phone',
      'laptop': 'laptop',
      'bottle': 'bottle',
      'cup': 'cup',
      'book': 'book',
      'traffic light': 'traffic light',
      'stop sign': 'stop sign',
    };

    return friendlyNames[className] || className;
  }

  /**
   * Set announcement cooldown (time between repeated announcements)
   */
  setCooldown(milliseconds: number): void {
    this.announcementCooldown = milliseconds;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.isInitialized = false;
    console.log('🧹 Voice service disposed');
  }
}

export default new VoiceService();