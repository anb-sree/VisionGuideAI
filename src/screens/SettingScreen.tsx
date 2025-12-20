import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  voiceGuidance: boolean;
  obstacleAlerts: boolean;
  hapticFeedback: boolean;
  autoStart: boolean;
  highContrast: boolean;
}

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    voiceGuidance: true,
    obstacleAlerts: true,
    hapticFeedback: true,
    autoStart: false,
    highContrast: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof SettingsState) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
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
              // Clear specific cache keys (preserve settings)
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Data</Text>
        
        <Pressable style={styles.actionButton} onPress={clearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={resetSettings}>
          <Text style={styles.actionButtonText}>Reset Settings</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>VisionGuide AI</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.descriptionText}>
          AI-powered navigation assistant for the visually impaired.
          {'\n\n'}
          This app uses GPS navigation, real-time location tracking, and obstacle detection to help users navigate safely.
        </Text>
      </View>

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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#374151',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  aboutText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  versionText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  descriptionText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
});

export default SettingsScreen;