import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Vendor } from '../types';
import AddVendorModal from '../components/AddVendorModal';

const BRAND_MAROON = '#800020';

export default function VendorsScreen() {
  const queryClient = useQueryClient();
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor'] });
      Alert.alert('Success', 'Vendor deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete vendor: ${error.message}`);
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
          <View style={styles.ratingWrapper}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>

            <TouchableOpacity
              style={styles.vendorDeleteButton}
               onPress={(e) => {
                e.stopPropagation(); // Prevent event bubbling to parent
                console.log('Trash icon pressed for:', item.id);
                handleDelete(item);
              }}
              testID={`delete-member-${item.id}`}
            >
              {deleteVendor.isPending ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
              )}
            </TouchableOpacity>
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

      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmTitle}>Delete Vendor</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete {vendorToDelete?.name}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
});
