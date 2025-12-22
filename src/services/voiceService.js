import Voice from '@react-native-voice/voice';

export const startListening = (onResult) => {
  Voice.onSpeechResults = (e) => {
    const text = e.value[0].toLowerCase();
    onResult(text);
  };

  Voice.start('en-US');
};

export const stopListening = () => {
  Voice.stop();
};
