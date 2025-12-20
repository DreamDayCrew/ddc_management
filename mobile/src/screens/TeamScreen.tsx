import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamMembers } from '../hooks/useApi';
import type { TeamMember } from '../types';
import AddTeamMemberModal from '../components/AddTeamMemberModal';
import { useTheme } from '../contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const BRAND_MAROON = '#800020';

export default function TeamScreen() {
  const { colors, isDark } = useTheme();
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
    <View style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.memberContent}
        onPress={() => {
          console.log('Member row clicked for edit:', item.id);
          handleEdit(item);
        }}
      >
        <View style={[styles.avatar, { backgroundColor: isDark ? '#4a5568' : '#2563eb' }]}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.memberDesignation, { color: colors.textSecondary }]}>{item.designation}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.1)' }]}
        onPress={(e) => {
          e.stopPropagation(); // Prevent event bubbling to parent
          console.log('Trash icon pressed for:', item.id);
          handleDelete(item);
        }}
        testID={`delete-member-${item.id}`}
      >
        <Ionicons name="trash-outline" size={22} color={isDark ? '#f87171' : '#dc2626'} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#4a5568' : '#2563eb'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Failed to load team members</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    
      <FlatList
        data={team?.sort((a, b) => b.id.localeCompare(a.id)) || []}
        renderItem={renderTeamMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No team members found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: isDark ? '#4a5568' : BRAND_MAROON }]}
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
          <View style={[styles.confirmationBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Delete Team Member</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete {memberToDelete?.name}?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={cancelDelete}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#d1d5db' : '#4b5563' }]}>Cancel</Text>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingRight: 4, // Reduced right padding since delete button has its own padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative', // For z-index to work on children
    borderWidth: 1,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    marginBottom: 4,
  },
  memberDesignation: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
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
  confirmationBox: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
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
  },
  deleteConfirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
