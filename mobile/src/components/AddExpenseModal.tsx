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

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

const BRAND_MAROON = '#800020';

export default function AddExpenseModal({ visible, onClose }: AddExpenseModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'Debit',
    category: 'Event',
    from_account: '',
    to_account: '',
    description: '',
    amount: '',
    date: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await api.createExpense({
        ...data,
        amount: data.amount ? parseFloat(data.amount) : 0,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'Debit',
      category: 'Event',
      from_account: '',
      to_account: '',
      description: '',
      amount: '',
      date: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      alert('Please fill in description and amount');
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
            <Text style={styles.modalTitle}>Add New Expense</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'Debit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'Debit' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'Debit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Debit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'Credit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'Credit' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'Credit' && styles.typeButtonTextActive,
                    ]}
                  >
                    Credit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'Transfer' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'Transfer' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'Transfer' && styles.typeButtonTextActive,
                    ]}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="Event, Asset, General, etc."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter expense description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>From Account</Text>
              <TextInput
                style={styles.input}
                value={formData.from_account}
                onChangeText={(text) => setFormData({ ...formData, from_account: text })}
                placeholder="e.g., DDC Fund, Cash"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To Account</Text>
              <TextInput
                style={styles.input}
                value={formData.to_account}
                onChangeText={(text) => setFormData({ ...formData, to_account: text })}
                placeholder="Destination account"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="2025-12-31"
                placeholderTextColor="#999"
              />
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
                  <Text style={styles.submitButtonText}>Create Expense</Text>
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
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: BRAND_MAROON,
    borderColor: BRAND_MAROON,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
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
