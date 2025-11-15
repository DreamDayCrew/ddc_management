import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, RefreshControl, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAssets } from '../hooks/useApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Asset } from '../types';
import AddAssetModal from '../components/AddAssetModal';
import { useConfiguration } from '../hooks/useApi';

const BRAND_MAROON = '#800020';

export default function AssetsScreen() {
  const { data: assets = [], isLoading, error, refetch } = useAssets();
  const { data: config } = useConfiguration();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Filter functions
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesCategory = !selectedCategory || asset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchName, selectedCategory]);

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

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      Alert.alert('Success', 'Asset deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete asset: ${error.message}`);
    },
  });

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalVisible(true);
  };

  const handleDelete = (asset: Asset) => {
    console.log('Delete button clicked for asset:', asset);
    setAssetToDelete(asset);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!assetToDelete) return;
    console.log('Deleting asset with ID:', assetToDelete.id);
    deleteMutation.mutate(assetToDelete.id);
    setShowDeleteConfirm(false);
    setAssetToDelete(null);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAsset(null);
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity style={styles.assetCard} onPress={() => handleEdit(item)}>
      <View style={styles.assetHeader}>
        <Text style={styles.assetName}>{item.name}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, getStatusColor(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name}`}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={22} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.category}>📦 {item.category}</Text>
      <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
      
      {item.purchasedAmount && (
        <Text style={styles.price}>
          Purchase Price: ₹{parseFloat(item.purchasedAmount).toLocaleString()}
        </Text>
      )}
      
      {item.purchaseDate && (
        <Text style={styles.date}>
          Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
        </Text>
      )}
      
      {item.detailsAndUse && (
        <Text style={styles.details}>{item.detailsAndUse}</Text>
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
        <Text style={styles.errorText}>Failed to load assets</Text>
      </View>
    );
  }

  const totalValue = filteredAssets?.reduce((sum, asset) => {
    const value = asset.purchasedAmount ? parseFloat(asset.purchasedAmount) : 0;
    return sum + value * asset.quantity;
  }, 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Assets</Text>
          <Text style={styles.summaryValue}>{filteredAssets.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={[styles.summaryValue, styles.valueText]}>
            ₹{totalValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filters</Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear ({activeFiltersCount})</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search by name */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by asset name..."
            value={searchName}
            onChangeText={setSearchName}
            placeholderTextColor="#9ca3af"
          />
          {searchName && (
            <TouchableOpacity onPress={() => setSearchName('')} style={styles.clearSearchButton}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity 
            style={styles.categoryDropdown}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Ionicons name="pricetag" size={20} color="#6b7280" style={styles.categoryIcon} />
            <Text style={styles.categoryText}>
              {selectedCategory || 'All Categories'}
            </Text>
            <Ionicons 
              name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
          
          {showCategoryDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle="black"
                style={styles.dropdownScroll}
              >
                <TouchableOpacity 
                  style={[styles.dropdownItem, !selectedCategory && styles.selectedDropdownItem]}
                  onPress={() => {
                    setSelectedCategory('');
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Ionicons name="list" size={18} color={!selectedCategory ? BRAND_MAROON : "#6b7280"} style={styles.dropdownItemIcon} />
                  <Text style={[styles.dropdownItemText, !selectedCategory && styles.selectedDropdownItemText]}>
                    All Categories
                  </Text>
                  {!selectedCategory && (
                    <Ionicons name="checkmark" size={16} color={BRAND_MAROON} />
                  )}
                </TouchableOpacity>
                {config?.assetCategories?.map((category: string) => (
                  <TouchableOpacity 
                    key={category}
                    style={[styles.dropdownItem, selectedCategory === category && styles.selectedDropdownItem]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Ionicons name="pricetag" size={18} color={selectedCategory === category ? BRAND_MAROON : "#6b7280"} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, selectedCategory === category && styles.selectedDropdownItemText]}>
                      {category}
                    </Text>
                    {selectedCategory === category && (
                      <Ionicons name="checkmark" size={16} color={BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Dropdown Overlay */}
      {showCategoryDropdown && (
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        />
      )}

      {error && <Text style={styles.errorText}>Error loading assets</Text>}
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {assets.length === 0 
                ? 'No assets found' 
                : 'No assets match your filters'
              }
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
                <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>Delete Asset?</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to delete "{assetToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
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
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddAssetModal
        visible={modalVisible}
        onClose={handleCloseModal}
        asset={selectedAsset}
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return { backgroundColor: '#d1fae5' };
    case 'Inactive':
      return { backgroundColor: '#fee2e2' };
    case 'Maintenance':
      return { backgroundColor: '#fef3c7' };
    default:
      return { backgroundColor: '#e5e7eb' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'visible',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  valueText: {
    color: '#2563eb',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    zIndex: 1,
  },
  assetCard: {
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
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  deleteButton: {
    padding: 12,
    marginLeft: 8,
    zIndex: 10,
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
    marginBottom: 12,
    color: '#1f2937',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
    lineHeight: 24,
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
  category: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 4,
    fontWeight: '500',
  },
  quantity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 8,
  },
  details: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
    fontStyle: 'italic',
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
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
    backgroundColor: '#f9fafb',
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
    color: '#1f2937',
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
    maxHeight: 250,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 250,
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
