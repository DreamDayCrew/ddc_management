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

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  requirementId: string;
  plan?: any;
}

const BRAND_MAROON = '#800020';

export default function AddPlanModal({ visible, onClose, requirementId, plan }: AddPlanModalProps) {
  const queryClient = useQueryClient();
  
  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamMembers(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  const [planType, setPlanType] = useState<'Vendor' | 'Team' | 'Asset'>('Vendor');
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorCategory: '',
    teamMemberId: '',
    teamRole: '',
    assetId: '',
    assetPurchaseStatus: '',
    assetCategory: '',
    payment: '',
    paymentStatus: 'To Do',
    planStatus: 'To Do',
  });

  useEffect(() => {
    if (plan && visible) {
      setPlanType(plan.planType);
      setFormData({
        vendorId: plan.vendorId || '',
        vendorCategory: plan.vendorCategory || '',
        teamMemberId: plan.teamMemberId || '',
        teamRole: plan.teamRole || '',
        assetId: plan.assetId || '',
        assetPurchaseStatus: plan.assetPurchaseStatus || '',
        assetCategory: plan.assetCategory || '',
        payment: plan.payment ? String(plan.payment) : '',
        paymentStatus: plan.paymentStatus || 'To Do',
        planStatus: plan.planStatus || 'To Do',
      });
    } else if (!visible) {
      resetForm();
    }
  }, [plan, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (plan) {
        return await api.updatePlan(plan.id, data);
      }
      return await api.createPlan(requirementId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePlan(plan.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete plan');
    },
  });

  const resetForm = () => {
    setPlanType('Vendor');
    setFormData({
      vendorId: '',
      vendorCategory: '',
      teamMemberId: '',
      teamRole: '',
      assetId: '',
      assetPurchaseStatus: '',
      assetCategory: '',
      payment: '',
      paymentStatus: 'To Do',
      planStatus: 'To Do',
    });
  };

  const handleSubmit = () => {
    let submitData: any = {
      planType,
      payment: parseFloat(formData.payment) || 0,
      paymentStatus: formData.paymentStatus,
      planStatus: formData.planStatus,
    };

    if (planType === 'Vendor') {
      if (!formData.vendorId) {
        Alert.alert('Error', 'Please select a vendor');
        return;
      }
      submitData.vendorId = formData.vendorId;
      submitData.vendorCategory = formData.vendorCategory;
    } else if (planType === 'Team') {
      if (!formData.teamMemberId) {
        Alert.alert('Error', 'Please select a team member');
        return;
      }
      submitData.teamMemberId = formData.teamMemberId;
      submitData.teamRole = formData.teamRole;
    } else if (planType === 'Asset') {
      if (!formData.assetId) {
        Alert.alert('Error', 'Please select an asset');
        return;
      }
      submitData.assetId = formData.assetId;
      submitData.assetPurchaseStatus = formData.assetPurchaseStatus;
      submitData.assetCategory = formData.assetCategory;
    }

    createMutation.mutate(submitData);
  };

  const handleDelete = () => {
    if (!plan) return;

    Alert.alert(
      'Delete Plan',
      'Are you sure you want to delete this fulfillment plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const planStatuses = config?.planStatuses || ['To Do', 'In Progress', 'Completed'];
  const paymentStatuses = config?.paymentStatuses || ['To Do', 'Completed'];
  const vendorCategories = config?.vendorCategories || [];
  const roles = config?.roles || [];
  const assetCategories = config?.assetCategories || [];
  const assetPurchaseStatuses = config?.assetPurchaseStatus || ['Existing', 'New'];
  
  const isPending = createMutation.isPending || deleteMutation.isPending;

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
              {plan ? 'Edit Plan' : 'Add Fulfillment Plan'}
            </Text>
            <TouchableOpacity onPress={onClose} data-testid="button-close-modal">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Type</Text>
              <View style={styles.typeButtons}>
                {['Vendor', 'Team', 'Asset'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      planType === type && styles.typeButtonActive,
                      plan && styles.buttonDisabled,
                    ]}
                    onPress={() => !plan && setPlanType(type as any)}
                    disabled={!!plan}
                    data-testid={`button-type-${type.toLowerCase()}`}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        planType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {planType === 'Vendor' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vendor *</Text>
                  <Picker
                    selectedValue={formData.vendorId}
                    onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    items={[
                      { label: 'Select vendor', value: '' },
                      ...vendors.map(v => ({ label: v.name, value: v.id }))
                    ]}
                    data-testid="picker-vendor"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <Picker
                    selectedValue={formData.vendorCategory}
                    onValueChange={(value) => setFormData({ ...formData, vendorCategory: value })}
                    items={[
                      { label: 'Select category', value: '' },
                      ...vendorCategories.map(c => ({ label: c, value: c }))
                    ]}
                    data-testid="picker-vendor-category"
                  />
                </View>
              </>
            )}

            {planType === 'Team' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Team Member *</Text>
                  <Picker
                    selectedValue={formData.teamMemberId}
                    onValueChange={(value) => setFormData({ ...formData, teamMemberId: value })}
                    items={[
                      { label: 'Select team member', value: '' },
                      ...teamMembers.map(t => ({ label: t.name, value: t.id }))
                    ]}
                    data-testid="picker-team-member"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Role</Text>
                  <Picker
                    selectedValue={formData.teamRole}
                    onValueChange={(value) => setFormData({ ...formData, teamRole: value })}
                    items={[
                      { label: 'Select role', value: '' },
                      ...roles.map(r => ({ label: r, value: r }))
                    ]}
                    data-testid="picker-team-role"
                  />
                </View>
              </>
            )}

            {planType === 'Asset' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Asset *</Text>
                  <Picker
                    selectedValue={formData.assetId}
                    onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                    items={[
                      { label: 'Select asset', value: '' },
                      ...assets.map(a => ({ label: a.name, value: a.id }))
                    ]}
                    data-testid="picker-asset"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Purchase Status</Text>
                  <Picker
                    selectedValue={formData.assetPurchaseStatus}
                    onValueChange={(value) => setFormData({ ...formData, assetPurchaseStatus: value })}
                    items={[
                      { label: 'Select status', value: '' },
                      ...assetPurchaseStatuses.map(s => ({ label: s, value: s }))
                    ]}
                    data-testid="picker-purchase-status"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <Picker
                    selectedValue={formData.assetCategory}
                    onValueChange={(value) => setFormData({ ...formData, assetCategory: value })}
                    items={[
                      { label: 'Select category', value: '' },
                      ...assetCategories.map(c => ({ label: c, value: c }))
                    ]}
                    data-testid="picker-asset-category"
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.payment}
                onChangeText={(text) => setFormData({ ...formData, payment: text })}
                placeholder="0"
                keyboardType="numeric"
                data-testid="input-payment"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Status</Text>
              <Picker
                selectedValue={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                items={paymentStatuses.map(s => ({ label: s, value: s }))}
                data-testid="picker-payment-status"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Status</Text>
              <Picker
                selectedValue={formData.planStatus}
                onValueChange={(value) => setFormData({ ...formData, planStatus: value })}
                items={planStatuses.map(s => ({ label: s, value: s }))}
                data-testid="picker-plan-status"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {plan && (
              <TouchableOpacity
                style={[styles.deleteButton, isPending && styles.buttonDisabled]}
                onPress={handleDelete}
                disabled={isPending}
                data-testid="button-delete-plan"
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.submitButton, isPending && styles.buttonDisabled, !plan && styles.submitButtonFull]}
              onPress={handleSubmit}
              disabled={isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {plan ? 'Update' : 'Add'} Plan
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
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    color: '#ffffff',
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
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
