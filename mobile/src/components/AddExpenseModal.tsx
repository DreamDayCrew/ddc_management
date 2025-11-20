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
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  const { data: teamMembers } = useTeamMembers();
  
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
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

  const categories = config?.expenseCategories || ['Event', 'Office', 'Asset', 'Vendor', 'Team', 'Miscellaneous'];

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
            <Text style={styles.modalTitle}>{expense ? 'Edit Expense' : 'Add New Expense'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Picker
              label="Transaction Type *"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              options={['Credit', 'Debit', 'Transfer']}
            />

            <Picker
              label="Category *"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={categories}
            />

            <AccountPicker
              label="From Account *"
              value={formData.from_account}
              onChange={(value) => setFormData({ ...formData, from_account: value })}
              teamMembers={teamMembers || []}
            />

            <AccountPicker
              label="To Account *"
              value={formData.to_account}
              onChange={(value) => setFormData({ ...formData, to_account: value })}
              teamMembers={teamMembers || []}
              placeholder="Select destination account"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Purpose of this transaction"
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

            <DatePicker
              label="Date *"
              value={expenseDate}
              onChange={setExpenseDate}
            />

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
                  <Text style={styles.submitButtonText}>{expense ? 'Update Expense' : 'Create Expense'}</Text>
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
