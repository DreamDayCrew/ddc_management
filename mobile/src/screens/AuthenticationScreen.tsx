import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurity, useTheme } from '../contexts';
import * as LocalAuthentication from 'expo-local-authentication';

const BRAND_MAROON = '#800020';
const { width, height } = Dimensions.get('window');

export default function AuthenticationScreen() {
  const { colors, isDark } = useTheme();
  const { securitySettings, setAuthenticated, authenticate, updateSecuritySettings } = useSecurity();
  const [enteredPin, setEnteredPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 300; // 5 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimeRemaining]);

  useEffect(() => {
    // Try biometric authentication if enabled
    if (securitySettings.biometricEnabled) {
      handleBiometricAuth();
    }
  }, [securitySettings.biometricEnabled]);

  const handleBiometricAuth = async () => {
    const success = await authenticate();
    if (success) {
      setAuthenticated(true);
    }
  };

  const handlePinPress = (digit: string) => {
    if (isLocked) return;

    if (digit === 'delete') {
      setEnteredPin((prev) => prev.slice(0, -1));
      return;
    }

    if (enteredPin.length < 4) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);

      if (newPin.length === 4) {
        setTimeout(() => validatePin(newPin), 100);
      }
    }
  };

  const validatePin = (pin: string) => {
    if (pin === securitySettings.pinCode) {
      setAuthenticated(true);
      setAttempts(0);
    } else {
      Vibration.vibrate(500);
      setEnteredPin('');
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimeRemaining(LOCK_DURATION);
        Alert.alert(
          'Too Many Attempts',
          `App is locked for ${LOCK_DURATION / 60} minutes due to too many failed attempts.`
        );
      } else {
        Alert.alert(
          'Incorrect PIN',
          `${MAX_ATTEMPTS - newAttempts} attempts remaining before app is locked.`
        );
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleForgotPin = () => {
    console.log('Forgot PIN button pressed'); // Debug log
    setShowForgotPinModal(true);
  };

  const handleBiometricReset = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometric Not Available',
          'Biometric authentication is not set up on this device. You can disable security instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Disable Security', onPress: handleDisableSecurity, style: 'destructive' }
          ]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use biometric authentication to reset your PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Allow user to set new PIN
        setShowForgotPin(true);
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication was not successful.');
      }
    } catch (error) {
      console.error('Biometric reset error:', error);
      Alert.alert('Error', 'Failed to authenticate with biometrics.');
    }
  };

  const handleDisableSecurity = async () => {
    try {
      await updateSecuritySettings({
        ...securitySettings,
        pinEnabled: false,
        biometricEnabled: false,
        pinCode: ''
      });
      setAuthenticated(true);
      Alert.alert('Security Disabled', 'App security has been disabled.');
    } catch (error) {
      Alert.alert('Error', 'Failed to disable security. Please try again.');
    }
  };

  const renderForgotPinSetup = () => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const handleNewPinPress = (digit: string) => {
      if (digit === 'delete') {
        setNewPin((prev) => prev.slice(0, -1));
        return;
      }
      if (newPin.length < 4) {
        setNewPin(newPin + digit);
      }
    };

    const handleConfirmPinPress = (digit: string) => {
      if (digit === 'delete') {
        setConfirmPin((prev) => prev.slice(0, -1));
        return;
      }
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 4) {
          if (newPin === newConfirmPin) {
            handlePinReset(newPin);
          } else {
            Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
            setConfirmPin('');
          }
        }
      }
    };

    const handlePinReset = async (pin: string) => {
      try {
        await updateSecuritySettings({
          ...securitySettings,
          pinCode: pin,
          pinEnabled: true
        });
        setShowForgotPin(false);
        setAuthenticated(true);
        Alert.alert('PIN Updated', 'Your PIN has been successfully updated!');
      } catch (error) {
        Alert.alert('Error', 'Failed to update PIN. Please try again.');
      }
    };

    return (
      <View style={styles.forgotPinContainer}>
        <Text style={styles.forgotPinTitle}>Set New PIN</Text>
        
        <View style={styles.pinSetupSection}>
          <Text style={styles.pinSetupLabel}>Enter New PIN</Text>
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  { backgroundColor: index < newPin.length ? BRAND_MAROON : '#e5e7eb' }
                ]}
              />
            ))}
          </View>
        </View>

        {newPin.length === 4 && (
          <View style={styles.pinSetupSection}>
            <Text style={styles.pinSetupLabel}>Confirm New PIN</Text>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    { backgroundColor: index < confirmPin.length ? BRAND_MAROON : '#e5e7eb' }
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.pinPad}>
          <View style={styles.pinRow}>
            {['1', '2', '3'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => newPin.length < 4 ? handleNewPinPress(digit) : handleConfirmPinPress(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            {['4', '5', '6'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => newPin.length < 4 ? handleNewPinPress(digit) : handleConfirmPinPress(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            {['7', '8', '9'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => newPin.length < 4 ? handleNewPinPress(digit) : handleConfirmPinPress(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            <TouchableOpacity style={styles.pinButton} onPress={() => setShowForgotPin(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinButton}
              onPress={() => newPin.length < 4 ? handleNewPinPress('0') : handleConfirmPinPress('0')}
            >
              <Text style={styles.pinButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinButton}
              onPress={() => newPin.length < 4 ? handleNewPinPress('delete') : handleConfirmPinPress('delete')}
            >
              <Ionicons name="backspace-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderPinDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.pinDot,
        { backgroundColor: index < enteredPin.length ? BRAND_MAROON : '#e5e7eb' },
      ]}
    />
  );

  const renderPinButton = (digit: string, label?: string) => (
    <TouchableOpacity
      key={digit}
      style={[
        styles.pinButton,
        isLocked && styles.pinButtonDisabled,
      ]}
      onPress={() => handlePinPress(digit)}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      {digit === 'delete' ? (
        <Ionicons name="backspace-outline" size={24} color={isLocked ? '#9ca3af' : '#374151'} />
      ) : (
        <Text style={[styles.pinButtonText, isLocked && styles.pinButtonTextDisabled]}>
          {label || digit}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (showForgotPin) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_MAROON} />
        <View style={styles.header}>
          <Text style={styles.appName}>Dream Day Crew</Text>
          <Text style={styles.subtitle}>Set up your new PIN</Text>
        </View>
        <View style={styles.content}>
          {renderForgotPinSetup()}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_MAROON} />
      
      <View style={styles.header}>
        <Text style={styles.appName}>Dream Day Crew</Text>
        <Text style={styles.subtitle}>Enter your PIN to continue</Text>
      </View>

      <View style={styles.content}>
        {isLocked ? (
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={48} color="#ef4444" />
            <Text style={styles.lockTitle}>App Locked</Text>
            <Text style={styles.lockText}>
              Too many failed attempts. Try again in:
            </Text>
            <Text style={styles.lockTime}>{formatTime(lockTimeRemaining)}</Text>
          </View>
        ) : (
          <>
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map(renderPinDot)}
            </View>

            <View style={styles.pinPad}>
              <View style={styles.pinRow}>
                {renderPinButton('1')}
                {renderPinButton('2')}
                {renderPinButton('3')}
              </View>
              <View style={styles.pinRow}>
                {renderPinButton('4')}
                {renderPinButton('5')}
                {renderPinButton('6')}
              </View>
              <View style={styles.pinRow}>
                {renderPinButton('7')}
                {renderPinButton('8')}
                {renderPinButton('9')}
              </View>
              <View style={styles.pinRow}>
                {securitySettings.biometricEnabled && (
                  <TouchableOpacity
                    style={styles.pinButton}
                    onPress={handleBiometricAuth}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="finger-print" size={24} color="#374151" />
                  </TouchableOpacity>
                )}
                {renderPinButton('0')}
                {renderPinButton('delete')}
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleForgotPin} 
          style={[styles.forgotPinButton, { backgroundColor: '#f0f0f0', borderRadius: 8 }]}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotPinText}>Forgot PIN?</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          Need help? Contact support for assistance.
        </Text>
      </View>
      
      {/* Custom Forgot PIN Modal */}
      <Modal
        visible={showForgotPinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowForgotPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Forgot PIN</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>What would you like to do?</Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                setShowForgotPinModal(false);
                handleBiometricReset();
              }}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Use Biometric</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowForgotPinModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#f3f4f6',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  lockContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  lockText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  lockTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 60,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  pinPad: {
    alignItems: 'center',
  },
  pinRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pinButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  pinButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  pinButtonTextDisabled: {
    color: '#9ca3af',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  forgotPinButton: {
    padding: 12,
    marginBottom: 16,
  },
  forgotPinText: {
    fontSize: 16,
    color: BRAND_MAROON,
    textAlign: 'center',
    fontWeight: '600',
  },
  forgotPinContainer: {
    alignItems: 'center',
    width: '100%',
  },
  forgotPinTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 32,
    textAlign: 'center',
  },
  pinSetupSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinSetupLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});