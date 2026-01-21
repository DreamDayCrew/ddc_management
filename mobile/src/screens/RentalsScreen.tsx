import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Rental } from '../types';
import { useTheme } from '../contexts';
import { format } from 'date-fns';

const BRAND_MAROON = '#800020';


function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string, isDark: boolean) {
  switch (status.toLowerCase()) {
    case 'quote':
      return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: isDark ? '#93c5fd' : '#1e40af' };
    case 'invoice':
      return { bg: isDark ? '#78350f' : '#fef3c7', text: isDark ? '#fde68a' : '#d97706' };
    case 'paid':
      return { bg: isDark ? '#166534' : '#dcfce7', text: isDark ? '#86efac' : '#16a34a' };
    case 'returned':
      return { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#9ca3af' : '#6b7280' };
    default:
      return { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#9ca3af' : '#6b7280' };
  }
}

function getPaymentStatusColor(status: string, isDark: boolean) {
  switch (status.toLowerCase()) {
    case 'pending':
      return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: isDark ? '#fca5a5' : '#dc2626' };
    case 'partial':
      return { bg: isDark ? '#78350f' : '#fef3c7', text: isDark ? '#fde68a' : '#d97706' };
    case 'paid':
      return { bg: isDark ? '#166534' : '#dcfce7', text: isDark ? '#86efac' : '#16a34a' };
    default:
      return { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#9ca3af' : '#6b7280' };
  }
}

export default function RentalsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  
  const accentColor = isDark ? '#4a5568' : BRAND_MAROON;
  
  const { data: rentals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['rentals'],
    queryFn: () => api.getRentals(),
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredRentals = useMemo(() => {
    return rentals.filter(rental => {
      const matchesSearch = 
        rental.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rental.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (rental.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = !statusFilter || rental.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rentals, searchQuery, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRental(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      Alert.alert('Success', 'Service order deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete: ${error.message}`);
    },
  });

  const handleDelete = (rental: Rental) => {
    Alert.alert(
      'Delete Service Order',
      `Are you sure you want to delete the order for "${rental.customerName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(rental.id)
        },
      ]
    );
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const renderRentalItem = ({ item }: { item: Rental }) => {
    const statusColors = getStatusColor(item.status, isDark);
    const paymentColors = getPaymentStatusColor(item.paymentStatus, isDark);
    
    return (
      <TouchableOpacity 
        style={[styles.rentalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('RentalDetails', { id: item.id })}
      >
        <View style={styles.rentalHeader}>
          <View style={styles.customerInfo}>
            <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
            {item.customerPhone && (
              <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>{item.customerPhone}</Text>
            )}
          </View>
          <TouchableOpacity 
            onPress={() => handleDelete(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />
          </TouchableOpacity>
        </View>

        <View style={styles.rentalDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {format(new Date(item.rentalDate), 'dd MMM yyyy')}
            </Text>
          </View>
          {item.returnDate && (
            <View style={styles.detailRow}>
              <Ionicons name="return-down-forward-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Return: {format(new Date(item.returnDate), 'dd MMM yyyy')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rentalFooter}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.badgeText, { color: statusColors.text }]}>{item.status}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: paymentColors.bg }]}>
              <Text style={[styles.badgeText, { color: paymentColors.text }]}>{item.paymentStatus}</Text>
            </View>
          </View>
          <Text style={[styles.amount, { color: accentColor }]}>
            {formatIndianCurrency(Number(item.totalAmount || 0))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={accentColor} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading service orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={48} color={isDark ? '#f87171' : '#ef4444'} />
        <Text style={[styles.errorText, { color: colors.text }]}>Failed to load service orders</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: accentColor }]} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filter */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by customer name, phone, email..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity 
            style={[
              styles.filterChip, 
              { backgroundColor: colors.card, borderColor: colors.border },
              statusFilter && { backgroundColor: accentColor }
            ]}
            onPress={() => setShowStatusDropdown(true)}
          >
            <Text style={[
              styles.filterChipText, 
              { color: statusFilter ? '#fff' : colors.text }
            ]}>
              {statusFilter || 'All Status'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={statusFilter ? '#fff' : colors.text} />
          </TouchableOpacity>

          {(searchQuery || statusFilter) && (
            <TouchableOpacity 
              style={[styles.clearFilterChip, { borderColor: isDark ? '#f87171' : '#ef4444' }]}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color={isDark ? '#f87171' : '#ef4444'} />
              <Text style={[styles.clearFilterText, { color: isDark ? '#f87171' : '#ef4444' }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Rentals List */}
      {filteredRentals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery || statusFilter ? 'No service orders found' : 'No service orders yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Create your first service order'}
          </Text>
          {!searchQuery && !statusFilter && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: accentColor }]}
              onPress={() => navigation.navigate('RentalDetails')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>New Service Order</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          keyExtractor={(item) => item.id}
          renderItem={renderRentalItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: accentColor }]} 
        onPress={() => navigation.navigate('RentalDetails')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Status Dropdown Modal */}
      <Modal
        visible={showStatusDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Status</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleStatusChange('')}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Status</Text>
              {!statusFilter && <Ionicons name="checkmark" size={20} color={accentColor} />}
            </TouchableOpacity>
            {['Quote', 'Invoice', 'Paid', 'Returned'].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.dropdownItem}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                {statusFilter === status && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 14,
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  clearFilterText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  rentalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  rentalDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  rentalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  dropdownItemText: {
    fontSize: 16,
  },
});
