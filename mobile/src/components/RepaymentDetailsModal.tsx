import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Repayment } from '../types';

const BRAND_MAROON = '#800020';

interface RepaymentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  repayments: Repayment[];
}

export default function RepaymentDetailsModal({ visible, onClose, repayments }: RepaymentDetailsModalProps) {
  const renderRepaymentItem = ({ item }: { item: Repayment }) => (
    <View style={styles.repaymentItem}>
      <View style={styles.repaymentHeader}>
        <Text style={styles.repaymentDescription}>{item.source_name}</Text>
        <Text style={styles.repaymentAmount}>₹{parseFloat(item.allocated_amount).toFixed(2)}</Text>
      </View>
      <View style={styles.repaymentDetails}>
        <Text style={styles.repaymentText}>
          Allocated: ₹{parseFloat(item.allocated_amount).toFixed(2)}
        </Text>
        <Text style={styles.repaymentText}>
          Repaid: ₹{parseFloat(item.repaid_amount).toFixed(2)}
        </Text>
        <Text style={styles.repaymentDate}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.allocationContainer}>
        <Text style={styles.allocationLabel}>Pending Amount:</Text>
        <Text style={styles.allocationAmount}>₹{parseFloat(item.pending_amount).toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pending Repayments</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {repayments && repayments.length > 0 ? (
            <FlatList
              data={repayments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRepaymentItem}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              <Text style={styles.emptyText}>No pending repayments</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BRAND_MAROON,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  repaymentItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  repaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  repaymentDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  repaymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  repaymentDetails: {
    marginBottom: 8,
  },
  repaymentText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  repaymentDate: {
    fontSize: 12,
    color: '#999',
  },
  allocationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  allocationLabel: {
    fontSize: 14,
    color: '#666',
  },
  allocationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});
