// src/services/VoiceInputService.ts
import Voice from '@react-native-voice/voice';

type VoiceCommand = 
  | 'start_guidance'
  | 'stop_guidance'
  | 'end_guidance'
  | 'where_am_i'
  | 'what_do_you_see'
  | 'repeat'
  | 'help'
  | 'unknown';

interface VoiceInputCallback {
  onCommand: (command: VoiceCommand, transcript: string) => void;
  onError?: (error: string) => void;
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
}

class VoiceInputService {
  private isInitialized = false;
  private isListening = false;
  private callbacks: VoiceInputCallback | null = null;

  async initialize(callbacks: VoiceInputCallback): Promise<boolean> {
    try {
      console.log('🎤 Initializing Voice Input...');
      
      this.callbacks = callbacks;

      // Set up event listeners with proper binding
      Voice.onSpeechStart = this.handleSpeechStart.bind(this);
      Voice.onSpeechEnd = this.handleSpeechEnd.bind(this);
      Voice.onSpeechResults = this.handleSpeechResults.bind(this);
      Voice.onSpeechError = this.handleSpeechError.bind(this);

      this.isInitialized = true;
      console.log('✅ Voice Input initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Voice Input:', error);
      this.isInitialized = false;
      return false;
    }
  }

  private handleSpeechStart = () => {
    console.log('🎤 Speech started');
    this.isListening = true;
    this.callbacks?.onListeningStart?.();
  };

  private handleSpeechEnd = () => {
    console.log('🎤 Speech ended');
    this.isListening = false;
    this.callbacks?.onListeningEnd?.();
  };

  private handleSpeechResults = (e: any) => {
    const results = e.value;
    if (results && results.length > 0) {
      const transcript = results[0].toLowerCase();
      console.log('🎤 Heard:', transcript);
      
      const command = this.parseCommand(transcript);
      this.callbacks?.onCommand(command, transcript);
    }
  };

  private handleSpeechError = (e: any) => {
    console.error('❌ Voice error:', e.error);
    this.isListening = false;
    
    // Ignore "no speech" errors
    if (e.error?.code === '7') {
      console.log('⚠️ No speech detected');
      return;
    }
    
    this.callbacks?.onError?.(e.error?.message || 'Voice recognition error');
  };

  private parseCommand(transcript: string): VoiceCommand {
    const lower = transcript.toLowerCase();

    if (lower.includes('start guidance') || lower.includes('start guiding')) {
      return 'start_guidance';
    }
    if (lower.includes('stop guidance') || lower.includes('end guidance')) {
      return 'stop_guidance';
    }
    if (lower.includes('where am i') || lower.includes('what is around')) {
      return 'where_am_i';
    }
    if (lower.includes('what do you see') || lower.includes('what can you see')) {
      return 'what_do_you_see';
    }
    if (lower.includes('repeat') || lower.includes('say again')) {
      return 'repeat';
    }
    if (lower.includes('help') || lower.includes('commands')) {
      return 'help';
    }

    return 'unknown';
  }

  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      console.error('❌ Not initialized');
      return;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    try {
      console.log('🎤 Starting...');
      await Voice.start('en-US');
    } catch (error: any) {
      console.error('❌ Start failed:', error);
      this.isListening = false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.stop();
      this.isListening = false;
      console.log('🎤 Stopped');
    } catch (error) {
      console.error('❌ Stop failed:', error);
      this.isListening = false;
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.isListening) {
        await Voice.stop().catch(() => {});
      }
      
      Voice.destroy().catch(() => {});
      Voice.removeAllListeners();
      
      this.isListening = false;
      this.isInitialized = false;
      this.callbacks = null;
      
      console.log('✅ Destroyed');
    } catch (error) {
      this.isListening = false;
      this.isInitialized = false;
      this.callbacks = null;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export default new VoiceInputService();