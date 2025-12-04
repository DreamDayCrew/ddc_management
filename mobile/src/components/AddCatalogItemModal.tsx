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
import type { CatalogItem, InsertCatalogItem } from '../types';

interface AddCatalogItemModalProps {
  visible: boolean;
  onClose: () => void;
  catalogItem?: CatalogItem | null;
}

const BRAND_MAROON = '#800020';

export default function AddCatalogItemModal({ visible, onClose, catalogItem }: AddCatalogItemModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPackageDropdown, setShowPackageDropdown] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: '',
    package: '',
    itemName: '',
    description: '',
    price: '',
  });

  const services = config?.servicesProvided || ['Photography', 'Videography', 'Decoration', 'Catering', 'Entertainment'];
  const packages = config?.packages || ['Ultra', 'Premium', 'Budget'];

  useEffect(() => {
    if (catalogItem && visible) {
      setFormData({
        serviceType: catalogItem.serviceType || '',
        package: catalogItem.package || '',
        itemName: catalogItem.itemName || '',
        description: catalogItem.description || '',
        price: catalogItem.price?.toString() || '',
      });
    } else if (!visible) {
      resetForm();
    }
  }, [catalogItem, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertCatalogItem) => {
      if (catalogItem) {
        return await api.updateCatalogItem(catalogItem.id, data);
      }
      return await api.createCatalogItem(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', catalogItem ? 'Catalog item updated successfully' : 'Catalog item created successfully');
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to ${catalogItem ? 'update' : 'create'} item: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      serviceType: '',
      package: '',
      itemName: '',
      description: '',
      price: '',
    });
    setShowServiceDropdown(false);
    setShowPackageDropdown(false);
  };

  const handleSubmit = () => {
    if (!formData.serviceType || !formData.package || !formData.itemName) {
      Alert.alert('Error', 'Please fill in Service Type, Package, and Item Name');
      return;
    }
    
    const submitData: InsertCatalogItem = {
      serviceType: formData.serviceType,
      package: formData.package,
      itemName: formData.itemName,
      description: formData.description || null,
      price: formData.price || '0',
    };
    
    createMutation.mutate(submitData);
  };

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
            <Text style={[styles.modalTitle, { color: colors.text }]}>{catalogItem ? 'Edit Catalog Item' : 'Add New Catalog Item'}</Text>
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
            {/* Service Type Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Service Type *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowServiceDropdown(!showServiceDropdown);
                    setShowPackageDropdown(false);
                  }}
                >
                  <Ionicons name="briefcase" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.serviceType ? colors.text : colors.textSecondary }]}>
                    {formData.serviceType || 'Select a service'}
                  </Text>
                  <Ionicons 
                    name={showServiceDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Package Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Package *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowPackageDropdown(!showPackageDropdown);
                    setShowServiceDropdown(false);
                  }}
                >
                  <Ionicons name="layers" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.package ? colors.text : colors.textSecondary }]}>
                    {formData.package || 'Select a package'}
                  </Text>
                  <Ionicons 
                    name={showPackageDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.itemName}
                onChangeText={(text) => setFormData({ ...formData, itemName: text })}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Price (₹)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
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
                  data-testid="button-save-catalog-item"
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: '#fff' }]}>{catalogItem ? 'Update Item' : 'Create Item'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          {/* Service Dropdown List - Outside ScrollView for proper layering */}
          {showServiceDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 160 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {services.map((service: string) => (
                  <TouchableOpacity 
                    key={service}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.serviceType === service && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, serviceType: service });
                      setShowServiceDropdown(false);
                    }}
                  >
                    <Ionicons name="briefcase" size={18} color={formData.serviceType === service ? (isDark ? '#e2e8f0' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.serviceType === service && { fontWeight: '600', color: isDark ? '#e2e8f0' : BRAND_MAROON }]}>
                      {service}
                    </Text>
                    {formData.serviceType === service && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#e2e8f0' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Package Dropdown List - Outside ScrollView for proper layering */}
          {showPackageDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 240 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {packages.map((pkg: string) => (
                  <TouchableOpacity 
                    key={pkg}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.package === pkg && [styles.selectedDropdownItem, { backgroundColor: isDark ? '#4a5568' : '#fef2f2' }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, package: pkg });
                      setShowPackageDropdown(false);
                    }}
                  >
                    <Ionicons name="layers" size={18} color={formData.package === pkg ? (isDark ? '#e2e8f0' : BRAND_MAROON) : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.package === pkg && { fontWeight: '600', color: isDark ? '#e2e8f0' : BRAND_MAROON }]}>
                      {pkg}
                    </Text>
                    {formData.package === pkg && (
                      <Ionicons name="checkmark" size={16} color={isDark ? '#e2e8f0' : BRAND_MAROON} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Dropdown Overlays - Outside ScrollView for proper layering */}
          {(showServiceDropdown || showPackageDropdown) && (
            <TouchableOpacity 
              style={styles.dropdownOverlay}
              activeOpacity={1}
              onPress={() => {
                setShowServiceDropdown(false);
                setShowPackageDropdown(false);
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
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
