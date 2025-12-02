import { useState, useEffect } from 'react';
import { Configuration } from '../types';
import {
  View,
  Text,
  Linking,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';
import styles from './ConfigurationScreen.styles';

const BRAND_MAROON = '#800020';

export default function ConfigurationScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [includeGst, setIncludeGst] = useState(false);
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: config, isLoading, refetch } = useQuery<Configuration | null>({
    queryKey: ['configuration'],
    queryFn: async () => {
      try {
        const data = await api.getConfiguration();
        console.log('Configuration loaded:', data);
        if (!data?.id) {
          console.warn('No configuration found, will create a new one on save');
        }
        return data;
      } catch (error) {
        console.error('Error loading configuration:', error);
        return null;
      }
    }
  });

  useEffect(() => {
    if (config) {
      console.log('Loading config:', config);
      setBusinessName(config.businessName || '');
      setEmail(config.email || '');
      setPhone(config.phone || '');
      setGstNumber(config.gstNumber || '');
      // Ensure includeGst is properly converted to boolean
      const includeGstValue = config.includeGst === 'true' || config.includeGst === "true" || "false";
      console.log('Setting includeGst:', includeGstValue, 'from:', config.includeGst);
      setIncludeGst(Boolean(includeGstValue));
      setWebsite(config.website || '');
      setAddress(config.address || '');
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Configuration> & { id?: string }) => {
      if (data.id) {
        // Update existing configuration
        const { id, ...updateData } = data;
        return api.updateConfiguration({ id, ...updateData });
      } else {
        // Create new configuration
        const { id, ...createData } = data;
        return api.createConfiguration(createData as Omit<Configuration, 'id'>);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch the configuration query
      queryClient.setQueryData(['configuration'], data);
      Alert.alert('Success', 'Configuration saved successfully');
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save configuration');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    
    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    const configData = {
      id: config?.id, // Will be undefined for new configs
      businessName: businessName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      gstNumber: gstNumber.trim() || null,
      includeGst: includeGst ? 'true' : 'false', // Convert to string 'true'/'false'
      website: website.trim() || null,
      address: address.trim() || null,
    };

    console.log('Saving configuration:', configData);
    
    try {
      await updateMutation.mutateAsync(configData);
    } catch (error) {
      console.error('Error saving configuration:', error);
      // Error is already handled by the mutation's onError
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#4a5568' : BRAND_MAROON} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Information</Text>
        
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
            <Text style={[styles.required, { color: colors.error }]}>*</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
              errors.businessName ? [styles.inputError, { borderColor: colors.error }] : undefined
            ].filter(Boolean) as any}
            value={businessName}
            onChangeText={(text) => {
              setBusinessName(text);
              // Clear error when user starts typing
              if (errors.businessName) {
                setErrors(prev => ({
                  ...prev,
                  businessName: ''
                }));
              }
            }}
            placeholder="Enter business name"
            placeholderTextColor={colors.textSecondary}
            data-testid="input-business-name"
          />
          {errors.businessName && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.businessName}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="business@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            data-testid="input-email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 1234567890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            data-testid="input-phone"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>GST Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={gstNumber}
            onChangeText={setGstNumber}
            placeholder="Enter GST number"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            data-testid="input-gst"
          />
        </View>

        <View style={[styles.inputGroup, styles.switchContainer]}>
          <Text style={[styles.label, { color: colors.text }]}>Include GST in Invoices</Text>
          <Switch
            value={includeGst}
            onValueChange={setIncludeGst}
            trackColor={{ false: colors.border, true: isDark ? '#4a5568' : BRAND_MAROON }}
            thumbColor="#ffffff"
            style={styles.switchStyle} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            data-testid="input-website"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Business Address</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter business address"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            data-testid="input-address"
          />
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="information-circle" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Categories and other advanced settings can be managed from the{' '}
          <Text 
            style={{color: isDark ? '#60a5fa' : '#3b82f6', textDecorationLine: 'underline'}}
            onPress={() => Linking.openURL('https://ddc-management.onrender.com/')}
            accessibilityLabel="Open web application"
            accessibilityRole="link"
          >
            Dream Day Crew Web Application
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }, updateMutation.isPending && styles.saveButtonDisabled]}
        onPress={() => {
          console.log('Save button pressed');
          handleSave();
        }}
        disabled={updateMutation.isPending}
        data-testid="button-save-config"
        activeOpacity={0.7}
      >
        {updateMutation.isPending ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>Saving...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>Save Changes</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
