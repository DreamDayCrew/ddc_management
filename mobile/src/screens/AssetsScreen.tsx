import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAssets } from '../hooks/useApi';
import type { Asset } from '../types';
import AddAssetModal from '../components/AddAssetModal';

const BRAND_MAROON = '#800020';

export default function AssetsScreen() {
  const { data: assets, isLoading, error } = useAssets();
  const [modalVisible, setModalVisible] = useState(false);

  const renderAssetItem = ({ item }: { item: Asset }) => (
    <View style={styles.assetCard}>
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
        <Text style={styles.details}>{item.detailsAndUse}</Text>
      )}
      
      {item.warranty && (
        <Text style={styles.warranty}>🛡️ Warranty: {item.warranty}</Text>
      )}
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
        onClose={() => setModalVisible(false)}
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
  warranty: {
    fontSize: 13,
    color: '#f59e0b',
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
