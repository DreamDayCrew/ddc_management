import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, Alert, RefreshControl, TextInput, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useEvents } from '../hooks/useApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Event } from '../types';
import AddEventModal from '../components/AddEventModal';
import { EventsStackParamList } from '../navigation/EventsStackNavigator';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventsList'>;

const BRAND_MAROON = '#800020';

export default function EventsScreen({ navigation }: Props) {
  const { data: events, isLoading, error, refetch } = useEvents();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
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
      
      // Use either year/month filters OR date range filters, not both
      let matchesDateFilter = true;
      
      if (startDate || endDate) {
        // Use date range filter
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          matchesDateFilter = eventDate >= start && eventDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          matchesDateFilter = eventDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          matchesDateFilter = eventDate <= end;
        }
      } else {
        // Use year/month filters
        const matchesYear = !selectedYear || eventDate.getFullYear().toString() === selectedYear;
        const matchesMonth = !selectedMonth || eventDate.getMonth().toString() === selectedMonth;
        matchesDateFilter = matchesYear && matchesMonth;
      }
      
      return matchesSearch && matchesDateFilter;
    });
  }, [events, searchText, selectedYear, selectedMonth, startDate, endDate]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setSelectedYear('');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    setStartDateObj(new Date());
    setEndDateObj(new Date());
  };
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchText) count++;
    if (selectedYear) count++;
    if (selectedMonth) count++;
    if (startDate || endDate) count++;
    return count;
  }, [searchText, selectedYear, selectedMonth, startDate, endDate]);
  
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
    <TouchableOpacity style={styles.eventCard} onPress={() => handleViewDetails(item)}>
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{item.eventName}</Text>
          {item.providedService && (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>{item.providedService}</Text>
            </View>
          )}
        </View>
        <View style={styles.statusWrapper}>
          <View style={[styles.statusBadge, getStatusColor(item.eventStatus)]}>
            <Text style={styles.statusText}>{item.eventStatus}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.eventName}`}
            >
              <Ionicons name="create-outline" size={20} color={BRAND_MAROON} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.eventName}`}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <Text style={styles.venueText}>📍 {item.venue}</Text>
      <Text style={styles.dateText}>📅 {new Date(item.eventDate).toLocaleDateString()}</Text>
      
      {item.clientName && (
        <Text style={styles.clientText}>👤 {item.clientName}</Text>
      )}
      
      {item.finalizedQuote && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Quote:</Text>
          <Text style={styles.priceValue}>₹{parseFloat(item.finalizedQuote).toLocaleString()}</Text>
        </View>
      )}
      {item.discount_amount && parseFloat(item.discount_amount) > 0 && (
        <View style={styles.discountRow}>
          <Text style={styles.discountLabel}>Discount:</Text>
          <Text style={styles.discountValue}>₹{parseFloat(item.discount_amount).toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={styles.errorText}>Failed to load events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <TouchableOpacity 
          style={styles.filterHeader}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
        >
          <View style={styles.filterHeaderContent}>
            <Ionicons name="options" size={18} color={BRAND_MAROON} style={styles.filterHeaderIcon} />
            <Text style={styles.filterTitle}>Search & Filters</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={filtersExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={BRAND_MAROON} 
          />
        </TouchableOpacity>
        
        {filtersExpanded && (
          <View style={styles.filterContent}>
            {/* Search by text */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by event name, venue, or service..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#9ca3af"
              />
              {searchText && (
                <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

        {/* Year/Month Filter */}
        <View style={styles.filterTypeSection}>
          <Text style={styles.filterTypeLabel}>Quick Date Filters:</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <TouchableOpacity 
                style={styles.filterDropdown}
                onPress={() => setShowYearDropdown(!showYearDropdown)}
              >
                <Ionicons name="calendar" size={16} color="#6b7280" style={styles.filterIcon} />
                <Text style={styles.filterText}>
                  {selectedYear || 'Year'}
                </Text>
                <Ionicons 
                  name={showYearDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showYearDropdown && (
                <Modal
                  transparent={true}
                  visible={showYearDropdown}
                  animationType="fade"
                  onRequestClose={() => setShowYearDropdown(false)}
                >
                  <TouchableOpacity 
                    style={styles.dropdownModalOverlay} 
                    onPress={() => setShowYearDropdown(false)}
                  >
                    <View style={[styles.modalDropdownList, { top: 320 }]}>
                      <ScrollView style={styles.dropdownScroll}>
                        <TouchableOpacity 
                          style={[styles.dropdownItem, !selectedYear && styles.selectedDropdownItem]}
                          onPress={() => {
                            setSelectedYear('');
                            setShowYearDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, !selectedYear && styles.selectedDropdownItemText]}>
                            All Years
                          </Text>
                        </TouchableOpacity>
                        {availableYears.map((year) => (
                          <TouchableOpacity 
                            key={year}
                            style={[styles.dropdownItem, selectedYear === year.toString() && styles.selectedDropdownItem]}
                            onPress={() => {
                              setSelectedYear(year.toString());
                              setShowYearDropdown(false);
                              // Clear date range when using year filter
                              setStartDate('');
                              setEndDate('');
                            }}
                          >
                            <Text style={[styles.dropdownItemText, selectedYear === year.toString() && styles.selectedDropdownItemText]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
            </View>

            {/* Month Filter */}
            <View style={styles.filterItem}>
              <TouchableOpacity 
                style={styles.filterDropdown}
                onPress={() => setShowMonthDropdown(!showMonthDropdown)}
              >
                <Ionicons name="time" size={16} color="#6b7280" style={styles.filterIcon} />
                <Text style={styles.filterText}>
                  {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : 'Month'}
                </Text>
                <Ionicons 
                  name={showMonthDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {showMonthDropdown && (
                <Modal
                  transparent={true}
                  visible={showMonthDropdown}
                  animationType="fade"
                  onRequestClose={() => setShowMonthDropdown(false)}
                >
                  <TouchableOpacity 
                    style={styles.dropdownModalOverlay} 
                    onPress={() => setShowMonthDropdown(false)}
                  >
                    <View style={[styles.modalDropdownList, { top: 320, left: '50%' }]}>
                      <ScrollView style={styles.dropdownScroll}>
                        <TouchableOpacity 
                          style={[styles.dropdownItem, !selectedMonth && styles.selectedDropdownItem]}
                          onPress={() => {
                            setSelectedMonth('');
                            setShowMonthDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, !selectedMonth && styles.selectedDropdownItemText]}>
                            All Months
                          </Text>
                        </TouchableOpacity>
                        {months.map((month) => (
                          <TouchableOpacity 
                            key={month.value}
                            style={[styles.dropdownItem, selectedMonth === month.value && styles.selectedDropdownItem]}
                            onPress={() => {
                              setSelectedMonth(month.value);
                              setShowMonthDropdown(false);
                              // Clear date range when using month filter
                              setStartDate('');
                              setEndDate('');
                            }}
                          >
                            <Text style={[styles.dropdownItemText, selectedMonth === month.value && styles.selectedDropdownItemText]}>
                              {month.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
            </View>
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>Date Range:</Text>
          <View style={styles.dateInputs}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>From:</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  setShowStartDatePicker(true);
                  setShowYearDropdown(false);
                  setShowMonthDropdown(false);
                }}
              >
                <Ionicons name="calendar" size={16} color="#6b7280" style={styles.dateIcon} />
                <Text style={styles.datePickerText}>
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
                      
                      // Clear year/month filters when using date range
                      setSelectedYear('');
                      setSelectedMonth('');
                    }
                  }}
                />
              )}
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateInputLabel}>To:</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, !startDate && styles.disabledDateButton]}
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
                  setShowYearDropdown(false);
                  setShowMonthDropdown(false);
                }}
              >
                <Ionicons name="calendar" size={16} color={!startDate ? "#9ca3af" : "#6b7280"} style={styles.dateIcon} />
                <Text style={[styles.datePickerText, !startDate && styles.disabledDateText]}>
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
                      // Clear year/month filters when using date range
                      setSelectedYear('');
                      setSelectedMonth('');
                    }
                  }}
                />
              )}
            </View>
          </View>
        </View>
        
        {/* Clear All Filters Button */}
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
            <Ionicons name="refresh" size={16} color="#6b7280" style={{ marginRight: 6 }} />
            <Text style={styles.clearAllButtonText}>Clear All Filters ({activeFiltersCount})</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>

      {/* Dropdown Overlays */}
      {(showYearDropdown || showMonthDropdown) && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowYearDropdown(false);
            setShowMonthDropdown(false);
          }}
        />
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
            <Ionicons name="search" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {events?.length === 0 
                ? 'No events found' 
                : 'No events match your filters'
              }
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
                <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
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
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Delete Event?</Text>
            <Text style={styles.warningText}>⚠️ This action cannot be undone!</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to delete "{eventToDelete?.eventName}"?
            </Text>
            <View style={styles.deletionInfo}>
              <Text style={styles.deletionInfoTitle}>This will permanently delete:</Text>
              <Text style={styles.deletionInfoItem}>• The event and all its information</Text>
              <Text style={styles.deletionInfoItem}>• All requirements</Text>
              <Text style={styles.deletionInfoItem}>• All associated fulfillment plans</Text>
              <Text style={styles.deletionInfoItem}>• All related invoicing data</Text>
            </View>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    color: '#1f2937',
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
  serviceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
  },
  serviceBadgeText: {
    fontSize: 12,
    color: '#4338ca',
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
    color: '#6b7280',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  clientText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: 'rgba(128, 0, 32, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 12,
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 24,
  },
  deletionInfo: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  deletionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  deletionInfoItem: {
    fontSize: 13,
    color: '#4b5563',
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
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#4b5563',
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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterHeaderIcon: {
    marginRight: 8,
  },
  filterBadge: {
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContent: {
    padding: 16,
    zIndex: 1000,
    position: 'relative',
    overflow: 'visible',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  filterTypeSection: {
    marginBottom: 16,
    overflow: 'visible',
  },
  filterTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    overflow: 'visible',
  },
  filterItem: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
    overflow: 'visible',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalDropdownList: {
    position: 'absolute',
    width: '40%',
    maxWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedDropdownItem: {
    backgroundColor: '#fef2f2',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1f2937',
  },
  selectedDropdownItemText: {
    fontWeight: '600',
    color: BRAND_MAROON,
  },
  dateRangeContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    zIndex: 1,
    backgroundColor: '#ffffff',
  },
  dateRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 48,
  },
  dateIcon: {
    marginRight: 8,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  disabledDateButton: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  disabledDateText: {
    color: '#9ca3af',
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  clearAllButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: BRAND_MAROON,
    borderRadius: 8,
  },
  clearAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});