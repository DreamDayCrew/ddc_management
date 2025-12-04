import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Vendor } from '../types';
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';

type Props = {
  visible: boolean;
  vendor: Vendor | null;
  onClose: () => void;
};

export default function AddVendorModal({ visible, vendor, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [rating, setRating] = useState('');

  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  const vendorCategories = config?.vendorCategories || [];

  useEffect(() => {
    if (vendor) {
      setName(vendor.name || '');
      setCategory(vendor.category || '');
      setSpecialization(vendor.specialization || '');
      setLocation(vendor.location || '');
      setContactInfo(vendor.contactInfo || '');
      setRating(vendor.rating?.toString() || '');
    } else {
      resetForm();
    }
  }, [vendor]);

  const resetForm = () => {
    setName('');
    setCategory('');
    setSpecialization('');
    setLocation('');
    setContactInfo('');
    setRating('');
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
      resetForm();
      Alert.alert('Success', 'Vendor added successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to add vendor: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
      resetForm();
      Alert.alert('Success', 'Vendor updated successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to update vendor: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onClose();
      resetForm();
      Alert.alert('Success', 'Vendor deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete vendor: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter vendor name');
      return;
    }

    const vendorData = {
      name: name.trim(),
      category: category.trim() || null,
      specialization: specialization.trim() || null,
      location: location.trim() || null,
      contactInfo: contactInfo.trim() || null,
      rating: rating ? parseInt(rating) : 0,
    };

    if (vendor) {
      updateMutation.mutate({ id: vendor.id, data: vendorData });
    } else {
      createMutation.mutate(vendorData);
    }
  };

  const handleDelete = () => {
    if (!vendor) return;

    Alert.alert(
      'Delete Vendor',
      'Are you sure you want to delete this vendor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(vendor.id),
        },
      ]
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {vendor ? 'Edit Vendor' : 'Add Vendor'}
            </Text>
            <TouchableOpacity onPress={onClose} data-testid="button-close-modal">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Vendor Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter vendor name"
                placeholderTextColor={colors.textSecondary}
                data-testid="input-vendor-name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              {Platform.OS === 'web' ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    marginBottom: 16,
                  }}
                  data-testid="select-vendor-category"
                >
                  <option value="">Select a category</option>
                  {vendorCategories.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={[styles.picker, { color: colors.text }]}
                    dropdownIconColor={colors.textSecondary}
                    data-testid="picker-vendor-category"
                  >
                    <Picker.Item label="Select a category" value="" color={colors.textSecondary} />
                    {vendorCategories.map((cat: string) => (
                      <Picker.Item key={cat} label={cat} value={cat} color={colors.text} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Specialization</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={specialization}
                onChangeText={setSpecialization}
                placeholder="Enter specialization"
                placeholderTextColor={colors.textSecondary}
                data-testid="input-vendor-specialization"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
                placeholderTextColor={colors.textSecondary}
                data-testid="input-vendor-location"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Contact Info</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={contactInfo}
                onChangeText={setContactInfo}
                placeholder="Phone, email, etc."
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                data-testid="input-vendor-contact"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Rating (0-5)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={rating}
                onChangeText={setRating}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                data-testid="input-vendor-rating"
              />
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={onClose}
                disabled={isPending}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
                onPress={handleSubmit}
                disabled={isPending}
                data-testid="button-save-vendor"
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {vendor ? 'Update Vendor' : 'Add Vendor'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
