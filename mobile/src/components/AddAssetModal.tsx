import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
}

const BRAND_MAROON = '#800020';

export default function AddAssetModal({ visible, onClose }: AddAssetModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '1',
    purchaseDate: '',
    purchasedAmount: '',
    status: 'Available',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await api.createAsset({
        ...data,
        quantity: parseInt(data.quantity) || 1,
        purchasedAmount: data.purchasedAmount ? parseFloat(data.purchasedAmount) : null,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '1',
      purchaseDate: '',
      purchasedAmount: '',
      status: 'Available',
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      alert('Please enter asset name');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Asset</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter asset name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="e.g., Audio System, Lighting, Decor"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.purchaseDate}
                onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })}
                placeholder="2025-12-31"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchased Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.purchasedAmount}
                onChangeText={(text) => setFormData({ ...formData, purchasedAmount: text })}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusSelector}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'Available' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, status: 'Available' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.status === 'Available' && styles.statusButtonTextActive,
                    ]}
                  >
                    Available
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    formData.status === 'In Use' && styles.statusButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, status: 'In Use' })}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.status === 'In Use' && styles.statusButtonTextActive,
                    ]}
                  >
                    In Use
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Create Asset</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: BRAND_MAROON,
    borderColor: BRAND_MAROON,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
