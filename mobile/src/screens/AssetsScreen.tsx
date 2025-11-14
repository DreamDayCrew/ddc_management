import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAssets } from '../hooks/useApi';
import type { Asset } from '../types';
import AddAssetModal from '../components/AddAssetModal';
import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const BRAND_MAROON = '#800020';

export default function AssetsScreen() {
  const queryClient = useQueryClient();
  const { data: assets, isLoading, error } = useAssets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[Delete Mutation] Starting deletion for asset ID:', id);
      setDeletingAssetId(id);
      try {
        console.log('[Delete Mutation] Calling api.deleteAsset...');
        const result = await api.deleteAsset(id);
        console.log('[Delete Mutation] API delete request completed');
        return id;
      } catch (error) {
        console.error('[Delete Mutation] Error in mutationFn:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      } finally {
        console.log('[Delete Mutation] Cleaning up, setting deletingAssetId to null');
        setDeletingAssetId(null);
      }
    },
    onSuccess: (deletedId) => {
      console.log('Delete successful, updating cache for ID:', deletedId);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      Alert.alert('Success', 'Asset deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      Alert.alert(
        'Error', 
        `Failed to delete asset: ${error.message || 'Unknown error occurred'}`
      );
    },
  });

  const handleDelete = (asset: Asset) => {
    console.log('[Delete] Delete button clicked for asset:', { 
      id: asset.id, 
      name: asset.name 
    });
    
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete ${asset.name}?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('[Delete] User cancelled deletion')
        },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            console.log('[Delete] User confirmed deletion, calling deleteMutation.mutate');
            setDeletingAssetId(asset.id);
            deleteMutation.mutate(asset.id, {
              onSuccess: () => {
                console.log('[Delete] Mutation successful');
                setDeletingAssetId(null);
              },
              onError: (error) => {
                console.error('[Delete] Mutation error:', error);
                setDeletingAssetId(null);
                Alert.alert(
                  'Error',
                  `Failed to delete asset: ${error.message || 'Unknown error occurred'}`
                );
              }
            });
          }
        },
      ]
    );
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAsset(null);
  };

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <View style={styles.assetHeader}>
            <Text style={styles.assetName}>{item.name}</Text>
            <View style={[styles.statusBadge, getStatusColor(item.status)]}>
              <Text style={styles.statusText}>{item.status}</Text>
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
            <Text style={styles.details} numberOfLines={2} ellipsizeMode="tail">
              {item.detailsAndUse}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent
          console.log('Trash icon pressed for:', item.id);
          handleDelete(item);
        }}
        disabled={!!deletingAssetId}
        testID={`delete-member-${item.id}`}
      >
        <Ionicons name="trash-outline" size={22} color="#dc2626" />
      </TouchableOpacity>
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

      <FlatList
        data={assets || []}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No assets found</Text>
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
  assetCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assetHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  category: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  deleteButton: {
    padding: 12,
    marginLeft: 8,
    zIndex: 10, // Ensure it's above other elements
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // Light red background
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 80, // Extra padding at the bottom for FAB
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: BRAND_MAROON,
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
});
