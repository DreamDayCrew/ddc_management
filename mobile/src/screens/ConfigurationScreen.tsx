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
import styles from './ConfigurationScreen.styles';

const BRAND_MAROON = '#800020';

export default function ConfigurationScreen() {
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Information</Text>
        
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Business Name</Text>
            <Text style={styles.required}>*</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              errors.businessName ? styles.inputError : undefined
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
            placeholderTextColor="#9ca3af"
            data-testid="input-business-name"
          />
          {errors.businessName && (
            <Text style={styles.errorText}>{errors.businessName}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="business@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            data-testid="input-email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 1234567890"
            keyboardType="phone-pad"
            data-testid="input-phone"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GST Number</Text>
          <TextInput
            style={styles.input}
            value={gstNumber}
            onChangeText={setGstNumber}
            placeholder="Enter GST number"
            autoCapitalize="characters"
            data-testid="input-gst"
          />
        </View>

        <View style={[styles.inputGroup, styles.switchContainer]}>
          <Text style={styles.label}>Include GST in Invoices</Text>
          <Switch
            value={includeGst}
            onValueChange={setIncludeGst}
            trackColor={{ false: '#d1d5db', true: BRAND_MAROON }}
            thumbColor="#ffffff"
            style={styles.switchStyle} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            data-testid="input-website"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter business address"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            data-testid="input-address"
          />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          Categories and other advanced settings can be managed from the{' '}
          <Text 
            style={{color: '#3b82f6', textDecorationLine: 'underline'}}
            onPress={() => Linking.openURL('https://ddc-management.onrender.com/')}
            accessibilityLabel="Open web application"
            accessibilityRole="link"
          >
            Dream Day Crew Web Application
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, updateMutation.isPending && styles.saveButtonDisabled]}
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
            <Text style={styles.saveButtonText}>Saving...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
