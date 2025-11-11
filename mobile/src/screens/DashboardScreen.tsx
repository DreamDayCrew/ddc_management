import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, useExpenses, useAssets, useTeamMembers } from '../hooks/useApi';
import type { Event } from '../types';

const BRAND_MAROON = '#800020';
const BRAND_MAROON_DARK = '#600018';

export default function DashboardScreen() {
  const { data: events, isLoading, error } = useEvents();
  const { data: expenses } = useExpenses();
  const { data: assets } = useAssets();
  const { data: team } = useTeamMembers();

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
  const draftEvents = events?.filter(e => e.eventStatus === 'Draft' || e.eventStatus === 'Inquired').length || 0;
  
  const totalExpenses = expenses?.length || 0;
  const totalAssets = assets?.length || 0;
  const totalTeam = team?.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dream Day Crew</Text>
          <Text style={styles.subtitle}>Event Management System</Text>
        </View>
        <Ionicons name="sparkles" size={32} color="#fff" />
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: BRAND_MAROON }]}>
          <Ionicons name="calendar" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.statNumber}>{totalEvents}</Text>
          <Text style={styles.statLabel}>Total Events</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="time" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.statNumber}>{inProgressEvents}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.statNumber}>{completedEvents}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#6b7280' }]}>
          <Ionicons name="document-text" size={32} color="#fff" style={{ marginBottom: 8 }} />
          <Text style={styles.statNumber}>{draftEvents}</Text>
          <Text style={styles.statLabel}>Inquired</Text>
        </View>
      </View>

      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Ionicons name="wallet" size={24} color={BRAND_MAROON} />
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewNumber}>{totalExpenses}</Text>
            <Text style={styles.overviewLabel}>Expenses</Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <Ionicons name="cube" size={24} color={BRAND_MAROON} />
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewNumber}>{totalAssets}</Text>
            <Text style={styles.overviewLabel}>Assets</Text>
          </View>
        </View>

        <View style={styles.overviewCard}>
          <Ionicons name="people" size={24} color={BRAND_MAROON} />
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewNumber}>{totalTeam}</Text>
            <Text style={styles.overviewLabel}>Team</Text>
          </View>
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
    backgroundColor: BRAND_MAROON,
    padding: 24,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  overviewGrid: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
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
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: BRAND_MAROON,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
});
