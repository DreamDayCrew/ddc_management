import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamMembers } from '../hooks/useApi';
import type { TeamMember } from '../types';
import AddTeamMemberModal from '../components/AddTeamMemberModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const BRAND_MAROON = '#800020';

export default function TeamScreen() {
  const { data: team, isLoading, error } = useTeamMembers();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team'] });
      Alert.alert('Success', 'Team member deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete team member: ${error.message}`);
    },
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleDelete = (member: TeamMember) => {
    console.log('Delete button clicked for member:', member);
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!memberToDelete) return;
    console.log('Deleting member with ID:', memberToDelete.id);
    deleteMutation.mutate(memberToDelete.id);
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
  };

  const renderTeamMember = ({ item }: { item: TeamMember }) => (
    <View style={styles.memberCard}>
      <TouchableOpacity 
        style={styles.memberContent}
        onPress={() => {
          console.log('Member row clicked for edit:', item.id);
          handleEdit(item);
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberDesignation}>{item.designation}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent
          console.log('Trash icon pressed for:', item.id);
          handleDelete(item);
        }}
        testID={`delete-member-${item.id}`}
      >
        <Ionicons name="trash-outline" size={22} color="#dc2626" />
      </TouchableOpacity>
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
        <Text style={styles.errorText}>Failed to load team members</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Members</Text>
        <Text style={styles.headerSubtitle}>{team?.length || 0} members</Text>
      </View>

      <FlatList
        data={team || []}
        renderItem={renderTeamMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No team members found</Text>
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

      <AddTeamMemberModal
        visible={modalVisible}
        onClose={handleCloseModal}
        member={selectedMember}
      />

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Team Member</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete {memberToDelete?.name}?
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
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingRight: 4, // Reduced right padding since delete button has its own padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative', // For z-index to work on children
  },
  memberContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteButton: {
    padding: 12,
    marginLeft: 8,
    zIndex: 10, // Ensure it's above other elements
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // Light red background
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberDesignation: {
    fontSize: 14,
    color: '#6b7280',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
