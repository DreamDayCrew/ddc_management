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

interface AddTeamMemberModalProps {
  visible: boolean;
  onClose: () => void;
  member?: any;
}

const BRAND_MAROON = '#800020';

export default function AddTeamMemberModal({ visible, onClose, member }: AddTeamMemberModalProps) {
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
      queryClient.invalidateQueries({ queryKey: ['team'] });
      resetForm();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteTeamMember(member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      Alert.alert('Success', 'Team member deleted successfully');
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete team member: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (!member) return;
    Alert.alert(
      'Delete Team Member',
      `Are you sure you want to delete ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

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
            <Text style={styles.modalTitle}>{member ? 'Edit Team Member' : 'Add Team Member'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter team member name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Designation *</Text>
              <TextInput
                style={styles.input}
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
                placeholder="Enter designation"
                placeholderTextColor="#999"
              />
            </View>

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
                  <Text style={styles.submitButtonText}>{member ? 'Update Member' : 'Create Member'}</Text>
                </>
              )}
            </TouchableOpacity>

            {member && (
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
                    <Text style={styles.deleteButtonText}>Delete Member</Text>
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
