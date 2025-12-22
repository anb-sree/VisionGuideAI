import Tts from 'react-native-tts';

// Basic configuration
Tts.setDefaultLanguage('en-US');
Tts.setDefaultRate(0.5);
Tts.setDefaultPitch(1.0);

export const speak = (message) => {
  Tts.stop();        // stop previous speech
  Tts.speak(message);
};
