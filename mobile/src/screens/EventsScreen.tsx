import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert, RefreshControl, TextInput, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useEvents, useExpenses } from '../hooks/useApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Event } from '../types';
import AddEventModal from '../components/AddEventModal';
import { EventsStackParamList } from '../navigation/EventsStackNavigator';
import { useTheme } from '../contexts';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

const BRAND_MAROON = '#800020';

// Helper function to get last 3 months range for events
const getLast3MonthsRange = () => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: threeMonthsAgo.toISOString().split('T')[0],
    endDate: endOfCurrentMonth.toISOString().split('T')[0]
  };
};

export default function EventsScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const last3MonthsRange = useMemo(getLast3MonthsRange, []);
  const { data: events, isLoading, error, refetch } = useEvents(last3MonthsRange);
  const { data: expenses } = useExpenses();
  
  // Create a Set of eventIds that have linked expenses (for showing checkmarks)
  const eventsWithLinkedExpenses = useMemo(() => {
    if (!expenses) return new Set<string>();
    return new Set(
      expenses
        .filter(exp => exp.eventId != null)
        .map(exp => String(exp.eventId))
    );
  }, [expenses]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState(new Date());
  const [endDateObj, setEndDateObj] = useState(new Date());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const queryClient = useQueryClient();

  // Filter functions
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    return events.filter(event => {
      // Text search (event name, venue, service)
      const matchesSearch = !searchText || 
        event.eventName.toLowerCase().includes(searchText.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchText.toLowerCase()) ||
        event.providedService.toLowerCase().includes(searchText.toLowerCase());
      
      const eventDate = new Date(event.eventDate);
      
      // Date range filter
      let matchesDateFilter = true;
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        matchesDateFilter = eventDate >= start && eventDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        matchesDateFilter = eventDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        matchesDateFilter = eventDate <= end;
      }
      
      return matchesSearch && matchesDateFilter;
    }).sort((a, b) => {
      // Sort by eventDate (latest first)
      const aDate = new Date(a.eventDate);
      const bDate = new Date(b.eventDate);
      return bDate.getTime() - aDate.getTime();
    });
  }, [events, searchText, startDate, endDate]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setStartDate('');
    setEndDate('');
    setStartDateObj(new Date());
    setEndDateObj(new Date());
  };
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (startDate || endDate) count++;
    return count;
  }, [searchText, startDate, endDate]);
  
  // Get available years from events
  const availableYears = useMemo(() => {
    if (!events) return [];
    const years = [...new Set(events.map(event => new Date(event.eventDate).getFullYear()))];
    return years.sort((a, b) => b - a); // Latest first
  }, [events]);
  
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setShowDeleteConfirm(false);
      setEventToDelete(null);
      Alert.alert('Success', 'Event deleted successfully!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete event: ${error.message}`);
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    },
  });

  const handleViewDetails = (event: Event) => {
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleDelete = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!eventToDelete) return;
    deleteMutation.mutate(eventToDelete.id);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleViewDetails(item)}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventName, { color: colors.text }]}>{item.eventName}</Text>
          {item.providedService && (
            <View style={[styles.serviceBadge, { backgroundColor: isDark ? '#374151' : '#e0e7ff' }]}>
              <Text style={[styles.serviceBadgeText, { color: isDark ? colors.primary : '#4338ca' }]}>{item.providedService}</Text>
            </View>
          )}
        </View>
        <View style={styles.statusWrapper}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, getStatusColor(item.eventStatus)]}>
              <Text style={styles.statusText}>{item.eventStatus}</Text>
            </View>
            {eventsWithLinkedExpenses.has(item.id) && (
              <View style={[styles.linkedExpenseIndicator, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons name="checkmark-circle" size={16} color={isDark ? '#4ade80' : '#22c55e'} />
              </View>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(128, 0, 32, 0.1)' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.eventName}`}
            >
              <Ionicons name="create-outline" size={20} color={isDark ? '#6366f1' : BRAND_MAROON} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.eventName}`}
              style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)' }]}
            >
              <Ionicons name="trash-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <Text style={[styles.venueText, { color: colors.textSecondary }]}>📍 {item.venue}</Text>
      <Text style={[styles.dateText, { color: colors.textSecondary }]}>📅 {new Date(item.eventDate).toLocaleDateString()}</Text>
      
      {item.clientName && (
        <Text style={[styles.clientText, { color: colors.textSecondary }]}>👤 {item.clientName}</Text>
      )}
      
      {item.finalizedQuote && (
        <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Quote:</Text>
          <Text style={[styles.priceValue, { color: isDark ? '#4ade80' : '#10b981' }]}>₹{parseFloat(item.finalizedQuote).toLocaleString()}</Text>
        </View>
      )}
      {item.discount_amount && parseFloat(item.discount_amount) > 0 && (
        <View style={styles.discountRow}>
          <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>Discount:</Text>
          <Text style={[styles.discountValue, { color: isDark ? '#f87171' : '#ef4444' }]}>₹{parseFloat(item.discount_amount).toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load events</Text>
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
              placeholder="Search events by name, venue, or service..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Toggle Button */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={filtersExpanded ? "filter" : "filter-outline"} 
            size={20} 
            color={activeFiltersCount > 0 ? (isDark ? '#6366f1' : BRAND_MAROON) : colors.textSecondary} 
          />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }]}>
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

          {/* Clear All Filters Button */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={[styles.clearAllButton, { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }]}>
              <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={[styles.clearAllButtonText, { color: '#ffffff' }]}>Clear All Filters ({activeFiltersCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {events?.length === 0 
                ? 'No events found' 
                : 'No events match your filters'
              }
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={[styles.clearAllButton, { backgroundColor: isDark ? '#6366f1' : BRAND_MAROON }]}>
                <Text style={[styles.clearAllButtonText, { color: '#ffffff' }]}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Delete Event?</Text>
            <Text style={[styles.warningText, { color: colors.error }]}>⚠️ This action cannot be undone!</Text>
            <Text style={[styles.confirmationMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete "{eventToDelete?.eventName}"?
            </Text>
            <View style={[styles.deletionInfo, { backgroundColor: colors.background }]}>
              <Text style={[styles.deletionInfoTitle, { color: colors.text }]}>This will permanently delete:</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.textSecondary }]}>• The event and all its information</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.textSecondary }]}>• All requirements</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.textSecondary }]}>• All associated fulfillment plans</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.textSecondary }]}>• All related invoicing data</Text>
            </View>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddEventModal
        visible={modalVisible}
        onClose={handleCloseModal}
        event={selectedEvent}
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return { backgroundColor: '#d1fae5', borderColor: '#10b981' };
    case 'In Progress':
      return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
    case 'Draft':
      return { backgroundColor: '#e5e7eb', borderColor: '#6b7280' };
    default:
      return { backgroundColor: '#dbeafe', borderColor: '#2563eb' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  eventInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusWrapper: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkedExpenseIndicator: {
    padding: 4,
    borderRadius: 12,
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceText: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 6,
    fontWeight: '500',
  },
  venueText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
  },
  clientText: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  discountLabel: {
    fontSize: 14,
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationBox: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  deletionInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  deletionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  deletionInfoItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
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
    flexGrow: 0,
  },
  filterGroup: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  filterTypeSection: {
    marginBottom: 16,
    overflow: 'visible',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    minHeight: 52,
  },
  dateIcon: {
    marginRight: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },

  clearAllButton: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  clearAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});