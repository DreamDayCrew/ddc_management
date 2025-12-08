import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSecurity } from '../contexts';
import { useTheme } from '../contexts';
import InfoDialog from '../components/InfoDialog';

const BRAND_MAROON = '#800020';

interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinCode?: string;
}

export default function AppConfigurationScreen({ navigation }: any) {
  const { securitySettings, updateSecuritySettings } = useSecurity();
  const { theme, isDark, colors, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showEmergencyResetConfirm, setShowEmergencyResetConfirm] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ visible: boolean; title: string; message: string; type: 'error' | 'warning' | 'info' }>({
    visible: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showInfoDialog = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setInfoDialog({ visible: true, title, message, type });
  };

  const hideInfoDialog = () => {
    setInfoDialog({ ...infoDialog, visible: false });
  };

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };



  const handleDarkModeToggle = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      if (securitySettings.pinEnabled) {
        showInfoDialog(
          'PIN Authentication Active',
          'Please disable PIN authentication first. Only one security method can be enabled at a time.',
          'warning'
        );
        return;
      }

      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          showInfoDialog(
            'Not Supported',
            'Your device does not support biometric authentication.',
            'error'
          );
          return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          showInfoDialog(
            'No Biometrics Enrolled',
            'Please set up fingerprint or face recognition in your device settings first.',
            'warning'
          );
          return;
        }

        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        let authTypeText = 'biometric';
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          authTypeText = 'Face ID';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          authTypeText = 'fingerprint';
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Use your ${authTypeText} to enable biometric security`,
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (result.success) {
          await updateSecuritySettings({ 
            ...securitySettings, 
            biometricEnabled: true,
            pinEnabled: false,
            pinCode: undefined
          });
        } else {
          showInfoDialog('Authentication Failed', 'Biometric authentication was not successful.', 'error');
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
        showInfoDialog('Error', 'Failed to setup biometric authentication. Please try again.', 'error');
      }
    } else {
      await updateSecuritySettings({ ...securitySettings, biometricEnabled: false });
    }
  };

  const handlePinToggle = (value: boolean) => {
    if (value) {
      if (securitySettings.biometricEnabled) {
        showInfoDialog(
          'Biometric Authentication Active',
          'Please disable biometric authentication first. Only one security method can be enabled at a time.',
          'warning'
        );
        return;
      }
      setShowPinSetup(true);
    } else {
      updateSecuritySettings({ ...securitySettings, pinEnabled: false, pinCode: undefined });
    }
  };

  const handlePinSetup = async () => {
    if (pinCode.length !== 4) {
      showInfoDialog('Error', 'PIN must be 4 digits', 'error');
      return;
    }

    if (pinCode !== confirmPinCode) {
      showInfoDialog('Error', 'PIN codes do not match', 'error');
      return;
    }

    try {
      await updateSecuritySettings({ 
        ...securitySettings, 
        pinEnabled: true, 
        pinCode,
        biometricEnabled: false
      });
      setShowPinSetup(false);
      setPinCode('');
      setConfirmPinCode('');
    } catch (error) {
      showInfoDialog('Error', 'Failed to enable PIN authentication. Please try again.', 'error');
    }
  };

  const handleEmergencyReset = () => {
    console.log('handleEmergencyReset function called');
    setShowEmergencyResetConfirm(true);
  };

  const confirmEmergencyReset = async () => {
    console.log('Emergency reset confirmed');
    try {
      await updateSecuritySettings({
        pinEnabled: false,
        biometricEnabled: false,
        pinCode: undefined
      });
      setShowEmergencyResetConfirm(false);
    } catch (error) {
      console.error('Error resetting security:', error);
      showInfoDialog('Error', 'Failed to reset security. Please try again.', 'error');
    }
  };

  const cancelEmergencyReset = () => {
    setShowEmergencyResetConfirm(false);
  };

  const renderPinSetup = () => (
    <View style={[styles.pinSetupContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.pinSetupTitle, { color: colors.text }]}>Setup PIN</Text>
      <Text style={[styles.pinSetupDescription, { color: colors.textSecondary }]}>Enter a 4-digit PIN for authentication</Text>
      
      <View style={styles.pinInputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Enter PIN</Text>
        <TextInput
          style={[styles.pinInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          value={pinCode}
          onChangeText={setPinCode}
          placeholder="****"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <View style={styles.pinInputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Confirm PIN</Text>
        <TextInput
          style={[styles.pinInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
          value={confirmPinCode}
          onChangeText={setConfirmPinCode}
          placeholder="****"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
        />
      </View>

      <View style={styles.pinSetupActions}>
        <TouchableOpacity
          style={[styles.pinSetupButton, styles.pinCancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            setShowPinSetup(false);
            setPinCode('');
            setConfirmPinCode('');
          }}
        >
          <Text style={[styles.pinCancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pinSetupButton, styles.confirmButton, { backgroundColor: colors.primary }]}
          onPress={handlePinSetup}
        >
          <Text style={styles.confirmButtonText}>Setup PIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showPinSetup) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>PIN Setup</Text>
        </View>
        {renderPinSetup()}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        
        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            <View style={[styles.settingIconContainer, { backgroundColor: isDark ? colors.surface : '#fef2f2' }]}>
              <Ionicons name="moon" size={24} color={colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Switch between light and dark theme
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security Settings</Text>
        
        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            <View style={[styles.settingIconContainer, { backgroundColor: isDark ? colors.surface : '#fef2f2' }]}>
              <Ionicons name="finger-print" size={24} color={biometricAvailable ? colors.primary : colors.textSecondary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: biometricAvailable ? colors.text : colors.textSecondary }]}>
                Biometric Authentication
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {biometricAvailable 
                  ? 'Use fingerprint or face recognition to secure the app'
                  : 'Not available - Please set up biometric authentication in device settings first'
                }
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={!biometricAvailable}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingContent}>
            <View style={[styles.settingIconContainer, { backgroundColor: isDark ? colors.surface : '#fef2f2' }]}>
              <Ionicons name="keypad" size={24} color={colors.primary} />
            </View>
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>PIN Security</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Use a 4-digit PIN to secure the app
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.pinEnabled}
            onValueChange={handlePinToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: isDark ? colors.surface : '#eff6ff', borderColor: colors.border }]}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={20} color={isDark ? colors.primary : '#3b82f6'} />
          <Text style={[styles.infoTitle, { color: isDark ? colors.primary : '#1e40af' }]}>Security Information</Text>
        </View>
        <Text style={[styles.infoText, { color: isDark ? colors.textSecondary : '#1e40af' }]}>
          Customize your app experience with dark mode for comfortable viewing in low light conditions.
          Enable biometric or PIN authentication to add an extra layer of security to your app.
          You'll be asked to authenticate when opening the app or accessing sensitive features.
        </Text>
        
        {(securitySettings.pinEnabled || securitySettings.biometricEnabled) && (
          <TouchableOpacity 
            style={[styles.emergencyResetButton, { backgroundColor: isDark ? colors.surface : '#fef2f2', borderColor: isDark ? colors.error : '#fecaca' }]}
            onPress={() => {
              console.log('Emergency Reset button pressed');
              console.log('Security settings:', securitySettings);
              handleEmergencyReset();
            }}
          >
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={[styles.emergencyResetText, { color: colors.error }]}>Emergency Reset Security</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Emergency Reset Confirmation Dialog */}
      <Modal
        visible={showEmergencyResetConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelEmergencyReset}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.confirmationHeader}>
              <Ionicons name="warning" size={32} color={colors.error} />
              <Text style={[styles.confirmationTitle, { color: colors.text }]}>Emergency Security Reset</Text>
            </View>
            
            <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
              This will completely disable all security features. Use this only if you're locked out of your app.
            </Text>
            
            <Text style={[styles.confirmationWarning, { color: colors.error }]}>
              Are you sure you want to continue?
            </Text>
            
            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={cancelEmergencyReset}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmationButton, styles.resetButton, { backgroundColor: colors.error }]}
                onPress={confirmEmergencyReset}
              >
                <Text style={styles.resetButtonText}>Reset Security</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <InfoDialog
        visible={infoDialog.visible}
        title={infoDialog.title}
        message={infoDialog.message}
        type={infoDialog.type}
        onClose={hideInfoDialog}
      />

        {/*<View style={styles.section}>
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
      </View> */}
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
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginBottom: 16,
  },
  emergencyResetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyResetText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  confirmationWarning: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  pinCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  pinCancelButtonText: {
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
