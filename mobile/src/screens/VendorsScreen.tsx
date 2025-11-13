import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Vendor } from '../types';
import AddVendorModal from '../components/AddVendorModal';

const BRAND_MAROON = '#800020';

export default function VendorsScreen() {
  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
  });

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
      style={styles.vendorCard} 
      onPress={() => handleEdit(item)}
      data-testid={`vendor-card-${item.id}`}
    >
      <View style={styles.vendorHeader}>
        <View style={styles.vendorIconContainer}>
          <Ionicons name="business" size={24} color={BRAND_MAROON} />
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{item.name}</Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        {item.rating !== null && item.rating !== undefined && item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        )}
      </View>

      {item.specialization && (
        <View style={styles.vendorDetail}>
          <Ionicons name="briefcase" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.specialization}</Text>
        </View>
      )}

      {item.location && (
        <View style={styles.vendorDetail}>
          <Ionicons name="location" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
      )}

      {item.contactInfo && (
        <View style={styles.vendorDetail}>
          <Ionicons name="call" size={14} color="#6b7280" />
          <Text style={styles.detailText}>{item.contactInfo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load vendors</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderVendorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No vendors added yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first vendor</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
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
    </View>
  );
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
  listContent: {
    padding: 16,
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
  categoryText: {
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
});
