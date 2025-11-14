import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAssets } from '../hooks/useApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Asset } from '../types';
import AddAssetModal from '../components/AddAssetModal';

const BRAND_MAROON = '#800020';

export default function AssetsScreen() {
  const { data: assets = [], isLoading, error, refetch } = useAssets();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const totalValue = assets?.reduce((sum, asset) => {
    const value = asset.purchasedAmount ? parseFloat(asset.purchasedAmount) : 0;
    return sum + value * asset.quantity;
  }, 0) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Assets</Text>
          <Text style={styles.summaryValue}>{assets?.length || 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={[styles.summaryValue, styles.valueText]}>
            ₹{totalValue.toLocaleString()}
          </Text>
        </View>
      </View>

      {error && <Text style={styles.errorText}>Error loading assets: {error.message}</Text>}
      <FlatList
        data={assets}
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
});
