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
import { useTheme } from '../contexts';

const BRAND_MAROON = '#800020';

interface RepaymentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  repayments: Repayment[];
}

export default function RepaymentDetailsModal({ visible, onClose, repayments }: RepaymentDetailsModalProps) {
  const { colors, isDark } = useTheme();
  const renderRepaymentItem = ({ item }: { item: Repayment }) => (
    <View style={[styles.repaymentItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.repaymentHeader}>
        <Text style={[styles.repaymentDescription, { color: colors.text }]}>{item.source_name}</Text>
        <Text style={[styles.repaymentAmount, { color: colors.primary }]}>₹{parseFloat(item.allocated_amount).toFixed(2)}</Text>
      </View>
      <View style={styles.repaymentDetails}>
        <Text style={[styles.repaymentText, { color: colors.textSecondary }]}>
          Allocated: ₹{parseFloat(item.allocated_amount).toFixed(2)}
        </Text>
        <Text style={[styles.repaymentText, { color: colors.textSecondary }]}>
          Repaid: ₹{parseFloat(item.repaid_amount).toFixed(2)}
        </Text>
        <Text style={[styles.repaymentDate, { color: colors.textSecondary }]}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.allocationContainer}>
        <Text style={[styles.allocationLabel, { color: colors.textSecondary }]}>Pending Amount:</Text>
        <Text style={[styles.allocationAmount, { color: colors.primary }]}>₹{parseFloat(item.pending_amount).toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#2d3748' : BRAND_MAROON }]}>
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
              <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending repayments</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
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
    flex: 1,
  },
  repaymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  repaymentDetails: {
    marginBottom: 8,
  },
  repaymentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  repaymentDate: {
    fontSize: 12,
  },
  allocationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  allocationLabel: {
    fontSize: 14,
  },
  allocationAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
