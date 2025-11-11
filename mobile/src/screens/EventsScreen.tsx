import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../hooks/useApi';
import type { Event } from '../types';
import AddEventModal from '../components/AddEventModal';

const BRAND_MAROON = '#800020';

export default function EventsScreen() {
  const { data: events, isLoading, error } = useEvents();
  const [modalVisible, setModalVisible] = useState(false);

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{item.eventName}</Text>
        <View style={[styles.statusBadge, getStatusColor(item.eventStatus)]}>
          <Text style={styles.statusText}>{item.eventStatus}</Text>
        </View>
      </View>
      
      <Text style={styles.serviceText}>{item.providedService}</Text>
      <Text style={styles.venueText}>📍 {item.venue}</Text>
      <Text style={styles.dateText}>📅 {new Date(item.eventDate).toLocaleDateString()}</Text>
      
      {item.clientName && (
        <Text style={styles.clientText}>👤 {item.clientName}</Text>
      )}
      
      {item.finalizedQuote && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Quote:</Text>
          <Text style={styles.priceValue}>₹{parseFloat(item.finalizedQuote).toLocaleString()}</Text>
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={styles.errorText}>Failed to load events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events || []}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
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

      <AddEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return { backgroundColor: '#d1fae5', borderColor: '#10b981' };
    case 'In Progress':
      return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
    case 'Draft':
      return { backgroundColor: '#e5e7eb', borderColor: '#6b7280' };
    default:
      return { backgroundColor: '#dbeafe', borderColor: '#2563eb' };
  }
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
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceText: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 8,
    fontWeight: '500',
  },
  venueText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  clientText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
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
});
