import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useExpenses, useAccountBalance, useRepayments } from "../hooks/useApi";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Expense } from '../types';
import AddExpenseModal from '../components/AddExpenseModal';
import RepaymentDetailsModal from '../components/RepaymentDetailsModal';

const BRAND_MAROON = '#800020';

// Helper function to get first and last day of current month in YYYY-MM-DD format
const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
};

export default function ExpensesScreen() {
  const queryClient = useQueryClient();
  const currentMonthRange = useMemo(getCurrentMonthRange, []);
  const { data: expenses, isLoading, error } = useExpenses(currentMonthRange);
  const { data: accountBalances } = useAccountBalance();
  const { data: repayments } = useRepayments();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repayments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] });
      Alert.alert('Success', 'Expense deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete expense: ${error.message}`);
    },
  });

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!expenseToDelete) return;
    deleteMutation.mutate(expenseToDelete.id);
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setExpenseToDelete(null);
  };

  const { totalIncome, totalExpense, accountBalance, pendingRepayment } = useMemo(() => {
    let income = 0;
    let expense = 0;

    // Calculate income and expense from expenses data
    if (expenses) {
      expenses.forEach((t) => {
        const amount = parseFloat(t.amount as any) || 0;

        if (t.type === 'Credit') {
          income += amount;
        } else if (t.type === 'Debit') {
          expense += amount;
        }
      });
    }

    // Get account balance from database
    let balance = 0;
    if (accountBalances && accountBalances.length > 0) {
      balance = parseFloat(accountBalances[0].balance as any) || 0;
    }

    // Calculate pending repayment from repayments data
    let repayment = 0;
    if (repayments) {
      repayments.forEach((r) => {
        repayment += parseFloat(r.pending_amount as any) || 0;
      });
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      accountBalance: balance,
      pendingRepayment: Math.max(0, repayment),
    };
  }, [expenses, accountBalances, repayments]);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedExpense(null);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load expenses</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
        <View style={[styles.card, { backgroundColor: BRAND_MAROON }]}>
          <Ionicons name="wallet" size={32} color="#fff" />
          <Text style={styles.cardValue}>₹{accountBalance.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Account Balance</Text>
        </View>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: '#f59e0b' }]}
          onPress={() => setRepaymentModalVisible(true)}
        >
          <Ionicons name="time" size={32} color={BRAND_MAROON} />
          <Text style={[styles.cardValue, { color: BRAND_MAROON }]}>₹{pendingRepayment.toFixed(2)}</Text>
          <Text style={[styles.cardLabel, { color: BRAND_MAROON }]}>Pending Repayment</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Expenses List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseCard}
            onPress={() => handleEdit(item)}
          >
            <View style={styles.expenseHeader}>
              <View style={styles.expenseTypeContainer}>
                <Ionicons 
                    name={item.type === 'Credit' ? 'arrow-down-circle' : item.type === 'Debit' ? 'arrow-up-circle' : 'swap-horizontal'}
                    size={20} 
                    color={item.type === 'Credit' ? '#10b981' : item.type === 'Debit' ? '#ef4444' : '#f59e0b'}
                  />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.expenseDescription}>{item.description}</Text>
                  <Text style={styles.expenseCategory}>{item.category} • {new Date(item.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.expenseAmount, { color: item.type === 'Credit' ? '#10b981' : '#ef4444' }]}>
                  {item.type === 'Credit' ? '+' : '-'}₹{parseFloat(item.amount as any).toFixed(2)}
                </Text>
                {item.closing_balance && (
                  <Text style={styles.closingBalanceText}>
                    Balance: ₹{parseFloat(item.closing_balance as any).toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.expenseFooter}>
              <Text style={styles.expenseAccount}>
                {item.to_account ? `${item.from_account} → ${item.to_account}` : item.from_account}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses yet</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddExpenseModal
        visible={modalVisible}
        onClose={handleCloseModal}
        expense={selectedExpense}
      />

      <RepaymentDetailsModal
        visible={repaymentModalVisible}
        onClose={() => setRepaymentModalVisible(false)}
        repayments={repayments || []}
      />

      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmTitle}>Delete Expense</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete this expense?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: 160,
  },
  card: {
    width: 160,
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closingBalance: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseAccount: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_MAROON,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  closingBalanceText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
});
