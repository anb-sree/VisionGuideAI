// src/services/VoiceCommandService.ts

import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from './VoiceService';

type CommandCallback = () => void;

interface CommandMap {
  [key: string]: {
    callback: CommandCallback;
    keywords: string[];
    confirmationMessage?: string;
  };
}

class VoiceCommandService {
  private isListening: boolean = false;
  private isInitialized: boolean = false;
  private commands: CommandMap = {};
  private currentLanguage: string = 'en-US';
  private isEnabled: boolean = true;

  async initialize(): Promise<boolean> {
    try {
      console.log('🎤 Initializing Voice Command Service...');

      // Check if voice commands are enabled
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isEnabled = parsed.voiceCommands !== false;
      }

      if (!this.isEnabled) {
        console.log('⚠️ Voice commands disabled in settings');
        return false;
      }

      // Set up event listeners
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechError = this.onSpeechError;

      this.isInitialized = true;
      console.log('✅ Voice Command Service initialized');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Voice Commands:', error);
      this.isInitialized = false;
      return false;
    }
  }

  registerCommand(
    name: string,
    keywords: string[],
    callback: CommandCallback,
    confirmationMessage?: string
  ): void {
    this.commands[name] = {
      callback,
      keywords: keywords.map(k => k.toLowerCase()),
      confirmationMessage,
    };
    console.log(`✅ Registered command: ${name} with keywords:`, keywords);
  }

  unregisterCommand(name: string): void {
    delete this.commands[name];
  }

  async startListening(): Promise<void> {
    if (!this.isInitialized || !this.isEnabled) {
      console.log('⚠️ Voice commands not initialized or disabled');
      return;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    try {
      await Voice.start(this.currentLanguage);
      this.isListening = true;
      console.log('🎤 Started listening for voice commands...');
    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await Voice.stop();
      this.isListening = false;
      console.log('🎤 Stopped listening');
    } catch (error) {
      console.error('❌ Error stopping voice recognition:', error);
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    this.currentLanguage = languageCode;
    console.log('🌐 Voice command language set to:', languageCode);
  }

  private onSpeechStart = () => {
    console.log('🎤 Speech started');
  };

  private onSpeechEnd = () => {
    console.log('🎤 Speech ended');
    this.isListening = false;
  };

  private onSpeechResults = (event: SpeechResultsEvent) => {
    if (!event.value || event.value.length === 0) {
      return;
    }

    const spokenText = event.value[0].toLowerCase();
    console.log('🎤 Recognized:', spokenText);

    this.processCommand(spokenText);
  };

  private onSpeechError = (event: SpeechErrorEvent) => {
    console.error('🎤 Speech recognition error:', event.error);
    this.isListening = false;
  };

  private processCommand(spokenText: string): void {
    // Check each registered command
    for (const [commandName, commandData] of Object.entries(this.commands)) {
      // Check if any keyword matches
      const matched = commandData.keywords.some(keyword => 
        spokenText.includes(keyword)
      );

      if (matched) {
        console.log(`✅ Command matched: ${commandName}`);
        
        // Provide voice feedback
        if (commandData.confirmationMessage) {
          VoiceService.speak(commandData.confirmationMessage, true);
        }

        // Execute the command
        setTimeout(() => {
          commandData.callback();
        }, 500);

        return;
      }
    }

    console.log('⚠️ No command matched');
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isReady(): boolean {
    return this.isInitialized && this.isEnabled;
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    if (!enabled && this.isListening) {
      await this.stopListening();
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.stopListening();
      Voice.destroy();
      this.commands = {};
      this.isInitialized = false;
      console.log('🧹 Voice Command Service disposed');
    } catch (error) {
      console.error('❌ Error disposing Voice Command Service:', error);
    }
  }
}

export default new VoiceCommandService();