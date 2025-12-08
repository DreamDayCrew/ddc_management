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
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../lib/api';
import { Switch } from './Switch';
import { useTheme } from '../contexts';

interface AddRequirementModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  requirement?: any;
  isEventCompleted?: boolean;
}

const BRAND_MAROON = '#800020';

export default function AddRequirementModal({ visible, onClose, eventId, requirement, isEventCompleted = false }: AddRequirementModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  // Fetch team members for owner dropdown
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamMembers(),
  });

  const [formData, setFormData] = useState({
    requirement: '',
    description: '',
    requirementOwner: '',
    requirementStatus: 'To Do',
    price: '',
    quantity: '1',
    req_discount: false,
    req_discount_amount: '',
  });

  // Image upload states
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const isEditing = !!requirement;

  // Dropdown states
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (requirement && visible) {
      setFormData({
        requirement: requirement.requirement || '',
        description: requirement.description || '',
        requirementOwner: requirement.requirementOwner || '',
        requirementStatus: requirement.requirementStatus || 'To Do',
        price: String(requirement.price || 0),
        quantity: String(requirement.quantity || 1),
        req_discount: requirement.req_discount === 'true' || requirement.req_discount === true,
        req_discount_amount: String(requirement.req_discount_amount || 0),
      });
      setImages(requirement.images || []);
    } else if (!visible) {
      resetForm();
    }
  }, [requirement, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        if (requirement) {
          return await api.updateRequirement(eventId, requirement.id, data);
        }
        return await api.createRequirement(eventId, data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['requirements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      // Handle error silently or show user-friendly message
    },
  });



  const resetForm = () => {
    setFormData({
      requirement: '',
      description: '',
      requirementOwner: '',
      requirementStatus: 'To Do',
      price: '',
      quantity: '1',
      req_discount: false,
      req_discount_amount: '',
    });
    setImages([]);
  };

  // Image picker handler
  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 images allowed per requirement');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      uploadImages(result.assets);
    }
  };

  // Upload images to server
  const uploadImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!requirement?.id) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      assets.forEach((asset, index) => {
        const uri = asset.uri;
        const filename = uri.split('/').pop() || `image${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      const response = await api.uploadRequirementImages(requirement.id, formData);
      setImages(response.images || []);
      queryClient.invalidateQueries({ queryKey: ['requirements', eventId] });
      Alert.alert('Success', `${assets.length} image(s) uploaded successfully`);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image handler
  const handleDeleteImage = async (imageUrl: string) => {
    if (!requirement?.id) return;

    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.deleteRequirementImage(requirement.id, imageUrl);
              setImages(response.images || []);
              queryClient.invalidateQueries({ queryKey: ['requirements', eventId] });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete image');
            }
          },
        },
      ]
    );
  };

  const closeDropdowns = () => {
    setShowOwnerDropdown(false);
    setShowStatusDropdown(false);
  };

  const handleSubmit = () => {
    if (!formData.requirement.trim()) {
      Alert.alert('Error', 'Please enter requirement name');
      return;
    }

    const price = parseInt(formData.price) || 0;
    const quantity = parseInt(formData.quantity) || 1;

    const discountAmount = parseFloat(formData.req_discount_amount) || 0;
    
    const submitData = {
      ...formData,
      price: price,
      quantity: quantity,
      order: price * quantity, // order = price * quantity for invoice calculation
      req_discount: formData.req_discount ? 'true' : 'false',
      req_discount_amount: discountAmount.toString(), // Convert to string for schema
    };
    
    if (createMutation.isPending) {
      return;
    }
    
    createMutation.mutate(submitData);
  };



  const statuses = config?.planStatuses || ['To Do', 'In Progress', 'Completed'];
  const isPending = createMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
        onPress={() => {
          closeDropdowns();
        }}
      >
        <TouchableOpacity 
          style={[styles.modalContent, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {requirement ? 'Edit Requirement' : 'Add Requirement'}
            </Text>
            <TouchableOpacity onPress={onClose} data-testid="button-close-modal">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Requirement Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.requirement}
                onChangeText={(text) => setFormData({ ...formData, requirement: text })}
                placeholder="Enter requirement name"
                placeholderTextColor={colors.textSecondary}
                data-testid="input-requirement-name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                data-testid="input-description"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Owner</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    closeDropdowns();
                    setShowOwnerDropdown(!showOwnerDropdown);
                  }}
                  data-testid="picker-owner"
                >
                  <MaterialIcons name="person" size={20} color={colors.text} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: formData.requirementOwner ? colors.text : colors.textSecondary }]}>
                    {formData.requirementOwner || 'Select team member'}
                  </Text>
                  <MaterialIcons 
                    name={showOwnerDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Status</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    closeDropdowns();
                    setShowStatusDropdown(!showStatusDropdown);
                  }}
                  data-testid="picker-status"
                >
                  <MaterialIcons name="flag" size={20} color={colors.text} style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, { color: colors.text }]}>
                    {formData.requirementStatus}
                  </Text>
                  <MaterialIcons 
                    name={showStatusDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={[styles.label, { color: colors.text }]}>Price (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  data-testid="input-price"
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={[styles.label, { color: colors.text }]}>Quantity</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.quantity}
                  onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  data-testid="input-quantity"
                />
              </View>
            </View>

            {/* Discount Section */}
            <View style={styles.inputGroup}>
              <View style={styles.switchContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Apply Discount</Text>
                <Switch
                  value={formData.req_discount}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      req_discount: value,
                      req_discount_amount: value ? formData.req_discount_amount : '0'
                    });
                  }}
                />
              </View>
            </View>

            {formData.req_discount && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Discount Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={formData.req_discount_amount}
                  onChangeText={(text) => setFormData({ ...formData, req_discount_amount: text })}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  data-testid="input-discount-amount"
                />
              </View>
            )}

            {/* Image Upload Section - Only show when editing and event is completed */}
            {isEditing && isEventCompleted && (
              <View style={[styles.inputGroup, styles.imageSection]}>
                <View style={styles.imageSectionHeader}>
                  <Text style={[styles.label, { color: colors.text }]}>Event Images</Text>
                  <Text style={[styles.imageCount, { color: colors.textSecondary }]}>
                    {images.length}/5
                  </Text>
                </View>

                {/* Image Grid */}
                {images.length > 0 && (
                  <View style={styles.imageGrid}>
                    {images.map((imageUrl, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image
                          source={{ uri: api.getImageUrl(imageUrl) }}
                          style={styles.imagePreview}
                        />
                        <TouchableOpacity
                          style={styles.deleteImageButton}
                          onPress={() => handleDeleteImage(imageUrl)}
                        >
                          <Ionicons name="close-circle" size={24} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Upload Button */}
                {images.length < 5 && (
                  <TouchableOpacity
                    style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={handlePickImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color={BRAND_MAROON} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
                        <Text style={[styles.uploadButtonText, { color: colors.textSecondary }]}>
                          Upload Images
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                  Max 5 images, JPEG/PNG/GIF/WebP
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Owner Dropdown */}
          {showOwnerDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFormData({ ...formData, requirementOwner: '' });
                    setShowOwnerDropdown(false);
                  }}
                >
                  <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                  <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>Select team member</Text>
                </TouchableOpacity>
                {teamMembers.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.requirementOwner === member.name && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, requirementOwner: member.name });
                      setShowOwnerDropdown(false);
                    }}
                  >
                    <MaterialIcons name="person" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{member.name}</Text>
                    {formData.requirementOwner === member.name && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Status Dropdown */}
          {showStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                {statuses.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { borderBottomColor: colors.border },
                      formData.requirementStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, requirementStatus: status });
                      setShowStatusDropdown(false);
                    }}
                  >
                    <MaterialIcons name="flag" size={20} color={colors.text} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }]}>{status}</Text>
                    {formData.requirementStatus === status && (
                      <MaterialIcons name="check" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.submitButton, styles.submitButtonFull, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }, isPending && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {requirement ? 'Update' : 'Add'} Requirement
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flex: 1,
    backgroundColor: BRAND_MAROON,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },

  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  imageSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageCount: {
    fontSize: 14,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  selectedDropdownItem: {
    borderRadius: 4,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 12,
  },
});
