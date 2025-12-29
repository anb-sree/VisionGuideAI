import Tts from 'react-native-tts';

class VoiceService {
  async initialize(): Promise<boolean> {
    try {
      await Tts.getInitStatus();
      await Tts.setDefaultLanguage('en-US');
      await Tts.setDefaultRate(0.5);
      await Tts.setDucking(true);
      return true;
    } catch (e) {
      console.error('TTS init error', e);
      return false;
    }
  }

  speak(text: string) {
    if (!text) return;
    Tts.stop();
    Tts.speak(text);
  }

  stop() {
    Tts.stop();
  }
}

export default new VoiceService();
