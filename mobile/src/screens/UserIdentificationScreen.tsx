import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';
import { useUser } from '../contexts/UserContext';
import { config } from '../config/environment';
import { api } from '../lib/api';


const BRAND_MAROON = '#800020';
const { width } = Dimensions.get('window');

type Step = 'SELECT_USER' | 'OTP_SENT' | 'VERIFY_OTP' | 'COMPLETING' | 'FLAG_ERROR';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  email: string;
}

export default function UserIdentificationScreen() {
  const { colors } = useTheme();
  const { setUser } = useUser();
  const [step, setStep] = useState<Step>('SELECT_USER');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const members = await api.getTeamMembers();
      setTeamMembers(members);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberSelect = (member: TeamMember) => {
    setSelectedMember(member);
    setShowDropdown(false);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedMember) {
      setError('Please select your name');
      return;
    }

    if (!selectedMember.email) {
      setError("We don't have your email on file. Please contact admin.");
      return;
    }

    sendOtp();
  };

  const updateMobileAppFlag = async (memberId: string): Promise<boolean> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${config.API_URL}/api/team/${memberId}/mobile-app`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ using_mobile_app: true }),
        });
        
        if (response.ok) {
          return true;
        }
        console.warn(`PATCH attempt ${attempt} returned ${response.status}`);
      } catch (err) {
        console.warn(`PATCH attempt ${attempt} failed:`, err);
      }
      
      // Wait before retry
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  };

  const handleRetryFlagUpdate = async () => {
    if (!selectedMember) return;
    
    setStep('COMPLETING');
    setError('');
    setSuccess('Retrying setup...');
    
    const success = await updateMobileAppFlag(selectedMember.id);
    
    if (!success) {
      setStep('FLAG_ERROR');
      setError('Could not complete setup. Please check your connection and try again.');
      return;
    }
    
    // Save user to local storage with reset token
    await setUser({
      id: selectedMember.id,
      name: selectedMember.name,
      designation: selectedMember.designation,
      resetToken: resetToken,
    });
  };

  const sendOtp = async () => {
    if (!selectedMember) return;

    setIsSending(true);
    setError('');
    try {
      // Request OTP generation and email from backend
      const response = await fetch(`${config.API_URL}/api/auth/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedMember.id }),
      });
      const otpData = await response.json();
      if (!otpData.success) {
        setError(otpData.error || 'Failed to generate OTP');
        return;
      }
      const expiryTime = Date.now() + 10 * 60 * 1000;
      setOtpExpiry(expiryTime);
      setStep('OTP_SENT');
      setSuccess(`OTP sent to ${otpData.email}`);
    } catch (err) {
      console.error('OTP Error:', err);
      setError('Failed to send OTP. Please check your connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!selectedMember) return;
    setError('');

    if (otpInput.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    const now = Date.now();
    if (!otpExpiry || now > otpExpiry) {
      setError('OTP has expired. Please request a new one.');
      setOtpInput('');
      return;
    }

    try {
      // Verify OTP on server side
      const response = await fetch(`${config.API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedMember.id, otp: otpInput }),
      });
      const result = await response.json();

      if (result.valid && result.resetToken) {
        // Store the reset token locally
        setResetToken(result.resetToken);
        
        // Transition to completing state to prevent re-submissions
        setStep('COMPLETING');
        setSuccess('Verification successful! Completing setup...');
        
        // Update using_mobile_app flag on server - this must succeed before proceeding
        const flagSuccess = await updateMobileAppFlag(selectedMember.id);
        
        if (!flagSuccess) {
          setStep('FLAG_ERROR');
          setError('Could not complete setup. Please check your connection and try again.');
          return;
        }

        // Save user to local storage with reset token - this triggers App.tsx to show AuthenticationScreen
        await setUser({
          id: selectedMember.id,
          name: selectedMember.name,
          designation: selectedMember.designation,
          resetToken: result.resetToken,
        });
        
        // The component will unmount as App.tsx transitions to AuthenticationScreen
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Failed to verify OTP. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={BRAND_MAROON} />
        <View style={styles.header}>
          <Text style={styles.appName}>Dream Day Crew</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={BRAND_MAROON} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_MAROON} />
      
      <View style={styles.header}>
        <View style={styles.lockIcon}>
          <Ionicons name="person-circle" size={48} color="#fff" />
        </View>
        <Text style={styles.appName}>Dream Day Crew</Text>
        <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Event Management System v1.0.24</Text>
        <Text style={styles.subtitle}>
          {step === 'SELECT_USER' ? 'Select your name to continue' : 'Verify your identity'}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        {step === 'SELECT_USER' && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Select Your Name</Text>
            
            <TouchableOpacity
              style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={[styles.dropdownText, { color: selectedMember ? colors.text : colors.textSecondary }]}>
                {selectedMember ? selectedMember.name : 'Choose your name...'}
              </Text>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showDropdown && (
              <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {teamMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.dropdownItem,
                        selectedMember?.id === member.id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => handleMemberSelect(member)}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>{member.name}</Text>
                      <Text style={[styles.dropdownItemSubtext, { color: colors.textSecondary }]}>
                        {member.designation}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, !selectedMember && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!selectedMember || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 'OTP_SENT' && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              We've sent a 6-digit code to {selectedMember?.email}
            </Text>

            <TextInput
              style={[styles.otpInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.button, otpInput.length !== 6 && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otpInput.length !== 6}
            >
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={sendOtp}
              disabled={isSending}
            >
              <Text style={[styles.linkText, { color: BRAND_MAROON }]}>
                {isSending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setStep('SELECT_USER');
                setOtpInput('');
                setError('');
                setSuccess('');
              }}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>Back to user selection</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'COMPLETING' && (
          <View style={styles.completedContainer}>
            <ActivityIndicator size="large" color={BRAND_MAROON} />
            <Text style={[styles.completedText, { color: colors.text }]}>
              Setting up your account...
            </Text>
          </View>
        )}

        {step === 'FLAG_ERROR' && (
          <View style={styles.formContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="warning" size={48} color="#f59e0b" />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Setup Incomplete
            </Text>
            <Text style={[styles.helperText, { color: colors.textSecondary, textAlign: 'center' }]}>
              Your identity was verified but we couldn't complete the setup. Please check your internet connection and try again.
            </Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleRetryFlagUpdate}
            >
              <Text style={styles.buttonText}>Retry Setup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setStep('SELECT_USER');
                setOtpInput('');
                setError('');
                setSuccess('');
                setResetToken('');
              }}
            >
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  lockIcon: {
    marginBottom: 12,
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
  },
  contentContainer: {
    padding: 24,
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 13,
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(128, 0, 32, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    letterSpacing: 8,
  },
  button: {
    backgroundColor: BRAND_MAROON,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successText: {
    color: '#059669',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  completedText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
});
