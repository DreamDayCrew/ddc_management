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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../lib/api';
import { useTheme } from '../contexts';

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  requirementId: string;
  plan?: any;
  isEventCompleted?: boolean;
}

const BRAND_MAROON = '#800020';

export default function AddPlanModal({ visible, onClose, requirementId, plan, isEventCompleted = false }: AddPlanModalProps) {
  const { colors, isDark } = useTheme();
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
    customerRating: null as number | null,
    teamRating: null as number | null,
    reviewNotes: '',
  });

  const [isInitialLoad, setIsInitialLoad] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Dropdown states
  const [showVendorCategoryDropdown, setShowVendorCategoryDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [showTeamRoleDropdown, setShowTeamRoleDropdown] = useState(false);
  const [showAssetCategoryDropdown, setShowAssetCategoryDropdown] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showPurchaseStatusDropdown, setShowPurchaseStatusDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  const [showPlanStatusDropdown, setShowPlanStatusDropdown] = useState(false);

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
        customerRating: plan.customerRating || null,
        teamRating: plan.teamRating || null,
        reviewNotes: plan.reviewNotes || '',
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
      Alert.alert('Error', 'Failed to save plan. Please try again.');
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
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      if (requirementId) {
        queryClient.invalidateQueries({ queryKey: ['requirements', requirementId, 'plans'] });
      }
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', 'Failed to delete plan. Please try again.');
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
      customerRating: null,
      teamRating: null,
      reviewNotes: '',
    });
  };

  const closeDropdowns = () => {
    setShowVendorCategoryDropdown(false);
    setShowVendorDropdown(false);
    setShowTeamMemberDropdown(false);
    setShowTeamRoleDropdown(false);
    setShowAssetCategoryDropdown(false);
    setShowAssetDropdown(false);
    setShowPurchaseStatusDropdown(false);
    setShowPaymentStatusDropdown(false);
    setShowPlanStatusDropdown(false);
  };

  const handleSubmit = () => {
    let submitData: any = {
      planType,
      payment: parseFloat(formData.payment) || 0,
      paymentStatus: formData.paymentStatus,
      planStatus: formData.planStatus,
    };

    // Include review data when editing (plan exists)
    if (plan) {
      submitData.customerRating = formData.customerRating;
      submitData.teamRating = formData.teamRating;
      submitData.reviewNotes = formData.reviewNotes || null;
    }

    if (planType === 'Vendor') {
      if (!formData.vendorCategory) {
        Alert.alert('Error', 'Please select a vendor category');
        return;
      }
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
      if (!formData.assetCategory) {
        Alert.alert('Error', 'Please select an asset category');
        return;
      }
      if (!formData.assetId) {
        Alert.alert('Error', 'Please select an asset');
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
  const filteredVendors = useMemo(() => {
    if (!formData.vendorCategory) {
      if (plan && formData.vendorId) {
        const currentVendor = vendors.find(v => v.id === formData.vendorId);
        return currentVendor ? [currentVendor] : [];
      }
      return [];
    }
    
    const filtered = vendors.filter(vendor => vendor.category === formData.vendorCategory);
    
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
      if (plan && formData.assetId) {
        const currentAsset = assets.find(a => a.id === formData.assetId);
        return currentAsset ? [currentAsset] : [];
      }
      return [];
    }
    
    const filtered = assets.filter(asset => asset.category === formData.assetCategory);
    
    if (plan && formData.assetId && !filtered.some(a => a.id === formData.assetId)) {
      const currentAsset = assets.find(a => a.id === formData.assetId);
      if (currentAsset) {
        filtered.unshift(currentAsset);
      }
    }
    
    return filtered;
  }, [formData.assetCategory, formData.assetId, assets, plan]);

  // Reset vendorId when vendorCategory changes
  useEffect(() => {
    if (formData.vendorCategory && planType === 'Vendor' && !isInitialLoad && !plan) {
      setFormData(prev => ({ ...prev, vendorId: '' }));
    }
  }, [formData.vendorCategory, planType, isInitialLoad, plan]);
  
  // Reset assetId when assetCategory changes
  useEffect(() => {
    if (formData.assetCategory && planType === 'Asset' && !isInitialLoad && !plan) {
      setFormData(prev => ({ ...prev, assetId: '' }));
    }
  }, [formData.assetCategory, planType, isInitialLoad, plan]);
  
  // Track initial loading state
  useEffect(() => {
    if (plan && visible) {
      setIsInitialLoad(true);
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
        onPress={() => {
          closeDropdowns();
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {plan ? 'Edit Plan' : 'Add Fulfillment Plan'}
            </Text>
            <TouchableOpacity onPress={onClose} data-testid="button-close-modal">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Plan Type</Text>
              <View style={styles.typeButtons}>
                {['Vendor', 'Team', 'Asset'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      planType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                      plan && { opacity: 0.6 },
                    ]}
                    onPress={() => !plan && setPlanType(type as any)}
                    disabled={!!plan}
                    data-testid={`button-type-${type.toLowerCase()}`}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: planType === type ? '#ffffff' : colors.text }
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
                  <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowVendorCategoryDropdown(!showVendorCategoryDropdown);
                      }}
                      testID="dropdown-vendor-category"
                    >
                      <MaterialIcons name="category" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.vendorCategory ? colors.text : colors.textSecondary }]}>
                        {formData.vendorCategory || 'Select category'}
                      </Text>
                      <MaterialIcons 
                        name={showVendorCategoryDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Vendor *</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border, opacity: !formData.vendorCategory ? 0.6 : 1 }]}
                      onPress={() => {
                        if (formData.vendorCategory) {
                          closeDropdowns();
                          setShowVendorDropdown(!showVendorDropdown);
                        }
                      }}
                      disabled={!formData.vendorCategory}
                      testID="dropdown-vendor"
                    >
                      <MaterialIcons name="business" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.vendorId ? colors.text : colors.textSecondary }]}>
                        {filteredVendors.find(v => v.id === formData.vendorId)?.name || 'Select vendor'}
                      </Text>
                      <MaterialIcons 
                        name={showVendorDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {planType === 'Team' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Team Member *</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowTeamMemberDropdown(!showTeamMemberDropdown);
                      }}
                      testID="dropdown-team-member"
                    >
                      <MaterialIcons name="person" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.teamMemberId ? colors.text : colors.textSecondary }]}>
                        {teamMembers.find(t => t.id === formData.teamMemberId)?.name || 'Select team member'}
                      </Text>
                      <MaterialIcons 
                        name={showTeamMemberDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Role</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowTeamRoleDropdown(!showTeamRoleDropdown);
                      }}
                      testID="dropdown-team-role"
                    >
                      <MaterialIcons name="work" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.teamRole ? colors.text : colors.textSecondary }]}>
                        {formData.teamRole || 'Select role'}
                      </Text>
                      <MaterialIcons 
                        name={showTeamRoleDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {planType === 'Asset' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowAssetCategoryDropdown(!showAssetCategoryDropdown);
                      }}
                      testID="dropdown-asset-category"
                    >
                      <MaterialIcons name="category" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.assetCategory ? colors.text : colors.textSecondary }]}>
                        {formData.assetCategory || 'Select category'}
                      </Text>
                      <MaterialIcons 
                        name={showAssetCategoryDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Asset *</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border, opacity: !formData.assetCategory ? 0.6 : 1 }]}
                      onPress={() => {
                        if (formData.assetCategory) {
                          closeDropdowns();
                          setShowAssetDropdown(!showAssetDropdown);
                        }
                      }}
                      disabled={!formData.assetCategory}
                      testID="dropdown-asset"
                    >
                      <MaterialIcons name="inventory" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.assetId ? colors.text : colors.textSecondary }]}>
                        {filteredAssets.find(a => a.id === formData.assetId)?.name || 'Select asset'}
                      </Text>
                      <MaterialIcons 
                        name={showAssetDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Purchase Status</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowPurchaseStatusDropdown(!showPurchaseStatusDropdown);
                      }}
                      testID="dropdown-purchase-status"
                    >
                      <MaterialIcons name="shopping-cart" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.assetPurchaseStatus ? colors.text : colors.textSecondary }]}>
                        {formData.assetPurchaseStatus || 'Select status'}
                      </Text>
                      <MaterialIcons 
                        name={showPurchaseStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {/* Payment fields - only show for Asset plans with 'New' purchase status or other plan types */}
            {((planType === 'Asset' && formData.assetPurchaseStatus === 'New') || planType !== 'Asset') && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Payment Amount (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={formData.payment}
                    onChangeText={(text) => setFormData({ ...formData, payment: text })}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    data-testid="input-payment"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Payment Status</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => {
                        closeDropdowns();
                        setShowPaymentStatusDropdown(!showPaymentStatusDropdown);
                      }}
                      testID="dropdown-payment-status"
                    >
                      <MaterialIcons name="payment" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: colors.text }]}>
                        {formData.paymentStatus}
                      </Text>
                      <MaterialIcons 
                        name={showPaymentStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Plan Status</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    closeDropdowns();
                    setShowPlanStatusDropdown(!showPlanStatusDropdown);
                  }}
                  testID="dropdown-plan-status"
                >
                  <MaterialIcons name="flag" size={20} color={colors.text} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {formData.planStatus}
                  </Text>
                  <MaterialIcons 
                    name={showPlanStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Review Section - Only show when editing and event is completed */}
            {plan && isEventCompleted && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Review</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Customer Rating</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFormData({ ...formData, customerRating: star })}
                        style={styles.starButton}
                        testID={`button-customer-star-${star}`}
                      >
                        <Ionicons
                          name={formData.customerRating && star <= formData.customerRating ? 'star' : 'star-outline'}
                          size={28}
                          color={formData.customerRating && star <= formData.customerRating ? '#EAB308' : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    ))}
                    {formData.customerRating && (
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, customerRating: null })}
                        style={styles.clearRating}
                        testID="button-clear-customer-rating"
                      >
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Team Rating</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFormData({ ...formData, teamRating: star })}
                        style={styles.starButton}
                        testID={`button-team-star-${star}`}
                      >
                        <Ionicons
                          name={formData.teamRating && star <= formData.teamRating ? 'star' : 'star-outline'}
                          size={28}
                          color={formData.teamRating && star <= formData.teamRating ? '#EAB308' : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    ))}
                    {formData.teamRating && (
                      <TouchableOpacity
                        onPress={() => setFormData({ ...formData, teamRating: null })}
                        style={styles.clearRating}
                        testID="button-clear-team-rating"
                      >
                        <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Review Notes</Text>
                  <TextInput
                    style={[styles.textArea, { 
                      backgroundColor: colors.card, 
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={formData.reviewNotes}
                    onChangeText={(text) => setFormData({ ...formData, reviewNotes: text })}
                    placeholder="Add feedback or comments..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    testID="input-review-notes"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Vendor Category Dropdown */}
          {showVendorCategoryDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {vendorCategories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.vendorCategory === category && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, vendorCategory: category });
                      setShowVendorCategoryDropdown(false);
                    }}
                  >
                    <MaterialIcons name="category" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{category}</Text>
                    {formData.vendorCategory === category && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Vendor Dropdown */}
          {showVendorDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {filteredVendors.map(vendor => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.vendorId === vendor.id && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, vendorId: vendor.id });
                      setShowVendorDropdown(false);
                    }}
                  >
                    <MaterialIcons name="business" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{vendor.name}</Text>
                    {formData.vendorId === vendor.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Team Member Dropdown */}
          {showTeamMemberDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {teamMembers.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.teamMemberId === member.id && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, teamMemberId: member.id });
                      setShowTeamMemberDropdown(false);
                    }}
                  >
                    <MaterialIcons name="person" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{member.name}</Text>
                    {formData.teamMemberId === member.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Team Role Dropdown */}
          {showTeamRoleDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {roles.map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.teamRole === role && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, teamRole: role });
                      setShowTeamRoleDropdown(false);
                    }}
                  >
                    <MaterialIcons name="work" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{role}</Text>
                    {formData.teamRole === role && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Asset Category Dropdown */}
          {showAssetCategoryDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {assetCategories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.assetCategory === category && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, assetCategory: category });
                      setShowAssetCategoryDropdown(false);
                    }}
                  >
                    <MaterialIcons name="category" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{category}</Text>
                    {formData.assetCategory === category && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Asset Dropdown */}
          {showAssetDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {filteredAssets.map(asset => (
                  <TouchableOpacity
                    key={asset.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.assetId === asset.id && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, assetId: asset.id });
                      setShowAssetDropdown(false);
                    }}
                  >
                    <MaterialIcons name="inventory" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{asset.name}</Text>
                    {formData.assetId === asset.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Purchase Status Dropdown */}
          {showPurchaseStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 380 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {assetPurchaseStatuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.assetPurchaseStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, assetPurchaseStatus: status });
                      setShowPurchaseStatusDropdown(false);
                    }}
                  >
                    <MaterialIcons name="shopping-cart" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                    {formData.assetPurchaseStatus === status && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment Status Dropdown */}
          {showPaymentStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 440 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {paymentStatuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.paymentStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, paymentStatus: status });
                      setShowPaymentStatusDropdown(false);
                    }}
                  >
                    <MaterialIcons name="payment" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                    {formData.paymentStatus === status && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Plan Status Dropdown */}
          {showPlanStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 500 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {planStatuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.planStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, planStatus: status });
                      setShowPlanStatusDropdown(false);
                    }}
                  >
                    <MaterialIcons name="flag" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                    {formData.planStatus === status && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {plan && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={handleDelete}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                <Text style={styles.deleteButtonText}>Delete Plan</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { backgroundColor: colors.primary },
                isPending && styles.buttonDisabled,
                !plan && styles.submitButtonFull
              ]}
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
        </TouchableOpacity>
      </TouchableOpacity>
      </KeyboardAvoidingView>
      
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },
  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  clearRating: {
    marginLeft: 8,
    padding: 4,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
  },
  fixedDropdownList: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1000,
    zIndex: 999999,
    maxHeight: 200,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  selectedDropdownItem: {
    borderRadius: 4,
  },
  dropdownItemText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
});