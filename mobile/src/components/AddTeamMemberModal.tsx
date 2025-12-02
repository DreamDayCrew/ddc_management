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
import { useTheme } from '../contexts';

interface AddTeamMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member?: any;
}

const BRAND_MAROON = '#800020';

export default function AddTeamMemberModal({ visible, onClose, member }: AddTeamMemberModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
  });

  // Sync form data when member prop changes
  useEffect(() => {
    if (member && visible) {
      setFormData({
        name: member.name || '',
        designation: member.designation || '',
      });
    } else if (!visible) {
      resetForm();
    }
  }, [member, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (member) {
        return await api.updateTeamMember(member.id, data as any);
      }
      return await api.createTeamMember(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      resetForm();
      onClose();
    },
  });


  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.designation) {
      alert('Please fill in Name and Designation');
      return;
    }
    createMutation.mutate(formData);
  };
  
  const isPending = createMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{member ? 'Edit Team Member' : 'Add Team Member'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter team member name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Designation *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
                placeholder="Enter designation"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={isPending}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }, isPending && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isPending}
                  data-testid="button-save-vendor"
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{member ? 'Update Member' : 'Create Member'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
    borderWidth: 1,
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
