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
import { useTheme } from '../contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration, useTeamMembers } from '../hooks/useApi';
import { DatePicker } from './DatePicker';
import { Picker } from './Picker';
import { AccountPicker } from './AccountPicker';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense?: any;
}

const BRAND_MAROON = '#800020';

export default function AddExpenseModal({ visible, onClose, expense }: AddExpenseModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  const { data: teamMembers } = useTeamMembers();
  
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFromAccountDropdown, setShowFromAccountDropdown] = useState(false);
  const [showToAccountDropdown, setShowToAccountDropdown] = useState(false);
  const [customAccountModalVisible, setCustomAccountModalVisible] = useState(false);
  const [customAccountName, setCustomAccountName] = useState('');
  const [customAccountType, setCustomAccountType] = useState<'from' | 'to'>('from');
  const [formData, setFormData] = useState({
    type: 'Debit',
    category: 'Event',
    from_account: 'DDC Fund',
    to_account: '',
    description: '',
    amount: '',
    status: 'Paid',
  });

  // Sync form data when expense prop changes
  useEffect(() => {
    if (expense && visible) {
      setFormData({
        type: expense.type || 'Debit',
        category: expense.category || 'Event',
        from_account: expense.from_account || 'DDC Fund',
        to_account: expense.to_account || '',
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        status: expense.status || 'Paid',
      });
      setExpenseDate(expense.date ? new Date(expense.date) : new Date());
    } else if (!visible) {
      resetForm();
    }
  }, [expense, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { date: string }) => {
      if (expense) {
        return await api.updateExpense(expense.id, {
          ...data,
          amount: data.amount || '0',
        } as any);
      }
      return await api.createExpense({
        ...data,
        amount: data.amount || '0',
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repayments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] });
      resetForm();
      onClose();
    },
  });


  const resetForm = () => {
    setFormData({
      type: 'Debit',
      category: 'Event',
      from_account: 'DDC Fund',
      to_account: '',
      description: '',
      amount: '',
      status: 'Paid',
    });
    setExpenseDate(new Date());
    setShowTypeDropdown(false);
    setShowCategoryDropdown(false);
    setShowFromAccountDropdown(false);
    setShowToAccountDropdown(false);
    setCustomAccountModalVisible(false);
    setCustomAccountName('');
  };

  const handleSubmit = () => {
    if (!formData.amount || !formData.description) {
      alert('Please fill in Description and Amount');
      return;
    }
    
    const submitData = {
      ...formData,
      date: expenseDate.toISOString().split('T')[0],
    };
    
    createMutation.mutate(submitData);
  };

  const handleAddCustomAccount = () => {
    if (customAccountName.trim()) {
      if (customAccountType === 'from') {
        setFormData({ ...formData, from_account: customAccountName.trim() });
      } else {
        setFormData({ ...formData, to_account: customAccountName.trim() });
      }
      setCustomAccountName('');
      setCustomAccountModalVisible(false);
    }
  };

  const openCustomAccountModal = (type: 'from' | 'to') => {
    setCustomAccountType(type);
    setCustomAccountModalVisible(true);
    setShowFromAccountDropdown(false);
    setShowToAccountDropdown(false);
  };

  const categories = config?.expenseCategories || ['Event', 'Office', 'Asset', 'Vendor', 'Team', 'Miscellaneous'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{expense ? 'Edit Expense' : 'Add New Expense'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Transaction Type *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setShowTypeDropdown(!showTypeDropdown);
                    setShowCategoryDropdown(false);
                    setShowFromAccountDropdown(false);
                    setShowToAccountDropdown(false);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.type ? colors.text : colors.textSecondary }]}>
                    {formData.type || 'Select transaction type'}
                  </Text>
                  <Ionicons 
                    name={showTypeDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowTypeDropdown(false);
                    setShowFromAccountDropdown(false);
                    setShowToAccountDropdown(false);
                  }}
                >
                  <Ionicons name="pricetag" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.category ? colors.text : colors.textSecondary }]}>
                    {formData.category || 'Select a category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* From Account Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>From Account *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setShowFromAccountDropdown(!showFromAccountDropdown);
                    setShowTypeDropdown(false);
                    setShowCategoryDropdown(false);
                    setShowToAccountDropdown(false);
                  }}
                >
                  <Ionicons name="card" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.from_account ? colors.text : colors.textSecondary }]}>
                    {formData.from_account || 'Select from account'}
                  </Text>
                  <Ionicons 
                    name={showFromAccountDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* To Account Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>To Account *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => {
                    setShowToAccountDropdown(!showToAccountDropdown);
                    setShowTypeDropdown(false);
                    setShowCategoryDropdown(false);
                    setShowFromAccountDropdown(false);
                  }}
                >
                  <Ionicons name="card-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.to_account ? colors.text : colors.textSecondary }]}>
                    {formData.to_account || 'Select destination account'}
                  </Text>
                  <Ionicons 
                    name={showToAccountDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Purpose of this transaction"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Amount (₹) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <DatePicker
              label="Date *"
              value={expenseDate}
              onChange={setExpenseDate}
            />

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={createMutation.isPending}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }, createMutation.isPending && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{expense ? 'Update Expense' : 'Create Expense'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          {/* Fixed Dropdown Lists - Outside ScrollView for proper layering */}
          {showTypeDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 160 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {['Credit', 'Debit', 'Transfer'].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.dropdownItem, formData.type === type && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }], { backgroundColor: colors.card }]}
                    onPress={() => {
                      setFormData({ ...formData, type: type });
                      setShowTypeDropdown(false);
                    }}
                  >
                    <Ionicons name="swap-horizontal" size={18} color={formData.type === type ? (isDark ? '#4a5568' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.type === type && { fontWeight: '600', color: isDark ? '#4a5568' : BRAND_MAROON }]}>
                      {type}
                    </Text>
                    {formData.type === type && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#4a5568' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showCategoryDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 240 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {categories.map((category) => (
                  <TouchableOpacity 
                    key={category}
                    style={[styles.dropdownItem, formData.category === category && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }], { backgroundColor: colors.card }]}
                    onPress={() => {
                      setFormData({ ...formData, category: category });
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Ionicons name="pricetag" size={18} color={formData.category === category ? (isDark ? '#4a5568' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.category === category && { fontWeight: '600', color: isDark ? '#4a5568' : BRAND_MAROON }]}>
                      {category}
                    </Text>
                    {formData.category === category && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#4a5568' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {showFromAccountDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {['DDC Fund', ...(teamMembers?.map(m => m.name) || [])].map((account) => (
                  <TouchableOpacity 
                    key={account}
                    style={[styles.dropdownItem, formData.from_account === account && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }], { backgroundColor: colors.card }]}
                    onPress={() => {
                      setFormData({ ...formData, from_account: account });
                      setShowFromAccountDropdown(false);
                    }}
                  >
                    <Ionicons name="card" size={18} color={formData.from_account === account ? (isDark ? '#4a5568' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.from_account === account && { fontWeight: '600', color: isDark ? '#4a5568' : BRAND_MAROON }]}>
                      {account}
                    </Text>
                    {formData.from_account === account && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#4a5568' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.dropdownItem, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }]}
                  onPress={() => openCustomAccountModal('from')}
                >
                  <Ionicons name="add-circle-outline" size={18} color={BRAND_MAROON} style={styles.dropdownItemIcon} />
                  <Text style={[styles.dropdownItemText, { color: BRAND_MAROON, fontWeight: '600' }]}>
                    + Add Custom Name
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {showToAccountDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 400 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {['DDC Fund', ...(teamMembers?.map(m => m.name) || [])].map((account) => (
                  <TouchableOpacity 
                    key={account}
                    style={[styles.dropdownItem, formData.to_account === account && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }], { backgroundColor: colors.card }]}
                    onPress={() => {
                      setFormData({ ...formData, to_account: account });
                      setShowToAccountDropdown(false);
                    }}
                  >
                    <Ionicons name="card-outline" size={18} color={formData.to_account === account ? (isDark ? '#4a5568' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.to_account === account && { fontWeight: '600', color: isDark ? '#4a5568' : BRAND_MAROON }]}>
                      {account}
                    </Text>
                    {formData.to_account === account && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#4a5568' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity 
                  style={[styles.dropdownItem, { backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }]}
                  onPress={() => openCustomAccountModal('to')}
                >
                  <Ionicons name="add-circle-outline" size={18} color={BRAND_MAROON} style={styles.dropdownItemIcon} />
                  <Text style={[styles.dropdownItemText, { color: BRAND_MAROON, fontWeight: '600' }]}>
                    + Add Custom Name
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Dropdown Overlay */}
          {(showTypeDropdown || showCategoryDropdown || showFromAccountDropdown || showToAccountDropdown) && (
            <TouchableOpacity 
              style={styles.dropdownOverlay}
              onPress={() => {
                setShowTypeDropdown(false);
                setShowCategoryDropdown(false);
                setShowFromAccountDropdown(false);
                setShowToAccountDropdown(false);
              }}
              activeOpacity={1}
            />
          )}
        </View>
      </View>

      {/* Custom Account Name Modal */}
      <Modal
        visible={customAccountModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomAccountModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={[styles.customModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.customModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.customModalTitle, { color: colors.text }]}>Add Custom Account Name</Text>
              <TouchableOpacity onPress={() => setCustomAccountModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.customModalBody}>
              <Text style={[styles.customModalLabel, { color: colors.text }]}>Account Name</Text>
              <TextInput
                style={[styles.customModalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={customAccountName}
                onChangeText={setCustomAccountName}
                placeholder="Enter account name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>
            <View style={[styles.customModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.customModalButton, styles.customModalCancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={() => {
                  setCustomAccountModalVisible(false);
                  setCustomAccountName('');
                }}
              >
                <Text style={[styles.customModalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customModalButton, styles.customModalAddButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
                onPress={handleAddCustomAccount}
              >
                <Text style={styles.customModalAddText}>Add Account</Text>
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
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
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
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 999998,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectedDropdownItem: {
    // Styling will be applied dynamically
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
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
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalContent: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
  },
  customModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customModalBody: {
    padding: 20,
  },
  customModalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  customModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  customModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  customModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customModalCancelButton: {
    borderWidth: 1,
  },
  customModalAddButton: {
    // Background will be set dynamically
  },
  customModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customModalAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
