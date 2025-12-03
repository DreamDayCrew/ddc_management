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
import type { CatalogItem, InsertCatalogItem } from '../types';
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';

interface AddCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  editingItem?: CatalogItem | null;
  services: string[];
  packages: string[];
}

export default function AddCatalogModal({ 
  visible, 
  onClose, 
  editingItem, 
  services, 
  packages 
}: AddCatalogModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  
  const [serviceType, setServiceType] = useState('');
  const [packageName, setPackageName] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showPackagePicker, setShowPackagePicker] = useState(false);

  // Sync form data when editingItem prop changes
  useEffect(() => {
    if (editingItem && visible) {
      setServiceType(editingItem.serviceType);
      setPackageName(editingItem.package);
      setItemName(editingItem.itemName);
      setDescription(editingItem.description || '');
      setPrice(editingItem.price || '0');
    } else if (!visible) {
      resetForm();
    }
  }, [editingItem, visible]);

  const createMutation = useMutation({
    mutationFn: (data: InsertCatalogItem) => api.createCatalogItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Catalog item created successfully');
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to create item: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCatalogItem> }) => 
      api.updateCatalogItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      Alert.alert('Success', 'Catalog item updated successfully');
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to update item: ${error.message}`);
    },
  });

  const resetForm = () => {
    setServiceType('');
    setPackageName('');
    setItemName('');
    setDescription('');
    setPrice('');
    setShowServicePicker(false);
    setShowPackagePicker(false);
  };

  const handleSubmit = () => {
    if (!serviceType || !packageName || !itemName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data: InsertCatalogItem = {
      serviceType,
      package: packageName,
      itemName,
      description: description || null,
      price: price || '0',
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingItem ? 'Edit Catalog Item' : 'Add Catalog Item'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Service Type Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Service Type *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowServicePicker(!showServicePicker);
                    setShowPackagePicker(false);
                  }}
                >
                  <Ionicons name="briefcase-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: serviceType ? colors.text : colors.textSecondary }]}>
                    {serviceType || 'Select a service'}
                  </Text>
                  <Ionicons 
                    name={showServicePicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Package Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Package *</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setShowPackagePicker(!showPackagePicker);
                    setShowServicePicker(false);
                  }}
                >
                  <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: packageName ? colors.text : colors.textSecondary }]}>
                    {packageName || 'Select a package'}
                  </Text>
                  <Ionicons 
                    name={showPackagePicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Item Name Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Enter item name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Description Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Price Section */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Price</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: isDark ? '#4B5563' : BRAND_MAROON }, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{editingItem ? 'Update Catalog' : 'Create Catalog'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Service Picker Dropdown */}
          {showServicePicker && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 200 }]}>
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
                      serviceType === service && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setServiceType(service);
                      setShowServicePicker(false);
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={18} color={serviceType === service ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, serviceType === service && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {service}
                    </Text>
                    {serviceType === service && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Package Picker Dropdown */}
          {showPackagePicker && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
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
                      packageName === pkg && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setPackageName(pkg);
                      setShowPackagePicker(false);
                    }}
                  >
                    <Ionicons name="pricetag-outline" size={18} color={packageName === pkg ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, packageName === pkg && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {pkg}
                    </Text>
                    {packageName === pkg && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Overlay to close dropdowns */}
          {(showServicePicker || showPackagePicker) && (
            <TouchableOpacity 
              style={styles.dropdownOverlay}
              onPress={() => {
                setShowServicePicker(false);
                setShowPackagePicker(false);
              }}
              activeOpacity={1}
            />
          )}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    paddingBottom: 20,
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
    flex: 1,
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
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
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  selectedDropdownItem: {
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 1,
  },
  dropdownItemIcon: {
    marginRight: 12,
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
  modalFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});