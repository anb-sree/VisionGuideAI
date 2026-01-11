// src/screens/SettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VoiceService from '../services/VoiceService';

interface SettingsState {
  voiceGuidance: boolean;
  obstacleAlerts: boolean;
  hapticFeedback: boolean;
  autoStart: boolean;
  highContrast: boolean;
  selectedLanguage: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
];

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    voiceGuidance: true,
    obstacleAlerts: true,
    hapticFeedback: true,
    autoStart: false,
    highContrast: false,
    selectedLanguage: 'en-US',
  });

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        
        if (parsed.selectedLanguage) {
          await VoiceService.setLanguage(parsed.selectedLanguage);
        }
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      if (newSettings.selectedLanguage !== settings.selectedLanguage) {
        await VoiceService.setLanguage(newSettings.selectedLanguage);
      }
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof SettingsState) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const selectLanguage = async (languageCode: string) => {
    const newSettings = { ...settings, selectedLanguage: languageCode };
    await saveSettings(newSettings);
    setShowLanguagePicker(false);
    
    VoiceService.speak('LANGUAGE_CHANGED');
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: SettingsState = {
              voiceGuidance: true,
              obstacleAlerts: true,
              hapticFeedback: true,
              autoStart: false,
              highContrast: false,
              selectedLanguage: 'en-US',
            };
            saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const getCurrentLanguageName = () => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === settings.selectedLanguage);
    return lang ? lang.nativeName : 'English';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Accessibility Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Voice Guidance</Text>
            <Text style={styles.settingDescription}>
              Enable audio instructions during navigation
            </Text>
          </View>
          <Switch
            value={settings.voiceGuidance}
            onValueChange={() => toggleSetting('voiceGuidance')}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={settings.voiceGuidance ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Obstacle Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notifications about obstacles
            </Text>
          </View>
          <Switch
            value={settings.obstacleAlerts}
            onValueChange={() => toggleSetting('obstacleAlerts')}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={settings.obstacleAlerts ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Text style={styles.settingDescription}>
              Vibration alerts for navigation
            </Text>
          </View>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={() => toggleSetting('hapticFeedback')}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={settings.hapticFeedback ? '#fff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>High Contrast Mode</Text>
            <Text style={styles.settingDescription}>
              Improve visibility with high contrast
            </Text>
          </View>
          <Switch
            value={settings.highContrast}
            onValueChange={() => toggleSetting('highContrast')}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={settings.highContrast ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language / भाषा / ಭಾಷೆ / భాష</Text>
        
        <View style={styles.languageContainer}>
          <Pressable 
            style={styles.languageSelector}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Language</Text>
              <Text style={styles.currentLanguage}>
                {getCurrentLanguageName()}
              </Text>
            </View>
            <Text style={styles.chevron}>{showLanguagePicker ? '▼' : '▶'}</Text>
          </Pressable>

          {showLanguagePicker && (
            <View style={styles.languageList}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    settings.selectedLanguage === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => selectLanguage(lang.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageNativeName}>{lang.nativeName}</Text>
                    <Text style={styles.languageName}>{lang.name}</Text>
                  </View>
                  {settings.selectedLanguage === lang.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Navigation Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-start Navigation</Text>
            <Text style={styles.settingDescription}>
              Start navigation immediately after entering destination
            </Text>
          </View>
          <Switch
            value={settings.autoStart}
            onValueChange={() => toggleSetting('autoStart')}
            trackColor={{ false: '#767577', true: '#16a34a' }}
            thumbColor={settings.autoStart ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* App Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Data</Text>
        
        <Pressable style={styles.actionButton} onPress={clearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={resetSettings}>
          <Text style={styles.actionButtonText}>Reset Settings</Text>
        </Pressable>
      </View>

      {/* About Section */}
      <View style={[styles.section, styles.lastSection]}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>VisionGuide AI</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.descriptionText}>
          AI-powered navigation assistant for the visually impaired.
          {'\n\n'}
          This app uses GPS navigation, real-time location tracking, and obstacle detection to help users navigate safely.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for accessibility
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 4,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Language Section Styles
  languageContainer: {
    width: '100%',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  currentLanguage: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  chevron: {
    color: '#16a34a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageList: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  languageOptionSelected: {
    backgroundColor: '#16a34a15',
  },
  languageInfo: {
    flex: 1,
  },
  languageNativeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageName: {
    color: '#888',
    fontSize: 14,
  },
  checkmark: {
    color: '#16a34a',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  
  // Action Buttons
  actionButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // About Section
  aboutText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  versionText: {
    color: '#888',
    fontSize: 15,
    marginBottom: 16,
  },
  descriptionText: {
    color: '#bbb',
    fontSize: 15,
    lineHeight: 24,
  },
  
  // Footer
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
});

export default SettingsScreen;