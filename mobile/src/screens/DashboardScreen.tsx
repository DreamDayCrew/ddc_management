import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEvents, useExpenses, useAssets, useTeamMembers } from '../hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const BRAND_MAROON = '#800020';
const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: expenses } = useExpenses();
  const { data: assets } = useAssets();
  const { data: team } = useTeamMembers();
  
  const { data: requirements = [] } = useQuery({
    queryKey: ['all-requirements'],
    queryFn: async () => {
      if (!events) return [];
      const allReqs = await Promise.all(
        events.map(event => api.getEventRequirements(event.id))
      );
      return allReqs.flat();
    },
    enabled: !!events,
  });

  if (eventsLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
      </View>
    );
  }

  // Calculate financial metrics
  const totalRevenue = events?.reduce((sum, event) => {
    const quote = parseFloat(event.finalizedQuote || '0');
    return sum + quote;
  }, 0) || 0;

  const totalCosts = events?.reduce((sum, event) => {
    const cost = parseFloat(event.ddcCost || '0');
    return sum + cost;
  }, 0) || 0;

  const profitLoss = totalRevenue - totalCosts;
  const isProfitable = profitLoss >= 0;

  // Event statistics
  const totalEvents = events?.length || 0;
  const upcomingEvents = events?.filter(e => {
    const eventDate = new Date(e.eventDate);
    const today = new Date();
    return eventDate >= today;
  }).length || 0;
  const inProgressEvents = events?.filter(e => e.eventStatus === 'In Progress').length || 0;
  const completedEvents = events?.filter(e => e.eventStatus === 'Completed').length || 0;

  // Requirement statistics
  const toDoRequirements = requirements.filter(r => r.requirementStatus === 'To Do').length;
  const inProgressRequirements = requirements.filter(r => r.requirementStatus === 'In Progress').length;
  const completedRequirements = requirements.filter(r => r.requirementStatus === 'Completed').length;
  const totalRequirements = requirements.length;

  // Upcoming events for timeline
  const upcoming = events
    ?.filter(e => {
      const eventDate = new Date(e.eventDate);
      const today = new Date();
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 5) || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image 
          source={require('@assets/Logo Sticker_1763031270643.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerSubtitle}>Event Management Dashboard</Text>
      </View>

      {/* Financial Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.financialGrid}>
          <View style={[styles.financialCard, { backgroundColor: '#10b981' }]}>
            <View style={styles.financialIcon}>
              <Ionicons name="trending-up" size={24} color="#fff" />
            </View>
            <Text style={styles.financialLabel}>Total Revenue</Text>
            <Text style={styles.financialValue}>₹{totalRevenue.toLocaleString()}</Text>
          </View>

          <View style={[styles.financialCard, { backgroundColor: '#ef4444' }]}>
            <View style={styles.financialIcon}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <Text style={styles.financialLabel}>Total Costs</Text>
            <Text style={styles.financialValue}>₹{totalCosts.toLocaleString()}</Text>
          </View>

          <View style={[
            styles.financialCard, 
            styles.profitCard,
            { backgroundColor: isProfitable ? '#10b981' : '#ef4444' }
          ]}>
            <View style={styles.financialIcon}>
              <Ionicons 
                name={isProfitable ? 'trophy' : 'warning'} 
                size={24} 
                color="#fff" 
              />
            </View>
            <Text style={styles.financialLabel}>
              {isProfitable ? 'Total Profit' : 'Total Loss'}
            </Text>
            <Text style={styles.financialValue}>
              ₹{Math.abs(profitLoss).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: BRAND_MAROON, borderLeftWidth: 4 }]}>
            <Ionicons name="calendar" size={28} color={BRAND_MAROON} />
            <Text style={styles.statNumber}>{totalEvents}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#3b82f6', borderLeftWidth: 4 }]}>
            <Ionicons name="time" size={28} color="#3b82f6" />
            <Text style={styles.statNumber}>{upcomingEvents}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#f59e0b', borderLeftWidth: 4 }]}>
            <Ionicons name="hourglass" size={28} color="#f59e0b" />
            <Text style={styles.statNumber}>{inProgressEvents}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#10b981', borderLeftWidth: 4 }]}>
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            <Text style={styles.statNumber}>{completedEvents}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Requirements Progress */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Requirements Overview</Text>
          <Text style={styles.sectionCount}>{totalRequirements} total</Text>
        </View>
        
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#6b7280' }]} />
              <Text style={styles.progressLabel}>To Do</Text>
            </View>
            <Text style={styles.progressCount}>{toDoRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(toDoRequirements / totalRequirements) * 100}%`, backgroundColor: '#6b7280' }
                ]} 
              />
            </View>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.progressLabel}>In Progress</Text>
            </View>
            <Text style={styles.progressCount}>{inProgressRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(inProgressRequirements / totalRequirements) * 100}%`, backgroundColor: '#f59e0b' }
                ]} 
              />
            </View>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <Text style={styles.progressCount}>{completedRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedRequirements / totalRequirements) * 100}%`, backgroundColor: '#10b981' }
                ]} 
              />
            </View>
          )}
        </View>
      </View>

      {/* Upcoming Events Timeline */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcoming.map((event, index) => {
            const daysUntil = Math.ceil(
              (new Date(event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineDate}>
                  <Text style={styles.timelineDays}>{daysUntil}</Text>
                  <Text style={styles.timelineDaysLabel}>days</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineEventName}>{event.eventName}</Text>
                  <Text style={styles.timelineEventDetails}>{event.providedService}</Text>
                  <View style={styles.timelineEventMeta}>
                    <Ionicons name="location" size={12} color="#9ca3af" />
                    <Text style={styles.timelineEventVenue}>{event.venue}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Resources Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <View style={styles.resourceGrid}>
          <View style={styles.resourceCard}>
            <View style={[styles.resourceIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="cube" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.resourceNumber}>{assets?.length || 0}</Text>
            <Text style={styles.resourceLabel}>Assets</Text>
          </View>

          <View style={styles.resourceCard}>
            <View style={[styles.resourceIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="people" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.resourceNumber}>{team?.length || 0}</Text>
            <Text style={styles.resourceLabel}>Team</Text>
          </View>

          <View style={styles.resourceCard}>
            <View style={[styles.resourceIcon, { backgroundColor: '#fce7f3' }]}>
              <Ionicons name="wallet" size={24} color="#ec4899" />
            </View>
            <Text style={styles.resourceNumber}>{expenses?.length || 0}</Text>
            <Text style={styles.resourceLabel}>Expenses</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    width: width * 0.6,
    height: 80,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  financialGrid: {
    gap: 12,
  },
  financialCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  profitCard: {
    marginTop: 4,
  },
  financialIcon: {
    marginBottom: 12,
  },
  financialLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  timelineDate: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_MAROON,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  timelineDays: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timelineDaysLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timelineContent: {
    flex: 1,
  },
  timelineEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  timelineEventDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  timelineEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineEventVenue: {
    fontSize: 12,
    color: '#9ca3af',
  },
  resourceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resourceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  resourceLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
