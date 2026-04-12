// src/services/VoiceService.ts

import Tts from 'react-native-tts';
import { DetectedObject } from '../types/detection.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VoiceService {
  private isInitialized = false;
  private lastAnnouncement: string = '';
  private lastAnnouncementTime: number = 0;
  private announcementCooldown: number = 3000;
  private isSpeaking: boolean = false;
  private announcedObjects: Map<string, number> = new Map();
  private currentLanguage: string = 'en-US';

  async initialize(): Promise<boolean> {
    try {
      console.log('🔊 Initializing Text-to-Speech...');

      await Tts.getInitStatus();

      // Load saved language preference
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.selectedLanguage) {
          this.currentLanguage = parsed.selectedLanguage;
        }
      }

      await this.setLanguage(this.currentLanguage);
      await Tts.setDefaultRate(0.55);
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
      console.log('✅ TTS initialized with language:', this.currentLanguage);
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize TTS:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    try {
      this.currentLanguage = languageCode;
      await Tts.setDefaultLanguage(languageCode);
      console.log('🌐 Language set to:', languageCode);
    } catch (error) {
      console.error('❌ Failed to set language:', error);
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  speak(key: string, force: boolean = false): void {
    if (!key) return;

    try {
      const text = this.translate(key);

      if (!force && this.isSpeaking) {
        return;
      }

      if (!force && text === this.lastAnnouncement) {
        const timeSinceLastAnnouncement = Date.now() - this.lastAnnouncementTime;
        if (timeSinceLastAnnouncement < this.announcementCooldown) {
          return;
        }
      }

      console.log(`🔊 Speaking: "${text}" in ${this.currentLanguage}`);

      Tts.stop();
      Tts.speak(text);

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

    try {
      console.log(`🔊 Announcing: "${navigationGuidance}" in ${this.currentLanguage}`);
      Tts.stop();
      Tts.speak(navigationGuidance);

      this.announcedObjects.set(guidanceKey, Date.now());

      setTimeout(() => {
        this.announcedObjects.delete(guidanceKey);
      }, this.announcementCooldown);
    } catch (error) {
      console.error('❌ Error announcing objects:', error);
    }
  }

  private generateNavigationGuidance(objects: DetectedObject[]): string | null {
    const criticalObjects = objects.filter(obj => obj.confidence > 0.5);

    if (criticalObjects.length === 0) {
      return null;
    }

    console.log('🎯 POSITION DEBUG:');
    criticalObjects.forEach(obj => {
      console.log(`  ${obj.class}: position="${obj.position}", distance="${obj.distance}", bbox=${JSON.stringify(obj.bbox)}`);
    });

    const centerObjects = criticalObjects.filter(obj => obj.position === 'center');
    const leftObjects = criticalObjects.filter(obj => obj.position === 'left');
    const rightObjects = criticalObjects.filter(obj => obj.position === 'right');

    console.log(`  Groups: center=${centerObjects.length}, left=${leftObjects.length}, right=${rightObjects.length}`);

    const veryCloseCenter = centerObjects.filter(obj => obj.distance === 'very close');
    const closeCenter = centerObjects.filter(obj => obj.distance === 'close');
    const veryCloseLeft = leftObjects.filter(obj => obj.distance === 'very close');
    const veryCloseRight = rightObjects.filter(obj => obj.distance === 'very close');

    if (veryCloseCenter.length > 0) {
      const obj = veryCloseCenter[0];
      const name = this.getObjectName(obj.class);
      const distanceDesc = this.getDistanceDescription(obj.distance);

      if (veryCloseLeft.length > 0 && veryCloseRight.length > 0) {
        return this.translateWithParams('STOP_BLOCKED', { object: name });
      }

      if (veryCloseRight.length > 0 && veryCloseLeft.length === 0) {
        return this.translateWithParams('OBSTACLE_MOVE_LEFT', {
          object: name,
          distance: distanceDesc
        });
      }

      if (veryCloseLeft.length > 0 && veryCloseRight.length === 0) {
        return this.translateWithParams('OBSTACLE_MOVE_RIGHT', {
          object: name,
          distance: distanceDesc
        });
      }

      if (leftObjects.length < rightObjects.length) {
        return this.translateWithParams('OBSTACLE_PREFER_LEFT', {
          object: name,
          distance: distanceDesc
        });
      } else if (rightObjects.length < leftObjects.length) {
        return this.translateWithParams('OBSTACLE_PREFER_RIGHT', {
          object: name,
          distance: distanceDesc
        });
      } else {
        return this.translateWithParams('OBSTACLE_MOVE_LEFT', {
          object: name,
          distance: distanceDesc
        });
      }
    }

    if (closeCenter.length > 0) {
      const obj = closeCenter[0];
      const name = this.getObjectName(obj.class);
      const distanceDesc = this.getDistanceDescription(obj.distance);

      if (leftObjects.length < rightObjects.length) {
        return this.translateWithParams('OBJECT_AHEAD_MOVE_LEFT', {
          object: name,
          distance: distanceDesc
        });
      } else if (rightObjects.length < leftObjects.length) {
        return this.translateWithParams('OBJECT_AHEAD_MOVE_RIGHT', {
          object: name,
          distance: distanceDesc
        });
      } else {
        return this.translateWithParams('OBJECT_AHEAD_MOVE_LEFT', {
          object: name,
          distance: distanceDesc
        });
      }
    }

    if (veryCloseLeft.length > 0) {
      const obj = veryCloseLeft[0];
      const name = this.getObjectName(obj.class);
      const distanceDesc = this.getDistanceDescription(obj.distance);
      return this.translateWithParams('OBJECT_ON_LEFT', {
        object: name,
        distance: distanceDesc
      });
    }

    if (veryCloseRight.length > 0) {
      const obj = veryCloseRight[0];
      const name = this.getObjectName(obj.class);
      const distanceDesc = this.getDistanceDescription(obj.distance);
      return this.translateWithParams('OBJECT_ON_RIGHT', {
        object: name,
        distance: distanceDesc
      });
    }

    const sortedByPriority = [...criticalObjects].sort((a, b) => {
      const getPriority = (obj: DetectedObject) => {
        let score = 0;

        if (obj.distance === 'very close') score += 100;
        else if (obj.distance === 'close') score += 50;
        else if (obj.distance === 'medium') score += 25;
        else score += 10;

        if (obj.position === 'center') score += 40;
        else if (obj.position === 'left' || obj.position === 'right') score += 20;

        score += obj.confidence * 15;

        return score;
      };
      return getPriority(b) - getPriority(a);
    });

    if (sortedByPriority.length > 0) {
      const obj = sortedByPriority[0];
      const name = this.getObjectName(obj.class);
      const distanceDesc = this.getDistanceDescription(obj.distance);

      if (obj.position === 'center') {
        return this.translateWithParams('OBJECT_AHEAD', {
          object: name,
          distance: distanceDesc
        });
      } else if (obj.position === 'left') {
        return this.translateWithParams('OBJECT_DETECTED_LEFT', {
          object: name,
          distance: distanceDesc
        });
      } else if (obj.position === 'right') {
        return this.translateWithParams('OBJECT_DETECTED_RIGHT', {
          object: name,
          distance: distanceDesc
        });
      }
    }

    return null;
  }

  private getDistanceDescription(distance: string): string {
    const translations: { [lang: string]: { [key: string]: string } } = {
      'en-US': { 'very close': 'very close', 'close': 'close by', 'medium': 'at medium distance', 'far': 'far away' },
      'hi-IN': { 'very close': 'बहुत करीब', 'close': 'पास में', 'medium': 'मध्यम दूरी पर', 'far': 'दूर' },
      'kn-IN': { 'very close': 'ತುಂಬಾ ಹತ್ತಿರ', 'close': 'ಹತ್ತಿರದಲ್ಲಿ', 'medium': 'ಮಧ್ಯಮ ದೂರದಲ್ಲಿ', 'far': 'ದೂರದಲ್ಲಿ' },
      'te-IN': { 'very close': 'చాలా దగ్గరగా', 'close': 'దగ్గరలో', 'medium': 'మధ్యస్థ దూరంలో', 'far': 'దూరంగా' },
      'ta-IN': { 'very close': 'மிக அருகில்', 'close': 'அருகில்', 'medium': 'நடுத்தர தூரத்தில்', 'far': 'தொலைவில்' },
      'es-ES': { 'very close': 'muy cerca', 'close': 'cerca', 'medium': 'a distancia media', 'far': 'lejos' },
    };

    const langTranslations = translations[this.currentLanguage] || translations['en-US'];
    return langTranslations[distance] || '';
  }

  private translate(key: string): string {
    const translations: { [lang: string]: { [key: string]: string } } = {
      'en-US': {
        'APP_READY': 'VisionGuide ready. Press start guidance to begin',
        'GUIDANCE_STARTED': 'Guidance started. I will help you navigate',
        'GUIDANCE_ENDED': 'Guidance ended',
        'LANGUAGE_CHANGED': 'Language changed successfully',
        'ENTER_DESTINATION': 'Please enter a destination first before viewing maps',
      },
      'hi-IN': {
        'APP_READY': 'विज़नगाइड तैयार है। शुरू करने के लिए स्टार्ट गाइडेंस दबाएं',
        'GUIDANCE_STARTED': 'मार्गदर्शन शुरू हुआ। मैं आपकी सहायता करूंगा',
        'GUIDANCE_ENDED': 'मार्गदर्शन समाप्त हुआ',
        'LANGUAGE_CHANGED': 'भाषा सफलतापूर्वक बदली गई',
        'ENTER_DESTINATION': 'नक्शे देखने से पहले कृपया एक गंतव्य दर्ज करें',
      },
      'kn-IN': {
        'APP_READY': 'ವಿಷನ್‌ಗೈಡ್ ಸಿದ್ಧವಾಗಿದೆ. ಪ್ರಾರಂಭಿಸಲು ಸ್ಟಾರ್ಟ್ ಗೈಡೆನ್ಸ್ ಒತ್ತಿರಿ',
        'GUIDANCE_STARTED': 'ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭವಾಯಿತು. ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ',
        'GUIDANCE_ENDED': 'ಮಾರ್ಗದರ್ಶನ ಮುಗಿದಿದೆ',
        'LANGUAGE_CHANGED': 'ಭಾಷೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ',
        'ENTER_DESTINATION': 'ನಕ್ಷೆಗಳನ್ನು ನೋಡುವ ಮೊದಲು ದಯವಿಟ್ಟು ಗಮ್ಯಸ್ಥಾನವನ್ನು ನಮೂದಿಸಿ',
      },
      'te-IN': {
        'APP_READY': 'విజన్‌గైడ్ సిద్ధంగా ఉంది. ప్రారంభించడానికి స్టార్ట్ గైడెన్స్ నొక్కండి',
        'GUIDANCE_STARTED': 'మార్గదర్శకత్వం ప్రారంభమైంది. నేను మీకు సహాయం చేస్తాను',
        'GUIDANCE_ENDED': 'మార్గదర్శకత్వం ముగిసింది',
        'LANGUAGE_CHANGED': 'భాష విజయవంతంగా మార్చబడింది',
        'ENTER_DESTINATION': 'మ్యాప్‌లను చూడటానికి ముందు దయచేసి గమ్యాన్ని నమోదు చేయండి',
      },
      'ta-IN': {
        'APP_READY': 'விஷன்கைட் தயாராக உள்ளது. தொடங்க ஸ்டார்ட் கைடன்ஸ் அழுத்தவும்',
        'GUIDANCE_STARTED': 'வழிகாட்டுதல் தொடங்கியது. நான் உங்களுக்கு உதவுவேன்',
        'GUIDANCE_ENDED': 'வழிகாட்டுதல் முடிந்தது',
        'LANGUAGE_CHANGED': 'மொழி வெற்றிகரமாக மாற்றப்பட்டது',
        'ENTER_DESTINATION': 'வரைபடங்களைப் பார்ப்பதற்கு முன் முதலில் ஒரு இலக்கை உள்ளிடவும்',
      },
      'es-ES': {
        'APP_READY': 'VisionGuide listo. Presione iniciar guía para comenzar',
        'GUIDANCE_STARTED': 'Guía iniciada. Te ayudaré a navegar',
        'GUIDANCE_ENDED': 'Guía finalizada',
        'LANGUAGE_CHANGED': 'Idioma cambiado exitosamente',
        'ENTER_DESTINATION': 'Por favor, ingrese un destino antes de ver los mapas',
      },
    };

    const langTranslations = translations[this.currentLanguage] || translations['en-US'];
    return langTranslations[key] || key;
  }

  private translateWithParams(key: string, params: { [key: string]: string }): string {
    const translations: { [lang: string]: { [key: string]: string } } = {
      'en-US': {
        'STOP_BLOCKED': `Caution! ${params.object} blocking your path. Stop immediately`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} directly ahead. Move to your left`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} directly ahead. Move to your right`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} in your path. Left side is clearer`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} in your path. Right side is clearer`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} ahead. Shift left`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} ahead. Shift right`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} on your left side. Move right`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} on your right side. Move left`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} ahead`,
        'OBJECT_DETECTED_LEFT': `${params.object} detected on left, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} detected on right, ${params.distance}`,
      },
      'hi-IN': {
        'STOP_BLOCKED': `सावधान! ${params.object} आपका रास्ता रोक रहा है। तुरंत रुकें`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} सीधे आगे है। बाईं ओर जाएं`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} सीधे आगे है। दाईं ओर जाएं`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} आपके रास्ते में है। बाईं ओर अधिक खाली है`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} आपके रास्ते में है। दाईं ओर अधिक खाली है`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} आगे है। बाएं मुड़ें`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} आगे है। दाएं मुड़ें`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} आपके बाईं ओर है। दाईं ओर जाएं`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} आपके दाईं ओर है। बाईं ओर जाएं`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} आगे है`,
        'OBJECT_DETECTED_LEFT': `${params.object} बाईं ओर पाया गया, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} दाईं ओर पाया गया, ${params.distance}`,
      },
      'kn-IN': {
        'STOP_BLOCKED': `ಎಚ್ಚರಿಕೆ! ${params.object} ನಿಮ್ಮ ದಾರಿಯನ್ನು ತಡೆಯುತ್ತಿದೆ। ತಕ್ಷಣ ನಿಲ್ಲಿಸಿ`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} ನೇರವಾಗಿ ಮುಂದೆ. ಎಡಕ್ಕೆ ಸರಿಸಿ`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} ನೇರವಾಗಿ ಮುಂದೆ. ಬಲಕ್ಕೆ ಸರಿಸಿ`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} ನಿಮ್ಮ ಮಾರ್ಗದಲ್ಲಿ. ಎಡಭಾಗ ಸ್ಪಷ್ಟವಾಗಿದೆ`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} ನಿಮ್ಮ ಮಾರ್ಗದಲ್ಲಿ. ಬಲಭಾಗ ಸ್ಪಷ್ಟವಾಗಿದೆ`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} ಮುಂದೆ. ಎಡಕ್ಕೆ ತಿರುಗಿ`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} ಮುಂದೆ. ಬಲಕ್ಕೆ ತಿರುಗಿ`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} ನಿಮ್ಮ ಎಡಭಾಗದಲ್ಲಿ. ಬಲಕ್ಕೆ ಸರಿಸಿ`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} ನಿಮ್ಮ ಬಲಭಾಗದಲ್ಲಿ. ಎಡಕ್ಕೆ ಸರಿಸಿ`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} ಮುಂದೆ`,
        'OBJECT_DETECTED_LEFT': `${params.object} ಎಡಭಾಗದಲ್ಲಿ ಕಂಡುಬಂದಿದೆ, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} ಬಲಭಾಗದಲ್ಲಿ ಕಂಡುಬಂದಿದೆ, ${params.distance}`,
      },
      'te-IN': {
        'STOP_BLOCKED': `జాగ్రత్త! ${params.object} మీ మార్గాన్ని అడ్డుకుంటోంది. వెంటనే ఆగండి`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} నేరుగా ముందు. ఎడమవైపుకు వెళ్లండి`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} నేరుగా ముందు. కుడివైపుకు వెళ్లండి`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} మీ మార్గంలో. ఎడమ వైపు స్పష్టంగా ఉంది`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} మీ మార్గంలో. కుడి వైపు స్పష్టంగా ఉంది`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} ముందు. ఎడమవైపుకు తిరగండి`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} ముందు. కుడివైపుకు తిరగండి`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} మీ ఎడమ వైపు. కుడివైపుకు వెళ్లండి`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} మీ కుడి వైపు. ఎడమవైపుకు వెళ్లండి`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} ముందు`,
        'OBJECT_DETECTED_LEFT': `${params.object} ఎడమవైపు కనిపించింది, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} కుడివైపు కనిపించింది, ${params.distance}`,
      },
      'ta-IN': {
        'STOP_BLOCKED': `கவனம்! ${params.object} உங்கள் பாதையை தடுக்கிறது. உடனடியாக நிறுத்துங்கள்`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} நேராக முன்னால். இடப்புறம் செல்லுங்கள்`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} நேராக முன்னால். வலப்புறம் செல்லுங்கள்`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} உங்கள் பாதையில். இடப்புறம் தெளிவாக உள்ளது`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} உங்கள் பாதையில். வலப்புறம் தெளிவாக உள்ளது`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} முன்னால். இடப்புறம் திரும்புங்கள்`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} முன்னால். வலப்புறம் திரும்புங்கள்`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} உங்கள் இடப்புறம். வலப்புறம் செல்லுங்கள்`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} உங்கள் வலப்புறம். இடப்புறம் செல்லுங்கள்`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} முன்னால்`,
        'OBJECT_DETECTED_LEFT': `${params.object} இடப்புறத்தில் கண்டறியப்பட்டது, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} வலப்புறத்தில் கண்டறியப்பட்டது, ${params.distance}`,
      },
      'es-ES': {
        'STOP_BLOCKED': `¡Precaución! ${params.object} bloqueando tu camino. Detente inmediatamente`,
        'OBSTACLE_MOVE_LEFT': `${params.object} ${params.distance} directamente adelante. Muévete a la izquierda`,
        'OBSTACLE_MOVE_RIGHT': `${params.object} ${params.distance} directamente adelante. Muévete a la derecha`,
        'OBSTACLE_PREFER_LEFT': `${params.object} ${params.distance} en tu camino. El lado izquierdo está más despejado`,
        'OBSTACLE_PREFER_RIGHT': `${params.object} ${params.distance} en tu camino. El lado derecho está más despejado`,
        'OBJECT_AHEAD_MOVE_LEFT': `${params.object} ${params.distance} adelante. Gira a la izquierda`,
        'OBJECT_AHEAD_MOVE_RIGHT': `${params.object} ${params.distance} adelante. Gira a la derecha`,
        'OBJECT_ON_LEFT': `${params.object} ${params.distance} a tu izquierda. Muévete a la derecha`,
        'OBJECT_ON_RIGHT': `${params.object} ${params.distance} a tu derecha. Muévete a la izquierda`,
        'OBJECT_AHEAD': `${params.object} ${params.distance} adelante`,
        'OBJECT_DETECTED_LEFT': `${params.object} detectado a la izquierda, ${params.distance}`,
        'OBJECT_DETECTED_RIGHT': `${params.object} detectado a la derecha, ${params.distance}`,
      },
    };

    const langTranslations = translations[this.currentLanguage] || translations['en-US'];
    return langTranslations[key] || key;
  }

  private getObjectName(className: string): string {
    const translations: { [lang: string]: { [key: string]: string } } = {
      'en-US': {
        'person': 'person', 'car': 'car', 'truck': 'truck', 'bus': 'bus',
        'bicycle': 'bicycle', 'motorcycle': 'motorcycle', 'chair': 'chair',
        'couch': 'sofa', 'bed': 'bed', 'dining table': 'table', 'door': 'door',
        'cell phone': 'phone', 'laptop': 'laptop', 'bottle': 'bottle',
        'cup': 'cup', 'book': 'book', 'traffic light': 'traffic light',
        'stop sign': 'stop sign', 'bench': 'bench', 'backpack': 'bag',
        'handbag': 'bag', 'suitcase': 'suitcase', 'umbrella': 'umbrella',
      },
      'hi-IN': {
        'person': 'व्यक्ति', 'car': 'कार', 'truck': 'ट्रक', 'bus': 'बस',
        'bicycle': 'साइकिल', 'motorcycle': 'मोटरसाइकिल', 'chair': 'कुर्सी',
        'couch': 'सोफा', 'bed': 'बिस्तर', 'dining table': 'मेज', 'door': 'दरवाजा',
        'cell phone': 'फोन', 'laptop': 'लैपटॉप', 'bottle': 'बोतल',
        'cup': 'कप', 'book': 'किताब', 'traffic light': 'ट्रैफिक लाइट',
        'stop sign': 'स्टॉप साइन', 'bench': 'बेंच', 'backpack': 'बैग',
      },
      'kn-IN': {
        'person': 'ವ್ಯಕ್ತಿ', 'car': 'ಕಾರು', 'truck': 'ಟ್ರಕ್', 'bus': 'ಬಸ್',
        'bicycle': 'ಬೈಸಿಕಲ್', 'motorcycle': 'ಮೋಟಾರ್‌ಸೈಕಲ್', 'chair': 'ಕುರ್ಚಿ',
        'couch': 'ಸೋಫಾ', 'bed': 'ಹಾಸಿಗೆ', 'dining table': 'ಮೇಜು', 'door': 'ಬಾಗಿಲು',
        'cell phone': 'ಫೋನ್', 'laptop': 'ಲ್ಯಾಪ್‌ಟಾಪ್', 'bottle': 'ಬಾಟಲಿ',
        'cup': 'ಕಪ್', 'book': 'ಪುಸ್ತಕ', 'traffic light': 'ಟ್ರಾಫಿಕ್ ಲೈಟ್',
        'stop sign': 'ಸ್ಟಾಪ್ ಸೈನ್', 'bench': 'ಬೆಂಚ್', 'backpack': 'ಬ್ಯಾಗ್',
      },
      'te-IN': {
        'person': 'వ్యక్తి', 'car': 'కారు', 'truck': 'ట్రక్కు', 'bus': 'బస్సు',
        'bicycle': 'సైకిల్', 'motorcycle': 'మోటార్‌సైకిల్', 'chair': 'కుర్చీ',
        'couch': 'సోఫా', 'bed': 'మంచం', 'dining table': 'టేబుల్', 'door': 'తలుపు',
        'cell phone': 'ఫోన్', 'laptop': 'ల్యాప్‌టాప్', 'bottle': 'బాటిల్',
        'cup': 'కప్పు', 'book': 'పుస్తకం', 'traffic light': 'ట్రాఫిక్ లైట్',
        'stop sign': 'స్టాప్ గుర్తు', 'bench': 'బెంచ్', 'backpack': 'బ్యాగ్',
      },
      'ta-IN': {
        'person': 'நபர்', 'car': 'கார்', 'truck': 'லாரி', 'bus': 'பேருந்து',
        'bicycle': 'சைக்கிள்', 'motorcycle': 'மோட்டார் சைக்கிள்', 'chair': 'நாற்காலி',
        'couch': 'சோபா', 'bed': 'படுக்கை', 'dining table': 'மேசை', 'door': 'கதவு',
        'cell phone': 'தொலைபேசி', 'laptop': 'மடிக்கணினி', 'bottle': 'பாட்டில்',
        'cup': 'கப்', 'book': 'புத்தகம்', 'traffic light': 'போக்குவரத்து விளக்கு',
        'stop sign': 'நிறுத்த அடையாளம்', 'bench': 'பெஞ்ச்', 'backpack': 'பை',
      },
      'es-ES': {
        'person': 'persona', 'car': 'coche', 'truck': 'camión', 'bus': 'autobús',
        'bicycle': 'bicicleta', 'motorcycle': 'motocicleta', 'chair': 'silla',
        'couch': 'sofá', 'bed': 'cama', 'dining table': 'mesa', 'door': 'puerta',
        'cell phone': 'teléfono', 'laptop': 'portátil', 'bottle': 'botella',
        'cup': 'taza', 'book': 'libro', 'traffic light': 'semáforo',
        'stop sign': 'señal de alto', 'bench': 'banco', 'backpack': 'mochila',
      },
    };

    const langNames = translations[this.currentLanguage] || translations['en-US'];
    return langNames[className] || className;
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