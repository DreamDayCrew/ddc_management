import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet, ActivityIndicator, FlatList, TextInput, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses, useAccountBalance, useRepayments } from "../hooks/useApi";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Expense } from '../types';
import AddExpenseModal from '../components/AddExpenseModal';
import RepaymentDetailsModal from '../components/RepaymentDetailsModal';
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';
const BRAND_GOLD = '#D4AF37';
const PREMIUM_DARK = '#1a1a2e';
const PREMIUM_BLUE = '#16213e';
const SUCCESS_GREEN = '#00b894';
const WARNING_ORANGE = '#fdcb6e';
const DANGER_RED = '#e17055';
const NEUTRAL_GRAY = '#636e72';
const LIGHT_GRAY = '#f8f9fa';

// Helper function to get last 1 month date range
const getLast1MonthDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
};

export default function ExpensesScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Manual refresh handler
    const handleManualRefresh = async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/expenses'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/repayments'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] }),
        ]);
      } finally {
        setIsRefreshing(false);
      }
    };
  const oneMonthAgo = useMemo(getLast1MonthDate, []);
  // Fetch ALL expenses to preserve correct closing_balance from database view
  const { data: allExpenses, isLoading, error } = useExpenses();
  
  // Filter expenses for display (last 1 month) while keeping backend closing_balance
  const expenses = useMemo(() => {
    if (!allExpenses) return [];
    return allExpenses.filter((expense) => {
      const transactionDate = new Date(expense.date);
      return transactionDate >= oneMonthAgo;
    });
  }, [allExpenses, oneMonthAgo]);
  const { data: accountBalances } = useAccountBalance();
  const { data: repayments } = useRepayments();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    fromAccount: "",
    toAccount: "",
    category: "",
    type: ""
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/repayments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/account-balance'] });
      // Also invalidate all rental expense queries to ensure rental screens update
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && 
                 query.queryKey[0] === '/api/expenses/by-rental';
        }
      });
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

  // Filter and search expenses
  // When date filters are applied, use allExpenses (not the 1-month subset)
  // Otherwise, use the default 1-month expenses
  const filteredExpenses = useMemo(() => {
    // If date filter is applied, search from all expenses
    const sourceExpenses = (filters.fromDate || filters.toDate) ? allExpenses : expenses;
    if (!sourceExpenses) return [];

    return sourceExpenses.filter((expense) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDescription = expense.description?.toLowerCase().includes(query);
        const matchesAmount = expense.amount.toString().includes(query);
        const matchesCategory = expense.category?.toLowerCase().includes(query);
        const matchesFromAccount = expense.from_account?.toLowerCase().includes(query);
        const matchesToAccount = expense.to_account?.toLowerCase().includes(query);
        
        if (!matchesDescription && !matchesAmount && !matchesCategory && !matchesFromAccount && !matchesToAccount) {
          return false;
        }
      }

      // Date filters - use transaction date
      // Normalize dates to YYYY-MM-DD strings for comparison to avoid timezone issues
      // If only fromDate is given, filter from that date to today
      // If only toDate is given without fromDate, skip the date filter (show validation in UI) but continue with other filters
      if (filters.fromDate) {
        // Extract just the date part (YYYY-MM-DD) for comparison
        const expenseDateStr = expense.date.split('T')[0];
        const fromDateStr = filters.fromDate;
        
        if (expenseDateStr < fromDateStr) {
          return false;
        }
        
        // If only fromDate is provided (no toDate), filter up to today
        if (!filters.toDate) {
          const todayStr = new Date().toISOString().split('T')[0];
          if (expenseDateStr > todayStr) {
            return false;
          }
        }
      }

      // Only apply toDate filter when fromDate is also provided
      if (filters.toDate && filters.fromDate) {
        const expenseDateStr = expense.date.split('T')[0];
        const toDateStr = filters.toDate;
        
        if (expenseDateStr > toDateStr) {
          return false;
        }
      }
      // Note: If only toDate is provided without fromDate, we skip the date filter entirely
      // and show a validation message in the UI

      // Account filters
      if (filters.fromAccount) {
        const query = filters.fromAccount.toLowerCase();
        if (!expense.from_account?.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (filters.toAccount) {
        const query = filters.toAccount.toLowerCase();
        if (!expense.to_account?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && filters.category !== expense.category) {
        return false;
      }

      // Type filter
      if (filters.type && filters.type !== expense.type) {
        return false;
      }

      return true;
    });
  }, [allExpenses, expenses, searchQuery, filters]);

  // Clear filters function
  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      fromDate: "",
      toDate: "",
      fromAccount: "",
      toAccount: "",
      category: "",
      type: ""
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || filters.fromDate || filters.toDate || filters.fromAccount || filters.toAccount || filters.category || filters.type;

  // Helper to format date as YYYY-MM-DD in local timezone (not UTC)
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date picker handlers - use local date formatting to avoid timezone issues
  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      const dateString = formatLocalDate(selectedDate);
      setFilters(prev => ({ ...prev, fromDate: dateString }));
    }
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      const dateString = formatLocalDate(selectedDate);
      setFilters(prev => ({ ...prev, toDate: dateString }));
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const { totalIncome, totalExpense, accountBalance, pendingRepayment } = useMemo(() => {
    let income = 0;
    let expense = 0;

    // Calculate income and expense from ALL expenses data (not filtered) for accurate KPI values
    if (allExpenses) {
      allExpenses.forEach((t) => {
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
  }, [allExpenses, accountBalances, repayments]);

  // Use the closing_balance directly from the database view (already calculated correctly)
  const expensesWithRunningBalance = useMemo(() => {
    if (!filteredExpenses) return [];
    
    // Sort by date descending (newest first) for display
    // closing_balance is already provided by the database view and is accurate
    return [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses]);

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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#4a5568' : BRAND_MAROON} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load expenses</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Manual Refresh Button 
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginHorizontal: 16, marginTop: 16 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#4a5568' : BRAND_MAROON, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 }}
          onPress={handleManualRefresh}
          disabled={isRefreshing}
          activeOpacity={0.8}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Refresh</Text>
        </TouchableOpacity>
      </View>*/}
      
      {/* Search and Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search expenses..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Manual Refresh Button */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface, marginRight: 8 }]}
          onPress={handleManualRefresh}
          disabled={isRefreshing}
          activeOpacity={0.8}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={isDark ? '#6366f1' : BRAND_MAROON} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="refresh" size={20} color={isDark ? '#6366f1' : BRAND_MAROON} />
          )}
        </TouchableOpacity>

        {/* Filter Toggle Button */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={showFilters ? "filter" : "filter-outline"} 
            size={20} 
            color={hasActiveFilters ? (isDark ? '#4a5568' : BRAND_MAROON) : colors.textSecondary} 
          />
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {[filters.fromDate, filters.toDate, filters.fromAccount, filters.toAccount, filters.category, filters.type].filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Date Range */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>From Date</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowFromDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.dateIcon} />
                <Text style={[
                  styles.datePickerText,
                  { color: colors.text },
                  !filters.fromDate && { color: colors.textSecondary }
                ]}>
                  {formatDisplayDate(filters.fromDate)}
                </Text>
                {filters.fromDate && (
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, fromDate: '' }))}
                    style={styles.clearDateButton}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>To Date</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton, 
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  (filters.toDate && !filters.fromDate) && { borderColor: WARNING_ORANGE }
                ]}
                onPress={() => setShowToDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} style={styles.dateIcon} />
                <Text style={[
                  styles.datePickerText,
                  { color: colors.text },
                  !filters.toDate && { color: colors.textSecondary }
                ]}>
                  {formatDisplayDate(filters.toDate)}
                </Text>
                {filters.toDate && (
                  <TouchableOpacity 
                    onPress={() => setFilters(prev => ({ ...prev, toDate: '' }))}
                    style={styles.clearDateButton}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {filters.toDate && !filters.fromDate && (
                <Text style={styles.dateValidationText}>Please select From Date</Text>
              )}
            </View>

            {/* Account Filters */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>From Account</Text>
              <TextInput
                style={[styles.filterInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Account name..."
                placeholderTextColor={colors.textSecondary}
                value={filters.fromAccount}
                onChangeText={(text) => setFilters(prev => ({ ...prev, fromAccount: text }))}
              />
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>To Account</Text>
              <TextInput
                style={[styles.filterInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="Account name..."
                placeholderTextColor={colors.textSecondary}
                value={filters.toAccount}
                onChangeText={(text) => setFilters(prev => ({ ...prev, toAccount: text }))}
              />
            </View>

            {/* Category Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                {['All', 'Office', 'Event', 'Asset'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      (category === 'All' ? !filters.category : filters.category === category) && { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON, borderColor: isDark ? '#4a5568' : BRAND_MAROON }
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      category: category === 'All' ? '' : category 
                    }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      { color: colors.text },
                      (category === 'All' ? !filters.category : filters.category === category) && { color: '#ffffff' }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Type Filter */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                {['All', 'Credit', 'Debit'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      (type === 'All' ? !filters.type : filters.type === type) && { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON, borderColor: isDark ? '#4a5568' : BRAND_MAROON }
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      type: type === 'All' ? '' : type 
                    }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      { color: colors.text },
                      (type === 'All' ? !filters.type : filters.type === type) && { color: '#ffffff' }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <TouchableOpacity style={[styles.clearFiltersButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]} onPress={clearFilters}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}

          {/* Results Count */}
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            Showing {expensesWithRunningBalance?.length || 0} of {expenses?.length || 0} expenses
          </Text>
        </View>
      )}

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={filters.fromDate ? new Date(filters.fromDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onFromDateChange}
          maximumDate={filters.toDate ? new Date(filters.toDate) : new Date()}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={filters.toDate ? new Date(filters.toDate) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onToDateChange}
          minimumDate={filters.fromDate ? new Date(filters.fromDate) : undefined}
          maximumDate={new Date()}
        />
      )}

      {/* Expenses List */}
      <FlatList
        data={expensesWithRunningBalance?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}
          >
            <View style={styles.expenseHeader}>
              <View style={styles.expenseIconSection}>
                <View style={[
                  styles.expenseIconContainer,
                  { backgroundColor: item.type === 'Credit' ? 'rgba(0, 184, 148, 0.15)' : 
                                   item.type === 'Debit' ? 'rgba(225, 112, 85, 0.15)' : 
                                   'rgba(253, 203, 110, 0.15)' }
                ]}>
                  <Ionicons 
                    name={item.type === 'Credit' ? 'arrow-down-circle-outline' : 
                          item.type === 'Debit' ? 'arrow-up-circle-outline' : 
                          'swap-horizontal-outline'}
                    size={22} 
                    color={item.type === 'Credit' ? SUCCESS_GREEN : 
                           item.type === 'Debit' ? DANGER_RED : WARNING_ORANGE}
                  />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseDescription, { color: colors.text }]}>{item.description}</Text>
                  <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>{item.category}</Text>
                  <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.amountSection}>
                <Text style={[
                  styles.expenseAmount, 
                  { color: item.type === 'Credit' ? SUCCESS_GREEN : DANGER_RED }
                ]}>
                  {item.type === 'Credit' ? '+' : '-'}₹{parseFloat(item.amount as any).toLocaleString()}
                </Text>
                <Text style={[styles.closingBalance, { color: colors.textSecondary }]}>
                  Closing Balance: ₹{parseFloat((item as any).closing_balance || '0').toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color={DANGER_RED} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={DANGER_RED} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.expenseFooter, { borderTopColor: colors.border }]}>
              <View style={styles.accountFlow}>
                <Ionicons name="card-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.expenseAccount, { color: colors.textSecondary }]}>
                  {item.to_account ? `${item.from_account} → ${item.to_account}` : item.from_account}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
            {hasActiveFilters ? (
              <>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No matching expenses</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Try adjusting your search or filters</Text>
                <TouchableOpacity 
                  style={[styles.clearFiltersButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
                  onPress={clearFilters}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No expenses yet</Text>
                <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Tap + to add your first expense</Text>
              </>
            )}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
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
          <View style={[styles.confirmationBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Expense</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              {expenseToDelete && ((expenseToDelete as any).eventId || (expenseToDelete as any).rentalId) ? (
                <>
                  This expense is linked with {(expenseToDelete as any).eventId ? 'an event' : 'a rental service'}. 
                  {'\n\n'}
                  Deleting this expense will unlink it from the {(expenseToDelete as any).eventId ? 'event' : 'rental service'} and permanently remove the expense record.
                  {'\n\n'}
                  Do you really want to delete this linked expense?
                </>
              ) : (
                'Are you sure you want to delete this expense?'
              )}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f1f3f4' }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#d1d5db' : NEUTRAL_GRAY }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>
                  {expenseToDelete && ((expenseToDelete as any).eventId || (expenseToDelete as any).rentalId) ? 'Delete & Unlink' : 'Delete'}
                </Text>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 160,
    backgroundColor: '#ffffff',
    padding: 35,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: BRAND_GOLD,
  },
  repaymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: DANGER_RED,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: SUCCESS_GREEN,
  },
  expenseCardStyle: {
    borderLeftWidth: 4,
    borderLeftColor: DANGER_RED,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardLabel: {
    fontSize: 10,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  expenseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  expenseIconSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  expenseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 22,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 44,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  closingBalance: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  accountFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseAccount: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: 'rgba(225, 112, 85, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
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
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderRadius: 12,
  },
  deleteConfirmButton: {
    backgroundColor: DANGER_RED,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Search and Filter Styles
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PREMIUM_DARK,
    fontWeight: '500',
  },
  filterButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterGroup: {
    marginRight: 20,
    minWidth: 140,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: NEUTRAL_GRAY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: PREMIUM_DARK,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryFilter: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  categoryChipActive: {
    backgroundColor: BRAND_MAROON,
    borderColor: BRAND_MAROON,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUTRAL_GRAY,
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_MAROON,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsText: {
    textAlign: 'center',
    fontSize: 12,
    color: NEUTRAL_GRAY,
    marginTop: 12,
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    minWidth: 140,
  },
  dateIcon: {
    marginRight: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: PREMIUM_DARK,
    fontWeight: '500',
  },
  datePickerPlaceholder: {
    color: NEUTRAL_GRAY,
  },
  clearDateButton: {
    padding: 4,
  },
  dateValidationText: {
    color: '#fdcb6e',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
