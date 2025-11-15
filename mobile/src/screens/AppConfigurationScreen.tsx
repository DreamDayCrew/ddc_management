import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BRAND_MAROON = '#800020';

interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinCode?: string;
}

interface AppSettings {
  darkModeEnabled: boolean;
}

export default function AppConfigurationScreen({ navigation }: any) {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    pinEnabled: false,
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    darkModeEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      // In a real app, you'd load this from secure storage
      // For now, we'll use default values
      setSecuritySettings({
        biometricEnabled: false,
        pinEnabled: false,
      });
      setAppSettings({
        darkModeEnabled: false,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleDarkModeToggle = (value: boolean) => {
    setAppSettings(prev => ({ ...prev, darkModeEnabled: value }));
    Alert.alert('Success', `Dark mode ${value ? 'enabled' : 'disabled'}`);
    // In a real app, you would apply the theme change here
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Mock biometric authentication - in real app, use expo-local-authentication
      Alert.alert(
        'Biometric Authentication',
        'Biometric authentication is not available in this build. This feature requires expo-local-authentication package.',
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'Enable Anyway', 
            onPress: () => {
              setSecuritySettings(prev => ({ ...prev, biometricEnabled: true }));
              Alert.alert('Success', 'Biometric authentication enabled (mock)');
            }
          }
        ]
      );
    } else {
      setSecuritySettings(prev => ({ ...prev, biometricEnabled: false }));
      Alert.alert('Success', 'Biometric authentication disabled');
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      setShowPinSetup(true);
    } else {
      setSecuritySettings(prev => ({ ...prev, pinEnabled: false, pinCode: undefined }));
      Alert.alert('Success', 'PIN authentication disabled');
    }
  };

  const handlePinSetup = () => {
    if (pinCode.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    if (pinCode !== confirmPinCode) {
      Alert.alert('Error', 'PIN codes do not match');
      return;
    }

    setSecuritySettings(prev => ({ ...prev, pinEnabled: true, pinCode }));
    setShowPinSetup(false);
    setPinCode('');
    setConfirmPinCode('');
    Alert.alert('Success', 'PIN authentication enabled');
  };

  const renderPinSetup = () => (
    <View style={styles.pinSetupContainer}>
      <Text style={styles.pinSetupTitle}>Setup PIN</Text>
      <Text style={styles.pinSetupDescription}>Enter a 4-digit PIN for authentication</Text>
      
      <View style={styles.pinInputContainer}>
        <Text style={styles.label}>Enter PIN</Text>
        <TextInput
          style={styles.pinInput}
          value={pinCode}
          onChangeText={setPinCode}
          placeholder="****"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <View style={styles.pinInputContainer}>
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.pinInput}
          value={confirmPinCode}
          onChangeText={setConfirmPinCode}
          placeholder="****"
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <View style={styles.pinSetupActions}>
        <TouchableOpacity
          style={[styles.pinSetupButton, styles.cancelButton]}
          onPress={() => {
            setShowPinSetup(false);
            setPinCode('');
            setConfirmPinCode('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pinSetupButton, styles.confirmButton]}
          onPress={handlePinSetup}
        >
          <Text style={styles.confirmButtonText}>Setup PIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showPinSetup) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PIN Setup</Text>
        </View>
        {renderPinSetup()}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="moon" size={24} color={BRAND_MAROON} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Switch between light and dark theme
              </Text>
            </View>
          </View>
          <Switch
            value={appSettings.darkModeEnabled}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#d1d5db', true: BRAND_MAROON }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="finger-print" size={24} color={BRAND_MAROON} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition to secure the app
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: '#d1d5db', true: BRAND_MAROON }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="keypad" size={24} color={BRAND_MAROON} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>PIN Security</Text>
              <Text style={styles.settingDescription}>
                Use a 4-digit PIN to secure the app
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.pinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: '#d1d5db', true: BRAND_MAROON }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Customize your app experience with dark mode for comfortable viewing in low light conditions.
          Enable biometric or PIN authentication to add an extra layer of security to your app.
          You'll be asked to authenticate when opening the app or accessing sensitive features.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings Status</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={appSettings.darkModeEnabled ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={appSettings.darkModeEnabled ? "#10b981" : "#ef4444"} 
            />
            <Text style={styles.statusText}>Dark Mode: {appSettings.darkModeEnabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={securitySettings.biometricEnabled ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={securitySettings.biometricEnabled ? "#10b981" : "#ef4444"} 
            />
            <Text style={styles.statusText}>Biometric: {securitySettings.biometricEnabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons 
              name={securitySettings.pinEnabled ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={securitySettings.pinEnabled ? "#10b981" : "#ef4444"} 
            />
            <Text style={styles.statusText}>PIN: {securitySettings.pinEnabled ? 'Enabled' : 'Disabled'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  pinSetupContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinSetupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  pinSetupDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  pinInputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  pinSetupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pinSetupButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: BRAND_MAROON,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
