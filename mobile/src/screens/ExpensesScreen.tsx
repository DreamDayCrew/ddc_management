import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useExpenses } from '../hooks/useApi';
import type { Expense } from '../types';

export default function ExpensesScreen() {
  const { data: expenses, isLoading, error } = useExpenses();

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <View style={[styles.typeBadge, item.type === 'Credit' ? styles.creditBadge : styles.debitBadge]}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <Text style={[styles.amount, item.type === 'Credit' ? styles.creditAmount : styles.debitAmount]}>
          ₹{parseFloat(item.amount).toLocaleString()}
        </Text>
      </View>
      
      <Text style={styles.category}>{item.category}</Text>
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}
      
      <View style={styles.accountRow}>
        <Text style={styles.accountLabel}>From:</Text>
        <Text style={styles.accountValue}>{item.from_account}</Text>
      </View>
      
      {item.to_account && (
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>To:</Text>
          <Text style={styles.accountValue}>{item.to_account}</Text>
        </View>
      )}
      
      <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      
      <View style={[styles.statusBadge, getStatusColor(item.status)]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
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

  const totalCredit = expenses?.filter(e => e.type === 'Credit')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
  const totalDebit = expenses?.filter(e => e.type === 'Debit')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Credit</Text>
          <Text style={[styles.summaryValue, styles.creditAmount]}>
            ₹{totalCredit.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Debit</Text>
          <Text style={[styles.summaryValue, styles.debitAmount]}>
            ₹{totalDebit.toLocaleString()}
          </Text>
        </View>
      </View>

      <FlatList
        data={expenses || []}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return { backgroundColor: '#d1fae5' };
    case 'Pending':
      return { backgroundColor: '#fef3c7' };
    default:
      return { backgroundColor: '#e5e7eb' };
  }
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditBadge: {
    backgroundColor: '#d1fae5',
  },
  debitBadge: {
    backgroundColor: '#fee2e2',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditAmount: {
    color: '#10b981',
  },
  debitAmount: {
    color: '#ef4444',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  accountRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  accountLabel: {
    fontSize: 13,
    color: '#9ca3af',
    width: 60,
  },
  accountValue: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#1f2937',
    fontWeight: '500',
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
});
