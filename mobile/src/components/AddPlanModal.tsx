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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import ConfirmDialog from './ConfirmDialog';
import { api } from '../lib/api';
import { useTheme } from '../contexts';
import envConfig from '../config/environment';
import AddVendorModal from './AddVendorModal';
import AddAssetModal from './AddAssetModal';
import type { Vendor } from '../types';

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
  const [assetType, setAssetType] = useState<'Inventory' | 'Temporary'>('Inventory');
  const [formData, setFormData] = useState({
    vendorId: '',
    vendorCategory: '',
    teamMemberId: '',
    teamRole: '',
    assetId: '',
    assetPurchaseStatus: '',
    assetCategory: '',
    assetName: '',
    assetSearch: '',
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
  const [vendorSearchAll, setVendorSearchAll] = useState(false);
  const [assetSearchAll, setAssetSearchAll] = useState(false);
  const [showVendorCreate, setShowVendorCreate] = useState(false);
  const [showAssetCreate, setShowAssetCreate] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [newVendor, setNewVendor] = useState({ name: '', category: '', rating: '' });
  const [newAsset, setNewAsset] = useState({ name: '', category: '', quantity: '1' });
  const [tempVendor, setTempVendor] = useState<Vendor | null>(null);
  const [tempAsset, setTempAsset] = useState<any | null>(null);
  
  // Expense linking state
  const [showPartialExpenseDialog, setShowPartialExpenseDialog] = useState(false);
  const [partialExpenseAmount, setPartialExpenseAmount] = useState('');
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<string | null>(null);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [showPendingConfirmDialog, setShowPendingConfirmDialog] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLinkedExpenseDialog, setShowLinkedExpenseDialog] = useState(false);
  
  // Query for linked expense
  const { data: linkedExpense, refetch: refetchLinkedExpense } = useQuery({
    queryKey: ['/api/expenses/by-plan', plan?.id],
    queryFn: async () => {
      if (!plan?.id) return null;
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-plan/${plan.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!plan?.id && visible,
  });
  
  const linkedExpenseId = linkedExpense?.id || null;

  useEffect(() => {
    if (plan && visible) {
      setPlanType(plan.planType);
      setAssetType(plan.assetType || 'Inventory');
      
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
        assetName: plan.assetName || '',
        assetCategory: plan.assetCategory || '',
        assetSearch: plan.assetName || '',
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
    setAssetType('Inventory');
    setFormData({
      vendorId: '',
      vendorCategory: '',
      teamMemberId: '',
      teamRole: '',
      assetId: '',
      assetPurchaseStatus: '',
      assetCategory: '',
      assetName: '',
      assetSearch: '',
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

  // Get recipient name for expense based on plan type
  const getRecipientName = (): string => {
    if (planType === 'Vendor') {
      const vendor = vendors.find(v => v.id === formData.vendorId);
      return vendor?.name || 'Vendor';
    } else if (planType === 'Team') {
      const teamMember = teamMembers.find(t => t.id === formData.teamMemberId);
      return teamMember?.name || 'Team Member';
    } else if (planType === 'Asset') {
      const asset = assets.find(a => a.id === formData.assetId);
      return asset?.name || formData.assetName || 'Asset';
    }
    return 'Recipient';
  };

  // Create expense and link to fulfillment plan
  const createExpenseForPlan = async (amount: string, status: string, dateStr?: string) => {
    if (!plan?.id) {
      Alert.alert('Error', 'Cannot create expense: plan ID is required');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    setIsCreatingExpense(true);
    try {
      const recipientName = getRecipientName();
      const expenseData = {
        type: 'Debit',
        category: 'Event',
        from_account: 'DDC Fund',
        to_account: recipientName,
        description: `DDC Spent for ${plan?.planName || " an Event"}`,
        amount: String(paymentAmount),
        date: dateStr ? new Date(dateStr) : new Date(),
        status: 'Paid',
        fulfillmentPlanId: plan.id,
        contributor: [],
        contribution: [],
        contribution_status: [],
      };

      const createdExpense = await api.createExpense(expenseData);

      // Update plan with new payment status only (expense already has fulfillmentPlanId)
      await api.updatePlan(plan.id, {
        paymentStatus: status,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-plan', plan.id] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });

      Alert.alert(
        'Success',
        `Expense created and linked to plan (₹${paymentAmount.toLocaleString('en-IN')})`
      );

      // Update local form state
      setFormData(prev => ({ ...prev, paymentStatus: status }));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create expense: ' + (error.message || 'Unknown error'));
    } finally {
      setIsCreatingExpense(false);
    }
  };

  // Handle payment status change for expense linking (edit mode only)
  const handlePaymentStatusChange = async (newStatus: string) => {
    // Only trigger expense creation in edit mode with valid payment amount
    const paymentAmount = parseFloat(formData.payment);
    const hasValidPayment = !isNaN(paymentAmount) && paymentAmount > 0;
    const currentStatus = formData.paymentStatus;
    
    if (newStatus === currentStatus) {
      setShowPaymentStatusDropdown(false);
      return;
    }
    
    // Check if expense is already linked
    let hasLinkedExpense = false;
    if (plan) {
      try {
        const res = await fetch(`${envConfig.API_URL}/api/expenses/by-plan/${plan.id}`);
        if (res.ok) {
          hasLinkedExpense = true;
        }
      } catch {
        // No expense linked
      }
    }
    
    // If changing to Pending and expense is linked, show confirmation
    if ((newStatus === 'Pending' || newStatus === 'To Do') && hasLinkedExpense) {
      setShowPaymentStatusDropdown(false);
      setShowPendingConfirmDialog(true);
      return;
    }
    
    // If changing from Partial to Paid, update expense to full amount
    if (currentStatus === 'Partial' && (newStatus === 'Paid' || newStatus === 'Completed') && hasLinkedExpense) {
      setShowPaymentStatusDropdown(false);
      updateExpenseAmount(formData.payment, newStatus);
      return;
    }
    
    if (plan && hasValidPayment) {
      if (newStatus === 'Paid' || newStatus === 'Completed') {
        // For "Paid/Completed" status, show dialog to confirm date
        setPendingPaymentStatus(newStatus);
        setPartialExpenseAmount(formData.payment);
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setShowPartialExpenseDialog(true);
        setShowPaymentStatusDropdown(false);
      } else if (newStatus === 'Partial') {
        // For "Partial" status, show dialog to enter partial amount
        setPendingPaymentStatus(newStatus);
        setPartialExpenseAmount('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setShowPartialExpenseDialog(true);
        setShowPaymentStatusDropdown(false);
      } else {
        // For other statuses (Pending, To Do), just update the field
        setFormData(prev => ({ ...prev, paymentStatus: newStatus }));
        setShowPaymentStatusDropdown(false);
      }
    } else {
      // No plan or no valid payment, just update status normally
      setFormData(prev => ({ ...prev, paymentStatus: newStatus }));
      setShowPaymentStatusDropdown(false);
    }
  };

  const updateExpenseAmount = async (amount: string, status: string) => {
    if (!plan?.id) return;
    
    setIsCreatingExpense(true);
    try {
      // Get existing expense
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-plan/${plan.id}`);
      if (!res.ok) {
        // No expense exists, create a new one
        createExpenseForPlan(amount, status);
        return;
      }
      const existingExpense = await res.json();
      
      // Update the expense amount
      await api.updateExpense(existingExpense.id, {
        amount: amount,
      });
      
      // Update plan status
      await api.updatePlan(plan.id, { paymentStatus: status });
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-plan', plan.id] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      
      setFormData(prev => ({ ...prev, paymentStatus: status }));
      Alert.alert('Success', `Payment updated to full amount (₹${parseFloat(amount).toLocaleString('en-IN')})`);
    } catch (error) {
      Alert.alert('Error', `Failed to update expense: ${(error as Error).message}`);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handlePendingConfirm = async () => {
    if (!plan?.id) return;
    
    setShowPendingConfirmDialog(false);
    setIsCreatingExpense(true);
    
    try {
      // Get and delete the linked expense
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-plan/${plan.id}`);
      if (res.ok) {
        const expense = await res.json();
        await api.deleteExpense(expense.id);
      }
      
      // Update plan status to Pending
      await api.updatePlan(plan.id, { paymentStatus: 'Pending' });
      
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-plan', plan.id] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      
      setFormData(prev => ({ ...prev, paymentStatus: 'Pending' }));
      Alert.alert('Success', 'Payment status changed to Pending and expense removed');
    } catch (error) {
      Alert.alert('Error', `Failed to update: ${(error as Error).message}`);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handlePendingCancel = () => {
    setShowPendingConfirmDialog(false);
  };

  // Handle partial expense dialog confirmation
  const handlePartialExpenseConfirm = () => {
    if (!pendingPaymentStatus || !partialExpenseAmount || !plan?.id) {
      return;
    }

    const amount = parseFloat(partialExpenseAmount);
    const maxAmount = parseFloat(formData.payment || '0');
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }
    
    if (amount > maxAmount) {
      Alert.alert('Error', `Amount cannot exceed the total payment (₹${maxAmount.toLocaleString('en-IN')})`);
      return;
    }

    // Auto-upgrade to Paid if amount equals full amount
    const finalStatus = pendingPaymentStatus === 'Partial' && amount >= maxAmount ? 'Paid' : pendingPaymentStatus;

    createExpenseForPlan(partialExpenseAmount, finalStatus, expenseDate);
    setShowPartialExpenseDialog(false);
    setPendingPaymentStatus(null);
  };

  // Handle partial expense dialog cancellation
  const handlePartialExpenseCancel = () => {
    setShowPartialExpenseDialog(false);
    setPendingPaymentStatus(null);
    setPartialExpenseAmount('');
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
      if(assetType === 'Inventory') {
        if (!formData.assetCategory) {
          Alert.alert('Error', 'Please select an asset category');
          return;
        }
        if (!formData.assetId) {
          Alert.alert('Error', 'Please select an asset');
          return;
        }
      }
      submitData.assetType = assetType;
      submitData.assetName = formData.assetName;
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

  // creation handled via dedicated modals

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
  
  const vendorsToShow = useMemo(() => {
    const base = vendorSearchAll ? vendors : filteredVendors;
    if (tempVendor) {
      const include =
        vendorSearchAll ||
        (!formData.vendorCategory || tempVendor.category === formData.vendorCategory);
      if (include && !base.some(v => v.id === tempVendor.id)) {
        return [tempVendor, ...base];
      }
    }
    return base;
  }, [vendorSearchAll, vendors, filteredVendors, tempVendor, formData.vendorCategory]);
  
const selectedVendor = useMemo(
  () =>
    vendors.find((vendor) => vendor.id === formData.vendorId) ||
    (tempVendor && tempVendor.id === formData.vendorId ? tempVendor : undefined),
  [vendors, formData.vendorId, tempVendor]
);
  
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

  const selectedAsset = useMemo(
    () =>
      assets.find((asset) => asset.id === formData.assetId) ||
      (tempAsset && tempAsset.id === formData.assetId ? tempAsset : undefined),
    [assets, formData.assetId, tempAsset]
  );

  const assetsToShow = useMemo(() => {
    const base = assetSearchAll ? assets : filteredAssets;
    if (tempAsset) {
      const include =
        assetSearchAll ||
        (!formData.assetCategory || tempAsset.category === formData.assetCategory);
      if (include && !base.some(a => a.id === tempAsset.id)) {
        return [tempAsset, ...base];
      }
    }
    return base;
  }, [assetSearchAll, assets, filteredAssets, tempAsset, formData.assetCategory]);

// Clear temp items once real lists contain them
useEffect(() => {
  if (tempVendor && vendors.some(v => v.id === tempVendor.id)) {
    setTempVendor(null);
  }
}, [vendors, tempVendor]);

useEffect(() => {
  if (tempAsset && assets.some(a => a.id === tempAsset.id)) {
    setTempAsset(null);
  }
}, [assets, tempAsset]);

  const vendorRatingInfo = useMemo(() => {
    if (!selectedVendor || selectedVendor.rating == null || selectedVendor.rating <= 0) return null;
    if (selectedVendor.rating >= 4) {
      return { text: selectedVendor.rating + ' / 5 • Strong choice', color: '#166534', background: '#ecfdf3', border: '#bbf7d0' };
    }
    if (selectedVendor.rating >= 2) {
      return { text: selectedVendor.rating + ' / 5 • Risky choice', color: '#854d0e', background: '#fef3c7', border: '#fef08a' };
    }
    if (selectedVendor.rating === 1) {
      return { text: '1 / 5 • Avoid this vendor', color: '#b91c1c', background: '#fee2e2', border: '#fecaca' };
    }
    return null;
  }, [selectedVendor]);

  // Reset vendorId when vendorCategory changes
  useEffect(() => {
    const currentVendor = vendors.find(v => v.id === formData.vendorId);
    if (formData.vendorCategory && planType === 'Vendor' && !isInitialLoad && !plan) {
      if (currentVendor && currentVendor.category === formData.vendorCategory) {
        return;
      }
      setFormData(prev => ({ ...prev, vendorId: '' }));
    }
  }, [formData.vendorCategory, formData.vendorId, planType, isInitialLoad, plan, vendors]);
  
  // Reset assetId when assetCategory changes
  useEffect(() => {
    const currentAsset = assets.find(a => a.id === formData.assetId);
    if (formData.assetCategory && planType === 'Asset' && !isInitialLoad && !plan) {
      if (currentAsset && currentAsset.category === formData.assetCategory) {
        return;
      }
      setFormData(prev => ({ ...prev, assetId: '' }));
    }
  }, [formData.assetCategory, formData.assetId, planType, isInitialLoad, plan, assets]);
  
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
  
  const isPending = createMutation.isPending || deleteMutation.isPending || isCreatingExpense;

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
                      planType === type && { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON, borderColor: colors.border },
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.label, { color: colors.text }]}>Vendor *</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity onPress={() => setVendorSearchAll(!vendorSearchAll)}>
                        <Text style={{ color: colors.primary, fontSize: 12 }}>
                          {vendorSearchAll ? 'Filter by category' : 'Search all'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        setNewVendor(prev => ({ ...prev, category: formData.vendorCategory }));
                        setShowVendorCreate(true);
                      }}>
                        <Text style={{ color: colors.primary, fontSize: 12 }}>Add new & link</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border, opacity: (!formData.vendorCategory && !vendorSearchAll) ? 0.6 : 1 }]}
                      onPress={() => {
                        if (formData.vendorCategory || vendorSearchAll) {
                          closeDropdowns();
                          setShowVendorDropdown(!showVendorDropdown);
                        }
                      }}
                      disabled={!formData.vendorCategory && !vendorSearchAll}
                      testID="dropdown-vendor"
                    >
                      <MaterialIcons name="business" size={20} color={colors.text} style={styles.dropdownIcon} />
                      <Text style={[styles.dropdownText, { color: formData.vendorId ? colors.text : colors.textSecondary }]}>
                        {selectedVendor?.name || 'Select vendor'}
                      </Text>
                      <MaterialIcons 
                        name={showVendorDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {vendorRatingInfo && (
                  <Text style={[styles.ratingText, { color: vendorRatingInfo.color }]}>
                    {vendorRatingInfo.text}
                  </Text>
                )}
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
                  <Text style={[styles.label, { color: colors.text }]}>Asset Type</Text>
                  <View style={styles.typeButtons}>
                    {['Inventory', 'Temporary'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          assetType === type && { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON, borderColor: colors.border },
                          plan && { opacity: 0.6 },
                        ]}
                        onPress={() => !plan && setAssetType(type as any)}
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
                {assetType === 'Inventory' && (
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
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.label, { color: colors.text }]}>Asset *</Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <TouchableOpacity onPress={() => setAssetSearchAll(!assetSearchAll)}>
                            <Text style={{ color: colors.primary, fontSize: 12 }}>
                              {assetSearchAll ? 'Filter by category' : 'Search all'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            setNewAsset(prev => ({ ...prev, category: formData.assetCategory }));
                            setShowAssetCreate(true);
                          }}>
                            <Text style={{ color: colors.primary, fontSize: 12 }}>Add new & link</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                          activeOpacity={1}
                          onPress={() => setShowAssetDropdown(true)}
                        >
                          <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                            value={formData.assetSearch || (selectedAsset?.name || '')}
                            onFocus={() => setShowAssetDropdown(true)}
                            editable={false}
                            placeholder="Select or search asset..."
                            placeholderTextColor={colors.textSecondary}
                            data-testid="input-asset-search"
                          />
                        </TouchableOpacity>
                        {showAssetDropdown && (
                          <View style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 9999, elevation: 20, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, maxHeight: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 }}>
                            <TextInput
                              style={{ padding: 12, borderBottomWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }}
                              value={assetSearchTerm}
                              onChangeText={(text) => {
                                setAssetSearchTerm(text);
                                setFormData({ ...formData, assetId: '' });
                              }}
                              placeholder="Search asset by name..."
                              placeholderTextColor={colors.textSecondary}
                              autoFocus
                            />
                            <ScrollView style={{ maxHeight: 250 }} keyboardShouldPersistTaps="handled">
                              {(assetSearchTerm ? assetsToShow.filter(asset => asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase())) : assetsToShow)
                                .map(asset => (
                                  <TouchableOpacity
                                    key={asset.id}
                                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                      setFormData({ 
                                        ...formData, 
                                        assetId: asset.id, 
                                        assetSearch: asset.name,
                                        assetCategory: formData.assetCategory || asset.category || ''
                                      });
                                      setShowAssetDropdown(false);
                                      setAssetSearchTerm('');
                                    }}
                                  >
                                    <MaterialIcons name="inventory" size={20} color={colors.text} />
                                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{asset.name}</Text>
                                    {formData.assetId === asset.id && (
                                      <MaterialIcons name="check" size={20} color={colors.primary} />
                                    )}
                                  </TouchableOpacity>
                                ))}
                              {(assetSearchTerm ? assetsToShow.filter(asset => asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase())) : assetsToShow).length === 0 && (
                                <Text style={{ padding: 12, color: colors.textSecondary }}>No asset found.</Text>
                              )}
                            </ScrollView>
                            <TouchableOpacity
                              style={{ padding: 12, alignItems: 'center', borderTopWidth: 1, borderColor: colors.border }}
                              onPress={() => setShowAssetDropdown(false)}
                            >
                              <Text style={{ color: colors.textSecondary }}>Close</Text>
                            </TouchableOpacity>
                          </View>
                        )}
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
                {assetType === 'Temporary' && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Asset *</Text>
                        <TextInput
                          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                          value={formData.assetName}
                          onChangeText={(text) => setFormData({ ...formData, assetName: text })}
                          placeholder="Example Glue, Stapler, etc."
                          placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                  </>
                )}
              </>
            )}

            {/* Payment fields - only show for Asset plans with 'New' purchase status or other plan types */}
            {((planType === 'Asset' && formData.assetPurchaseStatus === 'New') || planType !== 'Asset' || (planType === 'Asset' && assetType === 'Temporary')) && (
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
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>Payment Status</Text>
                    {plan && (formData.paymentStatus === 'Paid' || formData.paymentStatus === 'Partial' || formData.paymentStatus === 'Completed') && (
                      <TouchableOpacity
                        onPress={() => {
                          if (linkedExpenseId) {
                            setShowLinkedExpenseDialog(true);
                          } else {
                            // Open record payment dialog
                            const existingDate = linkedExpense?.date ? new Date(linkedExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                            setExpenseDate(existingDate);
                            setPartialExpenseAmount(formData.payment);
                            setPendingPaymentStatus(formData.paymentStatus);
                            setShowPartialExpenseDialog(true);
                          }
                        }}
                        disabled={isCreatingExpense}
                      >
                        <Text style={[styles.expenseLink, { color: colors.primary }]}>
                          {isCreatingExpense ? 'Linking...' : linkedExpenseId ? 'View Linked Expense' : 'Link Expense'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
              <View style={{ padding: 8, borderBottomWidth: 1, borderColor: colors.border }}>
                <TextInput
                  style={{ padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text }}
                  value={vendorSearchTerm}
                  onChangeText={setVendorSearchTerm}
                  placeholder="Search vendor by name..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {(vendorSearchTerm ? vendorsToShow.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())) : vendorsToShow).map(vendor => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.vendorId === vendor.id && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, vendorId: vendor.id, vendorCategory: vendor.category || formData.vendorCategory });
                      setShowVendorDropdown(false);
                      setVendorSearchTerm('');
                    }}
                  >
                    <MaterialIcons name="business" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{vendor.name}</Text>
                    {formData.vendorId === vendor.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {(vendorSearchTerm ? vendorsToShow.filter(v => v.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())) : vendorsToShow).length === 0 && (
                  <Text style={{ padding: 12, color: colors.textSecondary }}>No vendor found.</Text>
                )}
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
              <View style={{ padding: 8, borderBottomWidth: 1, borderColor: colors.border }}>
                <TextInput
                  style={{ padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text }}
                  value={assetSearchTerm}
                  onChangeText={(text) => {
                    setAssetSearchTerm(text);
                    setFormData({ ...formData, assetId: '' });
                  }}
                  placeholder="Search asset by name..."
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {(assetSearchTerm ? assetsToShow.filter(a => a.name.toLowerCase().includes(assetSearchTerm.toLowerCase())) : assetsToShow).map(asset => (
                  <TouchableOpacity
                    key={asset.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.assetId === asset.id && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ 
                        ...formData, 
                        assetId: asset.id,
                        assetCategory: formData.assetCategory || asset.category || '',
                        assetSearch: asset.name
                      });
                      setShowAssetDropdown(false);
                      setAssetSearchTerm('');
                    }}
                  >
                    <MaterialIcons name="inventory" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{asset.name}</Text>
                    {formData.assetId === asset.id && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {(assetSearchTerm ? assetsToShow.filter(a => a.name.toLowerCase().includes(assetSearchTerm.toLowerCase())) : assetsToShow).length === 0 && (
                  <Text style={{ padding: 12, color: colors.textSecondary }}>No asset found.</Text>
                )}
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
                    onPress={() => handlePaymentStatusChange(status)}
                    disabled={isCreatingExpense}
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
                { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON },
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

      <AddVendorModal
        visible={showVendorCreate}
        vendor={null}
        onClose={() => setShowVendorCreate(false)}
        onCreated={(created) => {
          setTempVendor(created);
          setFormData(prev => ({
            ...prev,
            vendorCategory: created.category || '',
            vendorId: created.id,
          }));
          setVendorSearchAll(true);
        }}
      />

      <AddAssetModal
        visible={showAssetCreate}
        asset={null}
        onClose={() => setShowAssetCreate(false)}
        onCreated={(created) => {
          setTempAsset(created);
          setFormData(prev => ({
            ...prev,
            assetCategory: created.category || '',
            assetId: created.id,
            assetPurchaseStatus: 'New',
            payment: created.purchasedAmount ? String(created.purchasedAmount) : prev.payment,
          }));
          setAssetSearchAll(true);
        }}
      />

      {/* Pending Status Confirmation Dialog */}
      <Modal
        visible={showPendingConfirmDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePendingCancel}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              Change to Pending Status
            </Text>
            
            <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
              Expense record will be deleted if the payment status is changed to Pending. If you want, you can choose Partial to provide partial payment.
            </Text>
            
            <Text style={[styles.dialogLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Are you sure you want to continue? This will remove the expense linking also.
            </Text>
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel, { borderColor: colors.border }]}
                onPress={handlePendingCancel}
                disabled={isCreatingExpense}
              >
                <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dialogButton, 
                  styles.dialogButtonConfirm, 
                  { backgroundColor: isDark ? '#4B5563' : '#dc2626' },
                  isCreatingExpense && styles.buttonDisabled
                ]}
                onPress={handlePendingConfirm}
                disabled={isCreatingExpense}
              >
                {isCreatingExpense ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={[styles.dialogButtonText, { color: '#ffffff' }]}>
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Dialog */}
      <Modal
        visible={showPartialExpenseDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePartialExpenseCancel}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              {pendingPaymentStatus === 'Partial' ? 'Enter Partial Payment' : 'Record Payment'}
            </Text>
            
            <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
              Recipient: {getRecipientName()}
            </Text>
            
            <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>
              {pendingPaymentStatus === 'Partial' 
                ? 'Enter the partial payment amount and date:' 
                : 'Confirm the payment date for the full amount:'}
            </Text>
            
            {/* Date Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Payment Date</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.datePickerText, { color: colors.text }]}>
                  {new Date(expenseDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(expenseDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setExpenseDate(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
            </View>
            
            {/* Amount Input - only for Partial */}
            {pendingPaymentStatus === 'Partial' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Amount</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border, 
                    color: colors.text 
                  }]}
                  value={partialExpenseAmount}
                  onChangeText={setPartialExpenseAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount paid"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={[styles.dialogHint, { color: colors.textSecondary }]}>
                  Maximum: ₹{parseFloat(formData.payment || '0').toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            
            {/* Amount Display - for Paid */}
            {(pendingPaymentStatus === 'Paid' || pendingPaymentStatus === 'Completed') && (
              <View style={[styles.amountDisplay, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <Text style={[styles.amountLabel, { color: colors.text }]}>Amount:</Text>
                <Text style={[styles.amountValue, { color: colors.text }]}>
                  ₹{parseFloat(formData.payment || '0').toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel, { borderColor: colors.border }]}
                onPress={handlePartialExpenseCancel}
              >
                <Text style={[styles.dialogButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.dialogButton, 
                  styles.dialogButtonConfirm, 
                  { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON },
                  isCreatingExpense && styles.buttonDisabled
                ]}
                onPress={handlePartialExpenseConfirm}
                disabled={isCreatingExpense || !partialExpenseAmount || parseFloat(partialExpenseAmount) <= 0}
              >
                {isCreatingExpense ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={[styles.dialogButtonText, { color: '#ffffff' }]}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Linked Expense Dialog */}
      <Modal
        visible={showLinkedExpenseDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLinkedExpenseDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>Linked Expense</Text>
            
            {linkedExpense && (
              <>
                <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Description:</Text>
                  <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.description}</Text>
                </View>
                <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Amount:</Text>
                  <Text style={[styles.expenseDetailValue, { color: colors.text }]}>₹{parseFloat(linkedExpense.amount || '0').toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Date:</Text>
                  <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{new Date(linkedExpense.date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>From Account:</Text>
                  <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.from_account}</Text>
                </View>
                {linkedExpense.to_account && (
                  <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>To Account:</Text>
                    <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.to_account}</Text>
                  </View>
                )}
              </>
            )}
            
            <View style={[styles.dialogButtons, { marginTop: 16 }]}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel, { borderColor: colors.border }]}
                onPress={() => setShowLinkedExpenseDialog(false)}
              >
                <Text style={[styles.dialogButtonText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogButton, { backgroundColor: colors.error }]}
                onPress={async () => {
                  if (linkedExpenseId) {
                    try {
                      await api.deleteExpense(linkedExpenseId);
                      await api.updatePlan(plan.id, { paymentStatus: 'Pending' });
                      queryClient.invalidateQueries({ queryKey: ['expenses'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-plan', plan.id] });
                      queryClient.invalidateQueries({ queryKey: ['plans'] });
                      setFormData(prev => ({ ...prev, paymentStatus: 'Pending' }));
                      setShowLinkedExpenseDialog(false);
                      Alert.alert('Success', 'Expense deleted and payment status reset to Pending');
                    } catch (error: any) {
                      Alert.alert('Error', 'Failed to delete expense: ' + (error.message || 'Unknown error'));
                    }
                  }
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#ffffff" />
                <Text style={[styles.dialogButtonText, { color: '#ffffff', marginLeft: 4 }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  ratingBanner: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Dialog styles for partial expense
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonCancel: {
    borderWidth: 1,
  },
  dialogButtonConfirm: {
    // backgroundColor set inline based on theme
  },
  dialogButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  amountDisplay: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  datePickerText: {
    fontSize: 16,
  },
  expenseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  expenseDetailLabel: {
    fontSize: 14,
  },
  expenseDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});