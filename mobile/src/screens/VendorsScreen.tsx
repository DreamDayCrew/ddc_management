import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, TextInput, RefreshControl, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Vendor } from '../types';
import AddVendorModal from '../components/AddVendorModal';
import { useConfiguration } from '../hooks/useApi';
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';

export default function VendorsScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  // Filter states
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor'] });
      Alert.alert('Success', 'Vendor deleted successfully');
    },
    onError: (error: any) => {
      const respData = error?.response?.data ?? {};
      const msg: string = respData.error || respData.message || error?.message || '';
      const planName: string | undefined =
        respData.planName ||
        respData.plan?.name ||
        respData.plan_name ||
        respData.plan?.planName;

      const isPlanConstraint =
        typeof msg === 'string' &&
        (msg.includes('fulfillment_plans') ||
          msg.includes('plan') ||
          msg.includes('constraint'));

      if (isPlanConstraint) {
        const planText = planName ? ` (${planName})` : '';
        Alert.alert(
          'Cannot Delete Vendor',
          `Vendor is linked with a Plan${planText}. Delete or unlink the vendor from the plan to delete this vendor.`
        );
        return;
      }

      Alert.alert('Error', `Failed to delete vendor: ${msg || 'Unknown error'}`);
    },
  });

  const deleteVendor = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });

  const handleDelete = (vendor: Vendor) => {
    console.log('Delete button clicked for vendor:', vendor);
    setVendorToDelete(vendor);
    setShowDeleteConfirm(true);
  };

    const confirmDelete = () => {
    if (!vendorToDelete) return;
    console.log('Deleting vendor with ID:', vendorToDelete.id);
    deleteMutation.mutate(vendorToDelete.id);
    setShowDeleteConfirm(false);
    setVendorToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setVendorToDelete(null);
  };

  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
  });

  // Filter vendors based on search and category
  const filteredVendors = useMemo(() => {
    return vendors?.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesCategory = !selectedCategory || vendor.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      // Sort by id or creation order (latest first)
      return b.id.localeCompare(a.id);
    }) || [];
  }, [vendors, searchName, selectedCategory]);

  // Clear all filters
  const clearFilters = () => {
    setSearchName('');
    setSelectedCategory('');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchName) count++;
    if (selectedCategory) count++;
    return count;
  }, [searchName, selectedCategory]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedVendor(null);
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity 
      style={[styles.vendorCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={() => handleEdit(item)}
      data-testid={`vendor-card-${item.id}`}
    >
      <View style={styles.vendorHeader}>
        <View style={[styles.vendorIconContainer, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }]}>
          <Ionicons name="business" size={24} color={isDark ? '#e2e8f0' : BRAND_MAROON} />
        </View>
        <View style={styles.vendorInfo}>
          <Text style={[styles.vendorName, { color: colors.text }]}>{item.name}</Text>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? '#374151' : '#e0e7ff' }]}>
              <Text style={[styles.categoryBadgeText, { color: isDark ? '#d1d5db' : '#4338ca' }]}>{item.category}</Text>
            </View>
          )}
        </View>
        {item.rating !== null && item.rating !== undefined && item.rating > 0 && (
          <View style={styles.ratingWrapper}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            <TouchableOpacity
              style={[styles.vendorDeleteButton, { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.1)' }]}
               onPress={(e) => {
                e.stopPropagation(); // Prevent event bubbling to parent
                console.log('Trash icon pressed for:', item.id);
                handleDelete(item);
              }}
              testID={`delete-member-${item.id}`}
            >
              {deleteVendor.isPending ? (
                <ActivityIndicator size="small" color={isDark ? '#f87171' : '#dc2626'} />
              ) : (
                <Ionicons name="trash-outline" size={20} color={isDark ? '#f87171' : '#dc2626'} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {item.specialization && ( 
        <View style={styles.vendorDetail}>
          <Ionicons name="briefcase" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.specialization}</Text>
        </View>
      )}

      {item.location && (
        <View style={styles.vendorDetail}>
          <Ionicons name="location" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.location}</Text>
        </View>
      )}

      {item.contactInfo && (
        <View style={styles.vendorDetail}>
          <Ionicons name="call" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.contactInfo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load vendors</Text>
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
              placeholder="Search by vendor name..."
              value={searchName}
              onChangeText={setSearchName}
              placeholderTextColor={colors.textSecondary}
            />
            {searchName && (
              <TouchableOpacity onPress={() => setSearchName('')}>
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
            color={activeFiltersCount > 0 ? colors.primary : colors.textSecondary} 
          />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeText}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Expandable Filter Options */}
      {filtersExpanded && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filters</Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={[styles.clearButton, { backgroundColor: colors.primary }]}>
                <Text style={[styles.clearButtonText, { color: '#fff' }]}>Clear ({activeFiltersCount})</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter */}
          <View style={styles.categoryContainer}>
            <TouchableOpacity 
              style={[styles.categoryDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Ionicons name="pricetag" size={20} color={colors.textSecondary} style={styles.categoryIcon} />
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {selectedCategory || 'All Categories'}
              </Text>
              <Ionicons 
                name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showCategoryDropdown && (
              <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle={isDark ? "white" : "black"}
                  style={styles.dropdownScroll}
                >
                  <TouchableOpacity 
                    style={[styles.dropdownItem, !selectedCategory && [styles.selectedDropdownItem, { backgroundColor: colors.surface }], { backgroundColor: colors.card }]}
                    onPress={() => {
                      setSelectedCategory('');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Ionicons name="list" size={18} color={!selectedCategory ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, !selectedCategory && { fontWeight: '600', color: colors.primary }]}>
                      All Categories
                    </Text>
                    {!selectedCategory && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  {config?.vendorCategories?.map((category: string) => (
                    <TouchableOpacity 
                      key={category}
                      style={[styles.dropdownItem, selectedCategory === category && [styles.selectedDropdownItem, { backgroundColor: colors.surface }], { backgroundColor: colors.card }]}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Ionicons name="pricetag" size={18} color={selectedCategory === category ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                      <Text style={[styles.dropdownItemText, { color: colors.text }, selectedCategory === category && { fontWeight: '600', color: colors.primary }]}>
                        {category}
                      </Text>
                      {selectedCategory === category && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Dropdown Overlay - positioned outside filter section */}
      {showCategoryDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        />
      )}

      <FlatList
        data={filteredVendors}
        renderItem={renderVendorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {vendors?.length === 0 
                ? 'No vendors added yet' 
                : 'No vendors match your filters'
              }
            </Text>
             {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={clearFilters} style={[styles.clearAllButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}>
                  <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
        onPress={() => setModalVisible(true)}
        data-testid="button-add-vendor"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddVendorModal
        visible={modalVisible}
        vendor={selectedVendor}
        onClose={handleCloseModal}
      />

      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Vendor</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete {vendorToDelete?.name}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Cancel</Text>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  filterButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 9999,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 4,
  },
  categoryContainer: {
    position: 'relative',
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
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 9999,
    maxHeight: 350,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownScroll: {
    maxHeight: 350,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  selectedDropdownItem: {
    backgroundColor: '#fef2f2',
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  selectedDropdownItemText: {
    fontWeight: '600',
    color: BRAND_MAROON,
  },
  vendorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  vendorDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND_MAROON,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  ratingWrapper: {
    alignItems: 'flex-end',
  },

  vendorDeleteButton: {
    padding: 8,
    marginTop: 6,
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
  confirmModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
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
