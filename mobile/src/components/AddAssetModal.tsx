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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
import { DatePicker } from './DatePicker';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  asset?: any;
  onCreated?: (asset: any) => void;
}

const BRAND_MAROON = '#800020';

export default function AddAssetModal({ visible, onClose, asset, onCreated }: AddAssetModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '1',
    purchasedAmount: '',
    status: 'Active',
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
    onSuccess: (createdAsset) => {
      // Add the new asset to the cache immediately so dropdowns can find it
      // Use deduplication to avoid duplicates when invalidation refetches
      queryClient.setQueryData(['assets'], (old: any) => {
        if (!old) return [createdAsset];
        const exists = old.some((a: any) => a.id === createdAsset.id);
        return exists ? old.map((a: any) => a.id === createdAsset.id ? createdAsset : a) : [...old, createdAsset];
      });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      onCreated?.(createdAsset);
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '1',
      purchasedAmount: '',
      status : 'Active',
    });
    setPurchaseDate(new Date());
    setShowCategoryDropdown(false);
    setShowStatusDropdown(false);
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{asset ? 'Edit Asset' : 'Add New Asset'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Asset Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter asset name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Category Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowStatusDropdown(false);
                  }}
                >
                  <Ionicons name="pricetag" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.category ? colors.text : colors.textSecondary }]}>
                    {formData.category || 'Select a category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Purchase Amount (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.purchasedAmount}
                onChangeText={(text) => setFormData({ ...formData, purchasedAmount: text })}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>

            <DatePicker
              label="Purchase Date"
              value={purchaseDate}
              onChange={setPurchaseDate}
            />

            {/* Status Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Status</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Ionicons name="flag" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {formData.status}
                  </Text>
                  <Ionicons 
                    name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={createMutation.isPending}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
                  onPress={handleSubmit}
                  disabled={createMutation.isPending}
                  data-testid="button-save-vendor"
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: '#fff' }]}>{asset ? 'Update Asset' : 'Create Asset'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          {/* Category Dropdown List - Outside ScrollView for proper layering */}
          {showCategoryDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 240 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {categories.map((category: string) => (
                  <TouchableOpacity 
                    key={category}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.category === category && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, category });
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Ionicons name="pricetag" size={18} color={formData.category === category ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.category === category && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {category}
                    </Text>
                    {formData.category === category && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Status Dropdown List - Outside ScrollView for proper layering */}
          {showStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 480 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {['Available', 'In Use', 'Under Maintenance', 'Retired'].map((status: string) => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.status === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, status });
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Ionicons name="flag" size={18} color={formData.status === status ? (isDark ? '#e2e8f0' : colors.primary) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.status === status && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {status}
                    </Text>
                    {formData.status === status && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#e2e8f0' : colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Dropdown Overlays - Outside ScrollView for proper layering */}
          {(showCategoryDropdown || showStatusDropdown) && (
            <TouchableOpacity 
              style={styles.dropdownOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowCategoryDropdown(false);
                setShowStatusDropdown(false);
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
    overflow: 'visible',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  submitButton: {
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 999998,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1000,
    zIndex: 999999,
    maxHeight: 200,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  selectedDropdownItem: {
    // Styling will be applied dynamically
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
  },
  selectedDropdownItemText: {
    fontWeight: '600',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  fixedDropdownList: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1000,
    zIndex: 999999,
    maxHeight: 200,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
