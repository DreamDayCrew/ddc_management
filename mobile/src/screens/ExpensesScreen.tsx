import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useExpenses, useAccountBalance, useRepayments } from "../hooks/useApi";
import type { Expense } from '../types';
import AddExpenseModal from '../components/AddExpenseModal';
import RepaymentDetailsModal from '../components/RepaymentDetailsModal';

const BRAND_MAROON = '#800020';

export default function ExpensesScreen() {
  const { data: expenses, isLoading, error } = useExpenses();
  const { data: accountBalances } = useAccountBalance();
  const { data: repayments } = useRepayments();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);

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
              <Text style={[styles.expenseAmount, { color: item.type === 'Credit' ? '#10b981' : '#ef4444' }]}>
                {item.type === 'Credit' ? '+' : '-'}₹{parseFloat(item.amount as any).toFixed(2)}
              </Text>
            </View>
            <View style={styles.expenseFooter}>
              <Text style={styles.expenseAccount}>
                {item.type === 'Transfer' ? `${item.from_account} → ${item.to_account}` : item.from_account}
              </Text>
              <View style={[styles.statusBadge, {
                backgroundColor: item.status === 'Completed' ? '#10b981' : item.status === 'Pending' ? '#f59e0b' : '#6b7280'
              }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
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
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
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
});
