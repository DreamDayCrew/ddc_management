import { useState, useEffect, useMemo } from 'react';
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
import ConfirmDialog from './ConfirmDialog';
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
      
      // Set vendor category first to ensure filtering works
      const vendorCategory = plan.vendorCategory || '';
      const vendorId = plan.vendorId || '';
      
      setFormData({
        vendorId,
        vendorCategory,
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
      try {
        if (plan) {
          return await api.updatePlan(plan.id, data);
        }
        return await api.createPlan(requirementId, data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements', requirementId.split('/')[0]] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      // Handle error silently or show user-friendly message
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!plan?.id) {
        throw new Error('No plan ID provided for deletion');
      }
      
      try {
        const result = await api.deletePlan(plan.id);
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      if (requirementId) {
        queryClient.invalidateQueries({ queryKey: ['requirements', requirementId, 'plans'] });
      }
      onClose();
    },
    onError: (error: any) => {
      // Handle error silently or show user-friendly message
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
      if (!formData.vendorCategory) {
        return;
      }
      if (!formData.vendorId) {
        return;
      }
      submitData.vendorId = formData.vendorId;
      submitData.vendorCategory = formData.vendorCategory;
    } else if (planType === 'Team') {
      if (!formData.teamMemberId) {
        return;
      }
      submitData.teamMemberId = formData.teamMemberId;
      submitData.teamRole = formData.teamRole;
    } else if (planType === 'Asset') {
      if (!formData.assetCategory) {
        return;
      }
      if (!formData.assetId) {
        return;
      }
      submitData.assetId = formData.assetId;
      submitData.assetPurchaseStatus = formData.assetPurchaseStatus;
      submitData.assetCategory = formData.assetCategory;
    }

    if (createMutation.isPending) {
      return;
    }

    createMutation.mutate(submitData);
  };

  const handleDelete = () => {
    if (!plan) {
      return;
    }

    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    try {
      deleteMutation.mutate();
    } catch (error) {
      // Handle error silently
    }
    setShowDeleteConfirm(false);
  };

  const planStatuses = config?.planStatuses || ['To Do', 'In Progress', 'Completed'];
  const paymentStatuses = config?.paymentStatuses || ['To Do', 'Completed'];
  const vendorCategories = config?.vendorCategories || [];
  const roles = config?.roles || [];
  const assetCategories = config?.assetCategories || [];
  const assetPurchaseStatuses = config?.assetPurchaseStatus || ['Existing', 'New'];
  
  // Filter vendors based on selected category
  // During editing, ensure the currently selected vendor is always available
  const filteredVendors = useMemo(() => {
    if (!formData.vendorCategory) {
      // If editing and no category but has vendorId, find and include that vendor
      if (plan && formData.vendorId) {
        const currentVendor = vendors.find(v => v.id === formData.vendorId);
        return currentVendor ? [currentVendor] : [];
      }
      return [];
    }
    
    const filtered = vendors.filter(vendor => vendor.category === formData.vendorCategory);
    
    // When editing, ensure the current vendor is included even if category mismatch
    if (plan && formData.vendorId && !filtered.some(v => v.id === formData.vendorId)) {
      const currentVendor = vendors.find(v => v.id === formData.vendorId);
      if (currentVendor) {
        filtered.unshift(currentVendor);
      }
    }
    
    return filtered;
  }, [formData.vendorCategory, formData.vendorId, vendors, plan]);
  
  // Filter assets based on selected category
  const filteredAssets = useMemo(() => {
    if (!formData.assetCategory) {
      // If editing and no category but has assetId, find and include that asset
      if (plan && formData.assetId) {
        const currentAsset = assets.find(a => a.id === formData.assetId);
        return currentAsset ? [currentAsset] : [];
      }
      return [];
    }
    
    const filtered = assets.filter(asset => asset.category === formData.assetCategory);
    
    // When editing, ensure the current asset is included even if category mismatch
    if (plan && formData.assetId && !filtered.some(a => a.id === formData.assetId)) {
      const currentAsset = assets.find(a => a.id === formData.assetId);
      if (currentAsset) {
        filtered.unshift(currentAsset);
      }
    }
    
    return filtered;
  }, [formData.assetCategory, formData.assetId, assets, plan]);
  
  // Track if we're in initial loading state
  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Reset vendorId when vendorCategory changes (but not during initial load)
  useEffect(() => {
    // Only reset if not initial load and not editing mode, or if user manually changed category
    if (formData.vendorCategory && planType === 'Vendor' && !isInitialLoad && !plan) {
      setFormData(prev => ({ ...prev, vendorId: '' }));
    }
  }, [formData.vendorCategory, planType, isInitialLoad, plan]);
  
  // Reset assetId when assetCategory changes (but not during initial load)
  useEffect(() => {
    // Only reset if not initial load and not editing mode, or if user manually changed category
    if (formData.assetCategory && planType === 'Asset' && !isInitialLoad && !plan) {
      setFormData(prev => ({ ...prev, assetId: '' }));
    }
  }, [formData.assetCategory, planType, isInitialLoad, plan]);
  
  // Track initial loading state
  useEffect(() => {
    if (plan && visible) {
      setIsInitialLoad(true);
      // Allow some time for data to settle, then enable category change detection
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!visible) {
      setIsInitialLoad(false);
    }
  }, [plan, visible]);
  
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
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.vendorCategory}
                      onValueChange={(value: string) => setFormData({ ...formData, vendorCategory: value })}
                      style={styles.picker}
                      data-testid="picker-vendor-category"
                    >
                      <RNPicker.Item label="Select category" value="" />
                      {vendorCategories.map(c => (
                        <RNPicker.Item key={c} label={c} value={c} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vendor *</Text>
                  <View style={[styles.pickerContainer, !formData.vendorCategory && styles.disabledPicker]}>
                    <RNPicker
                      selectedValue={formData.vendorId}
                      onValueChange={(value: string) => setFormData({ ...formData, vendorId: value })}
                      style={styles.picker}
                      enabled={!!formData.vendorCategory}
                      data-testid="picker-vendor"
                    >
                      {!formData.vendorId && (
                        <RNPicker.Item 
                          label={
                            !formData.vendorCategory 
                              ? "Select a category first" 
                              : filteredVendors.length === 0 
                                ? "No vendors available for this category"
                                : "Select vendor"
                          } 
                          value="" 
                        />
                      )}
                      {filteredVendors.map(v => (
                        <RNPicker.Item key={v.id} label={v.name} value={v.id} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
              </>
            )}

            {planType === 'Team' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Team Member *</Text>
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.teamMemberId}
                      onValueChange={(value: string) => setFormData({ ...formData, teamMemberId: value })}
                      style={styles.picker}
                      data-testid="picker-team-member"
                    >
                      <RNPicker.Item label="Select team member" value="" />
                      {teamMembers.map(t => (
                        <RNPicker.Item key={t.id} label={t.name} value={t.id} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Role</Text>
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.teamRole}
                      onValueChange={(value: string) => setFormData({ ...formData, teamRole: value })}
                      style={styles.picker}
                      data-testid="picker-team-role"
                    >
                      <RNPicker.Item label="Select role" value="" />
                      {roles.map(r => (
                        <RNPicker.Item key={r} label={r} value={r} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
              </>
            )}

            {planType === 'Asset' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category *</Text>
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.assetCategory}
                      onValueChange={(value: string) => setFormData({ ...formData, assetCategory: value })}
                      style={styles.picker}
                      data-testid="picker-asset-category"
                    >
                      <RNPicker.Item label="Select category" value="" />
                      {assetCategories.map(c => (
                        <RNPicker.Item key={c} label={c} value={c} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Asset *</Text>
                  <View style={[styles.pickerContainer, !formData.assetCategory && styles.disabledPicker]}>
                    <RNPicker
                      selectedValue={formData.assetId}
                      onValueChange={(value: string) => setFormData({ ...formData, assetId: value })}
                      style={styles.picker}
                      enabled={!!formData.assetCategory}
                      data-testid="picker-asset"
                    >
                      {!formData.assetId && (
                        <RNPicker.Item 
                          label={
                            !formData.assetCategory 
                              ? "Select a category first" 
                              : filteredAssets.length === 0 
                                ? "No assets available for this category"
                                : "Select asset"
                          } 
                          value="" 
                        />
                      )}
                      {filteredAssets.map(a => (
                        <RNPicker.Item key={a.id} label={a.name} value={a.id} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Purchase Status</Text>
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.assetPurchaseStatus}
                      onValueChange={(value: string) => setFormData({ ...formData, assetPurchaseStatus: value })}
                      style={styles.picker}
                      data-testid="picker-purchase-status"
                    >
                      <RNPicker.Item label="Select status" value="" />
                      {assetPurchaseStatuses.map(s => (
                        <RNPicker.Item key={s} label={s} value={s} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
              </>
            )}

            {/* Payment fields - only show for Asset plans with 'New' purchase status or other plan types */}
            {((planType === 'Asset' && formData.assetPurchaseStatus === 'New') || planType !== 'Asset') && (
              <>
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
                  <View style={styles.pickerContainer}>
                    <RNPicker
                      selectedValue={formData.paymentStatus}
                      onValueChange={(value: string) => setFormData({ ...formData, paymentStatus: value })}
                      style={styles.picker}
                      data-testid="picker-payment-status"
                    >
                      <RNPicker.Item label="Select status" value="" />
                      {paymentStatuses.map(status => (
                        <RNPicker.Item key={status} label={status} value={status} />
                      ))}
                    </RNPicker>
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Status</Text>
              <View style={styles.pickerContainer}>
                <RNPicker
                  selectedValue={formData.planStatus}
                  onValueChange={(value: string) => setFormData({ ...formData, planStatus: value })}
                  style={styles.picker}
                  data-testid="picker-plan-status"
                >
                  {planStatuses.map(s => (
                    <RNPicker.Item key={s} label={s} value={s} />
                  ))}
                </RNPicker>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {plan && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#ef4444',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center',
                  margin: 10
                }}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Delet Plan</Text>
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
      
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Plan"
        message="Are you sure you want to delete this fulfillment plan?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
      />
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  disabledPicker: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  picker: {
    height: 50,
  },
});
