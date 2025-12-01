import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Switch } from './Switch';

interface AddRequirementModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  requirement?: any;
}

const BRAND_MAROON = '#800020';

export default function AddRequirementModal({ visible, onClose, eventId, requirement }: AddRequirementModalProps) {
  const queryClient = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  // Fetch team members for owner dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamMembers(),
  });

  const [formData, setFormData] = useState({
    requirement: '',
    description: '',
    requirementOwner: '',
    requirementStatus: 'To Do',
    price: '',
    quantity: '1',
    req_discount: false,
    req_discount_amount: '',
  });

  useEffect(() => {
    if (requirement && visible) {
      setFormData({
        requirement: requirement.requirement || '',
        description: requirement.description || '',
        requirementOwner: requirement.requirementOwner || '',
        requirementStatus: requirement.requirementStatus || 'To Do',
        price: String(requirement.price || 0),
        quantity: String(requirement.quantity || 1),
        req_discount: requirement.req_discount === 'true' || requirement.req_discount === true,
        req_discount_amount: String(requirement.req_discount_amount || 0),
      });
    } else if (!visible) {
      resetForm();
    }
  }, [requirement, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        if (requirement) {
          return await api.updateRequirement(eventId, requirement.id, data);
        }
        return await api.createRequirement(eventId, data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      // Handle error silently or show user-friendly message
    },
  });



  const resetForm = () => {
    setFormData({
      requirement: '',
      description: '',
      requirementOwner: '',
      requirementStatus: 'To Do',
      price: '',
      quantity: '1',
      req_discount: false,
      req_discount_amount: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.requirement.trim()) {
      Alert.alert('Error', 'Please enter requirement name');
      return;
    }

    const price = parseInt(formData.price) || 0;
    const quantity = parseInt(formData.quantity) || 1;

    const discountAmount = parseFloat(formData.req_discount_amount) || 0;
    
    const submitData = {
      ...formData,
      price: price,
      quantity: quantity,
      order: price * quantity, // order = price * quantity for invoice calculation
      req_discount: formData.req_discount ? 'true' : 'false',
      req_discount_amount: discountAmount.toString(), // Convert to string for schema
    };
    
    if (createMutation.isPending) {
      return;
    }
    
    createMutation.mutate(submitData);
  };



  const statuses = config?.planStatuses || ['To Do', 'In Progress', 'Completed'];
  const isPending = createMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {requirement ? 'Edit Requirement' : 'Add Requirement'}
            </Text>
            <TouchableOpacity onPress={onClose} data-testid="button-close-modal">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Requirement Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.requirement}
                onChangeText={(text) => setFormData({ ...formData, requirement: text })}
                placeholder="Enter requirement name"
                data-testid="input-requirement-name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
                data-testid="input-description"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.requirementOwner}
                  onValueChange={(value: string) => setFormData({ ...formData, requirementOwner: value })}
                  style={styles.picker}
                  data-testid="picker-owner"
                >
                  <RNPicker.Item label="Select team member" value="" />
                  {teamMembers.map(member => (
                    <RNPicker.Item 
                      key={member.id} 
                      label={member.name} 
                      value={member.name} 
                    />
                  ))}
                </RNPicker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.requirementStatus}
                  onValueChange={(value: string) => setFormData({ ...formData, requirementStatus: value })}
                  style={styles.picker}
                  data-testid="picker-status"
                >
                  {statuses.map(status => (
                    <RNPicker.Item key={status} label={status} value={status} />
                  ))}
                </RNPicker>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  data-testid="input-price"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="1"
                  keyboardType="numeric"
                  data-testid="input-quantity"
                />
              </View>
            </View>

            {/* Discount Section */}
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.label}>Apply Discount</Text>
                <Switch
                  value={formData.req_discount}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      req_discount: value,
                      req_discount_amount: value ? formData.req_discount_amount : '0'
                    });
                  }}
                />
              </View>
            </View>

            {formData.req_discount && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Discount Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.req_discount_amount}
                  onChangeText={(text) => setFormData({ ...formData, req_discount_amount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  data-testid="input-discount-amount"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.submitButton, styles.submitButtonFull, isPending && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {requirement ? 'Update' : 'Add'} Requirement
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flex: 1,
    backgroundColor: BRAND_MAROON,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
