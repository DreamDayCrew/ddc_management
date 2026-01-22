import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView, TextInput, Modal, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Rental } from '../types';
import { useTheme } from '../contexts';
import { format } from 'date-fns';

const BRAND_MAROON = '#800020';

// Status constants matching EventsScreen for consistency
const RENTAL_STATUSES = ["Inquired", "In Progress", "Completed"];
const PAYMENT_STATUSES = ["Pending", "Partial", "Paid"];


function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: string, isDark: boolean) {
  switch (status.toLowerCase()) {
    case 'inquired':
      return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: isDark ? '#93c5fd' : '#1e40af' };
    case 'in progress':
      return { bg: isDark ? '#78350f' : '#fef3c7', text: isDark ? '#fde68a' : '#d97706' };
    case 'completed':
      return { bg: isDark ? '#166534' : '#dcfce7', text: isDark ? '#86efac' : '#16a34a' };
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

  const getExpenseIndicator = (paymentStatus: 'Paid' | 'Partial' | 'Pending' | string) => {
    switch (paymentStatus) {
      case 'Paid':
        return {
          icon: 'checkmark-done-circle-sharp',
          color: '#16a34a',
        };
      case 'Partial':
        return {
          icon: 'checkmark-circle',
          color: '#eab308',
        };
      default:
        return null;
    }
  };
  
  const { data: rentals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['rentals'],
    queryFn: () => api.getRentals(),
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  
  // Download state - matching EventsScreen pattern
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFilters, setDownloadFilters] = useState({
    rentalStatus: 'all',
    paymentStatus: 'all',
  });
  const [downloadOptions, setDownloadOptions] = useState({
    customerInfo: true,
    rentalInfo: true,
    paymentInfo: true,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  
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
      const matchesPaymentStatus = !paymentStatusFilter || rental.paymentStatus === paymentStatusFilter;
      
      // Date filtering
      let matchesDateRange = true;
      if (startDate && endDate) {
        const rentalDate = new Date(rental.rentalDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        matchesDateRange = rentalDate >= start && rentalDate <= end;
      }
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange;
    });
  }, [rentals, searchQuery, statusFilter, paymentStatusFilter, startDate, endDate]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (paymentStatusFilter) count++;
    if (startDate && endDate) count++;
    return count;
  }, [statusFilter, paymentStatusFilter, startDate, endDate]);

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
    setPaymentStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  const handleDownload = async () => {
    if (!Object.values(downloadOptions).some(Boolean)) {
      Alert.alert('Error', 'Please select at least one option to download');
      return;
    }

    setIsDownloading(true);
    
    try {
      const params = new URLSearchParams({
        customerInfo: downloadOptions.customerInfo.toString(),
        rentalInfo: downloadOptions.rentalInfo.toString(),
        paymentInfo: downloadOptions.paymentInfo.toString(),
        rentalStatus: downloadFilters.rentalStatus === 'all' ? '' : downloadFilters.rentalStatus,
        paymentStatus: downloadFilters.paymentStatus === 'all' ? '' : downloadFilters.paymentStatus,
        searchQuery,
        statusFilter,
        paymentStatusFilter,
        startDate,
        endDate,
      }).toString();
      
      // Use the same base URL logic as the API
      const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const downloadUrl = `${baseURL}/api/rentals/download?${params}`;
      
      console.log('Download URL:', downloadUrl);
      
      // Open the download URL
      await Linking.openURL(downloadUrl);
      
      setShowDownloadModal(false);
      Alert.alert('Success', 'Download started! Check your downloads folder.');
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download rentals data. Please check your internet connection.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleDownloadOption = (option: keyof typeof downloadOptions) => {
    setDownloadOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
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
            <View style={styles.customerNameRow}>
              <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
            </View>
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
      {/* Search and Filter Section */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Search Bar */}
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

        {/* Download Button */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface, marginRight: 8 }]}
          onPress={() => setShowDownloadModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Filter Toggle Button */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={filtersExpanded ? "filter" : "filter-outline"} 
            size={20} 
            color={activeFiltersCount > 0 ? (isDark ? '#6366f1' : accentColor) : colors.textSecondary} 
          />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: isDark ? '#6366f1' : accentColor }]}>
              <Text style={[styles.filterBadgeText, { color: '#ffffff' }]}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {filtersExpanded && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Date Range */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>From Date</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={16} color={colors.textSecondary} style={styles.dateIcon} />
              <Text style={[styles.datePickerText, { color: colors.text }]}>
                {startDate || 'Select date'}
              </Text>
            </TouchableOpacity>
            
            {showStartDatePicker && (
              <DateTimePicker
                value={startDateObj}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate?: Date) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setStartDateObj(selectedDate);
                    setStartDate(selectedDate.toISOString().split('T')[0]);
                    
                    // If end date is before or same as start date, clear it
                    if (endDateObj <= selectedDate) {
                      setEndDate('');
                      setEndDateObj(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)); // Next day
                    }
                  }
                }}
              />
            )}
          </View>
          
          {/* To Date */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>To Date</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }, !startDate && { backgroundColor: colors.background, opacity: 0.6 }]}
              disabled={!startDate}
              onPress={() => {
                if (!startDate) {
                  Alert.alert(
                    'Select Start Date First',
                    'Please select a start date before choosing an end date',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setShowEndDatePicker(true);
              }}
            >
              <Ionicons name="calendar" size={16} color={!startDate ? colors.textSecondary : colors.textSecondary} style={styles.dateIcon} />
              <Text style={[styles.datePickerText, { color: colors.text }, !startDate && { color: colors.textSecondary }]}>
                {endDate || 'Select date'}
              </Text>
            </TouchableOpacity>
            
            {showEndDatePicker && (
              <DateTimePicker
                value={endDateObj}
                mode="date"
                display="default"
                minimumDate={startDate ? new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000) : undefined}
                onChange={(event: any, selectedDate?: Date) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    // Ensure selected date is after start date
                    if (startDate && selectedDate <= startDateObj) {
                      Alert.alert(
                        'Invalid Date Range',
                        'End date must be after start date',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    
                    setEndDateObj(selectedDate);
                    setEndDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </View>

          {/* Status Filters */}
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Status</Text>
              <TouchableOpacity
                style={[styles.filterDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowStatusDropdown(true)}
              >
                <Text style={[styles.filterDropdownText, { color: colors.text }]}>
                  {statusFilter || 'All'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Payment Status</Text>
              <TouchableOpacity
                style={[styles.filterDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowPaymentStatusDropdown(true)}
              >
                <Text style={[styles.filterDropdownText, { color: colors.text }]}>
                  {paymentStatusFilter || 'All'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Clear All Filters Button */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={[styles.clearAllButton, { backgroundColor: isDark ? '#6366f1' : accentColor }]}>
              <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.clearAllButtonText, { color: '#ffffff' }]}>Clear All Filters ({activeFiltersCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rentals List */}
      {filteredRentals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery || statusFilter || paymentStatusFilter || (startDate && endDate) ? 'No service orders found' : 'No service orders yet'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery || statusFilter || paymentStatusFilter || (startDate && endDate) ? 'Try adjusting your filters' : 'Create your first service order'}
          </Text>
          {!searchQuery && !statusFilter && !paymentStatusFilter && !(startDate && endDate) && (
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
            {RENTAL_STATUSES.map((status) => (
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

      {/* Payment Status Dropdown Modal */}
      <Modal
        visible={showPaymentStatusDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentStatusDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaymentStatusDropdown(false)}
        >
          <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text }]}>Select Payment Status</Text>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setPaymentStatusFilter('');
                setShowPaymentStatusDropdown(false);
              }}
            >
              <Text style={[styles.dropdownItemText, { color: colors.text }]}>All Payment Status</Text>
              {!paymentStatusFilter && <Ionicons name="checkmark" size={20} color={accentColor} />}
            </TouchableOpacity>
            {PAYMENT_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.dropdownItem}
                onPress={() => {
                  setPaymentStatusFilter(status);
                  setShowPaymentStatusDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                {paymentStatusFilter === status && <Ionicons name="checkmark" size={20} color={accentColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Download Modal */}
      <Modal
        visible={showDownloadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDownloadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.downloadModalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.downloadModalHeader}>
              <Text style={[styles.downloadModalTitle, { color: colors.text }]}>Download Rental Services Report</Text>
              <TouchableOpacity onPress={() => setShowDownloadModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.downloadOptionsContainer}>
              <Text style={[styles.downloadSectionTitle, { color: colors.text }]}>Filter Rental</Text>
              
              {/* Rental Status Picker */}
              <Text style={[styles.downloadPickerLabel, { color: colors.textSecondary }]}>Rental Status</Text>
              <View style={[styles.downloadPickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.downloadPickerOption,
                      downloadFilters.rentalStatus === 'all' && { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }
                    ]}
                    onPress={() => setDownloadFilters(prev => ({ ...prev, rentalStatus: 'all' }))}
                  >
                    <Text style={[
                      styles.downloadPickerOptionText,
                      { color: downloadFilters.rentalStatus === 'all' ? '#fff' : colors.text }
                    ]}>All</Text>
                  </TouchableOpacity>
                  {RENTAL_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.downloadPickerOption,
                        downloadFilters.rentalStatus === status && { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }
                      ]}
                      onPress={() => setDownloadFilters(prev => ({ ...prev, rentalStatus: status }))}
                    >
                      <Text style={[
                        styles.downloadPickerOptionText,
                        { color: downloadFilters.rentalStatus === status ? '#fff' : colors.text }
                      ]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Payment Status Picker */}
              <Text style={[styles.downloadPickerLabel, { color: colors.textSecondary }]}>Payment Status</Text>
              <View style={[styles.downloadPickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.downloadPickerOption,
                      downloadFilters.paymentStatus === 'all' && { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }
                    ]}
                    onPress={() => setDownloadFilters(prev => ({ ...prev, paymentStatus: 'all' }))}
                  >
                    <Text style={[
                      styles.downloadPickerOptionText,
                      { color: downloadFilters.paymentStatus === 'all' ? '#fff' : colors.text }
                    ]}>All</Text>
                  </TouchableOpacity>
                  {PAYMENT_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.downloadPickerOption,
                        downloadFilters.paymentStatus === status && { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }
                      ]}
                      onPress={() => setDownloadFilters(prev => ({ ...prev, paymentStatus: status }))}
                    >
                      <Text style={[
                        styles.downloadPickerOptionText,
                        { color: downloadFilters.paymentStatus === status ? '#fff' : colors.text }
                      ]}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            
              {/* Include Options */}
              <Text style={[styles.downloadSectionTitle, { color: colors.text, marginTop: 16 }]}>Include Information</Text>
              <Text style={[styles.downloadHelperText, { color: colors.textSecondary }]}>
                Rental ID are always included.
              </Text>

              <TouchableOpacity 
                style={styles.downloadCheckboxRow}
                onPress={() => toggleDownloadOption('customerInfo')}
              >
                <View style={styles.downloadOptionLeft}>
                  <View style={[styles.checkbox, { borderColor: colors.border }, downloadOptions.customerInfo && { backgroundColor: accentColor }]}>
                    {downloadOptions.customerInfo && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={[styles.downloadCheckboxLabel, { color: colors.text }]}>Customer Information</Text>
                </View>
                <Text style={[styles.downloadOptionDesc, { color: colors.textSecondary }]}>Name, phone, email</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.downloadCheckboxRow}
                onPress={() => toggleDownloadOption('rentalInfo')}
              >
                <View style={styles.downloadOptionLeft}>
                  <View style={[styles.checkbox, { borderColor: colors.border }, downloadOptions.rentalInfo && { backgroundColor: accentColor }]}>
                    {downloadOptions.rentalInfo && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={[styles.downloadCheckboxLabel, { color: colors.text }]}>Rental Information</Text>
                </View>
                <Text style={[styles.downloadOptionDesc, { color: colors.textSecondary }]}>Dates, items, quantities</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.downloadCheckboxRow}
                onPress={() => toggleDownloadOption('paymentInfo')}
              >
                <View style={styles.downloadOptionLeft}>
                  <View style={[styles.checkbox, { borderColor: colors.border }, downloadOptions.paymentInfo && { backgroundColor: accentColor }]}>
                    {downloadOptions.paymentInfo && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                  <Text style={[styles.downloadCheckboxLabel, { color: colors.text }]}>Payment Information</Text>
                </View>
                <Text style={[styles.downloadOptionDesc, { color: colors.textSecondary }]}>Amounts, payment dates</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <View style={styles.downloadModalFooter}>
              <TouchableOpacity 
                style={[styles.downloadCancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowDownloadModal(false)}
              >
                <Text style={[styles.downloadCancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.downloadButton, { backgroundColor: accentColor }]}
                onPress={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </>
                )}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
    paddingVertical: 8,
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
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minWidth: 100,
  },
  filterDropdownText: {
    fontSize: 14,
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  dateIcon: {
    marginRight: 8,
  },
  datePickerText: {
    fontSize: 14,
    flex: 1,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatusIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
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
  // Download Modal Styles
  downloadModalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  downloadModalBox: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  downloadModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  downloadModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  downloadModalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  downloadOptionsContainer: {
    maxHeight: 400,
    padding: 20,
  },
  downloadSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  downloadPickerLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  downloadPickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  downloadPickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  downloadPickerOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  downloadHelperText: {
    fontSize: 12,
    marginBottom: 12,
  },
  downloadOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  downloadCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  downloadOptionDesc: {
    fontSize: 12,
    marginLeft: 32,
  },
  downloadCheckboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  downloadModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  downloadCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
