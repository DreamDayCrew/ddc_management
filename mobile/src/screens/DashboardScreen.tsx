import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEvents } from '../hooks/useApi';
import type { Event } from '../types';

export default function DashboardScreen() {
  const { data: events, isLoading, error } = useEvents();

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
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
      </View>
    );
  }

  const totalEvents = events?.length || 0;
  const inProgressEvents = events?.filter(e => e.eventStatus === 'In Progress').length || 0;
  const completedEvents = events?.filter(e => e.eventStatus === 'Completed').length || 0;
  const draftEvents = events?.filter(e => e.eventStatus === 'Draft').length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dream Day Crew</Text>
        <Text style={styles.subtitle}>Event Management Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.primaryCard]}>
          <Text style={styles.statNumber}>{totalEvents}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>

        <View style={[styles.statCard, styles.warningCard]}>
          <Text style={styles.statNumber}>{inProgressEvents}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={[styles.statCard, styles.successCard]}>
          <Text style={styles.statNumber}>{completedEvents}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, styles.neutralCard]}>
          <Text style={styles.statNumber}>{draftEvents}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        {events?.slice(0, 5).map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <Text style={styles.eventName}>{event.eventName}</Text>
            <Text style={styles.eventDetails}>{event.providedService}</Text>
            <Text style={styles.eventDate}>{new Date(event.eventDate).toLocaleDateString()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{event.eventStatus}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#2563eb',
  },
  warningCard: {
    backgroundColor: '#f59e0b',
  },
  successCard: {
    backgroundColor: '#10b981',
  },
  neutralCard: {
    backgroundColor: '#6b7280',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
  },
  statusText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
});
