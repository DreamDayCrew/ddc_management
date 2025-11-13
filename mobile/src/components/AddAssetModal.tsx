import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
import { DatePicker } from './DatePicker';
import { Picker } from './Picker';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  asset?: any;
}

const BRAND_MAROON = '#800020';

export default function AddAssetModal({ visible, onClose, asset }: AddAssetModalProps) {
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '1',
    purchasedAmount: '',
    status: 'Available',
  });

  // Sync form data when asset prop changes
  useEffect(() => {
    if (asset && visible) {
      setFormData({
        name: asset.name || '',
        category: asset.category || '',
        quantity: asset.quantity?.toString() || '1',
        purchasedAmount: asset.purchasedAmount?.toString() || '',
        status: asset.status || 'Available',
      });
      setPurchaseDate(asset.purchaseDate ? new Date(asset.purchaseDate) : new Date());
    } else if (!visible) {
      resetForm();
    }
  }, [asset, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { purchaseDate: string }) => {
      const submitData = {
        ...data,
        quantity: parseInt(data.quantity) || 1,
        purchasedAmount: data.purchasedAmount ? parseFloat(data.purchasedAmount) : null,
      };
      
      if (asset) {
        return await api.updateAsset(asset.id, submitData as any);
      }
      return await api.createAsset(submitData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      resetForm();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteAsset(asset.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      Alert.alert('Success', 'Asset deleted successfully');
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete asset: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (!asset) return;
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete ${asset.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '1',
      purchasedAmount: '',
      status: 'Available',
    });
    setPurchaseDate(new Date());
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      alert('Please fill in Asset Name and Category');
      return;
    }
    
    const submitData = {
      ...formData,
      purchaseDate: purchaseDate.toISOString().split('T')[0],
    };
    
    createMutation.mutate(submitData);
  };

  const categories = config?.assetCategories || ['Decoration', 'Equipment', 'Furniture', 'Electronics', 'Other'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{asset ? 'Edit Asset' : 'Add New Asset'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Asset Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter asset name"
                placeholderTextColor="#999"
              />
            </View>

            <Picker
              label="Category *"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={categories}
              placeholder="Select a category"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="1"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={formData.purchasedAmount}
                onChangeText={(text) => setFormData({ ...formData, purchasedAmount: text })}
                placeholder="0.00"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
              />
            </View>

            <DatePicker
              label="Purchase Date"
              value={purchaseDate}
              onChange={setPurchaseDate}
            />

            <Picker
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={['Available', 'In Use', 'Under Maintenance', 'Retired']}
            />

            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>{asset ? 'Update Asset' : 'Create Asset'}</Text>
                </>
              )}
            </TouchableOpacity>

            {asset && (
              <TouchableOpacity
                style={[styles.deleteButton, deleteMutation.isPending && styles.submitButtonDisabled]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteButtonText}>Delete Asset</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
