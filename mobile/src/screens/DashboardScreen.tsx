import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useEvents, useExpenses, useAssets, useTeamMembers, useRepayments } from '../hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTheme } from '../contexts';
import { useState } from 'react';
import RepaymentDetailsModal from '../components/RepaymentDetailsModal';

type RootTabParamList = {
  Dashboard: undefined;
  Events: 
    | undefined 
    | { 
        screen: string; 
        params: { 
          eventId: string; 
        }; 
      };
  Expenses: undefined;
  More: {
    screen: string;
  } | undefined;
};

const BRAND_MAROON = '#800020';
const BRAND_GOLD = '#D4AF37';
const PREMIUM_DARK = '#1a1a2e';
const PREMIUM_BLUE = '#16213e';
const PREMIUM_LIGHT = '#0f3460';
const SUCCESS_GREEN = '#00b894';
const WARNING_ORANGE = '#fdcb6e';
const DANGER_RED = '#e17055';
const NEUTRAL_GRAY = '#636e72';
const LIGHT_GRAY = '#f8f9fa';
const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { colors, isDark } = useTheme();
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: expenses } = useExpenses();
  const { data: assets } = useAssets();
  const { data: team } = useTeamMembers();
  const { data: repayments } = useRepayments();
  
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  // Fallback if no data
  const safeEvents = events || [];
  const safeExpenses = expenses || [];
  const safeAssets = assets || [];
  const safeTeam = team || [];

  // Calculate financial metrics using expense data
  let totalIncome = 0;
  let totalExpense = 0;
  let accountBalance = 0;

  safeExpenses.forEach((t) => {
    const amount = parseFloat(t.amount as any) || 0;
    const fromAcc = t.from_account || '';
    const toAcc = t.to_account || '';

    if (t.type === 'Credit' || t.type === 'credit') {
      totalIncome += amount;
      if (toAcc === 'DDC Fund') {
        accountBalance += amount;
      }
    } else if (t.type === 'Debit' || t.type === 'debit') {
      totalExpense += amount;
      if (fromAcc === 'DDC Fund') {
        accountBalance -= amount;
      }
    } else if (t.type === 'Transfer' || t.type === 'transfer') {
      if (fromAcc === 'DDC Fund' && toAcc !== 'DDC Fund') {
        accountBalance -= amount;
      } else if (toAcc === 'DDC Fund' && fromAcc !== 'DDC Fund') {
        accountBalance += amount;
      }
    }
  });

  // Calculate pending repayment
  let pendingRepayment = 0;
  if (repayments) {
    repayments.forEach((r) => {
      pendingRepayment += parseFloat(r.pending_amount as any) || 0;
    });
  }

  // Event statistics
  const totalEvents = safeEvents.length;
  const upcomingEvents = safeEvents.filter(e => {
    const eventDate = new Date(e.eventDate);
    const today = new Date();
    return eventDate >= today;
  }).length;
  const inProgressEvents = safeEvents.filter(e => e.eventStatus === 'In Progress').length;
  const completedEvents = safeEvents.filter(e => e.eventStatus === 'Completed').length;

  // Requirement statistics
  const toDoRequirements = requirements.filter(r => r.requirementStatus === 'To Do').length;
  const inProgressRequirements = requirements.filter(r => r.requirementStatus === 'In Progress').length;
  const completedRequirements = requirements.filter(r => r.requirementStatus === 'Completed').length;
  const totalRequirements = requirements.length;

  // Upcoming events for timeline
  const upcoming = safeEvents
    .filter(e => {
      const eventDate = new Date(e.eventDate);
      const today = new Date();
      return eventDate >= today;
    })
    .sort((a, b) => {
      // Sort by event date, then by registeredOn for same dates (latest registered first)
      const aEventDate = new Date(a.eventDate).getTime();
      const bEventDate = new Date(b.eventDate).getTime();
      if (aEventDate !== bEventDate) {
        return aEventDate - bEventDate; // Earliest event date first for upcoming
      }
      // If same event date, show latest registered first
      const aRegDate = new Date(a.registeredOn || a.eventDate).getTime();
      const bRegDate = new Date(b.registeredOn || b.eventDate).getTime();
      return bRegDate - aRegDate;
    })
    .slice(0, 5);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header with Logo 
      <View style={styles.header}>
        <Image 
          source={require('../../assets/ddc-logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerSubtitle}>Event Management Dashboard</Text>
      </View>*/}

      {/* Resources Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
        <View style={styles.resourceGrid}>
          <TouchableOpacity 
            style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('More', { screen: 'Assets' })}
            activeOpacity={0.7}
          >
            <View style={[styles.resourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(212, 175, 55, 0.15)' }]}>
              <Ionicons name="cube-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeAssets.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Assets</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('More', { screen: 'Team' })}
            activeOpacity={0.7}
          >
            <View style={[styles.resourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(22, 33, 62, 0.15)' }]}>
              <Ionicons name="people-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeTeam.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Team</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Expenses')}
            activeOpacity={0.7}
          >
            <View style={[styles.resourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(128, 0, 32, 0.15)' }]}>
              <Ionicons name="card-outline" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeExpenses.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Expenses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Events Timeline */}
      {upcoming.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
          {upcoming.map((event, index) => {
            const daysUntil = Math.ceil(
              (new Date(event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return (
              <TouchableOpacity 
                key={event.id} 
                style={[styles.timelineItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Events', { screen: 'EventDetails', params: { eventId: event.id } })}
                activeOpacity={0.7}
              >
                <View style={styles.timelineDate}>
                  <Text style={[styles.timelineDays, { color: colors.primary }]}>{daysUntil}</Text>
                  <Text style={[styles.timelineDaysLabel, { color: colors.textSecondary }]}>days</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineEventName, { color: colors.text }]}>{event.eventName}</Text>
                  <Text style={[styles.timelineEventDetails, { color: colors.textSecondary }]}>{event.providedService}</Text>
                  <View style={styles.timelineEventMeta}>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={[styles.timelineEventVenue, { color: colors.textSecondary }]}>{event.venue}</Text>
                  </View>
                </View>
                <View style={styles.timelineArrow}>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Financial Overview */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => navigation.navigate('Expenses')}
        activeOpacity={0.8}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Overview</Text>
        <View style={styles.financialGrid}>
          <View style={[styles.financialCard, styles.incomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.financialHeader}>
              <View style={styles.financialIconContainer}>
                <Ionicons name="trending-up" size={20} color="#00b894" />
              </View>
              <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Total Income</Text>
            </View>
            <Text style={[styles.financialValue, { color: colors.text }]}>₹{totalIncome.toLocaleString()}</Text>
            <View style={styles.financialIndicator}>
              <Text style={[styles.financialChange, { color: '#00b894' }]}>+12.5%</Text>
            </View>
          </View>

          <View style={[styles.financialCard, styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.financialHeader}>
              <View style={styles.financialIconContainer}>
                <Ionicons name="trending-down" size={20} color="#e17055" />
              </View>
              <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
            </View>
            <Text style={[styles.financialValue, { color: colors.text }]}>₹{totalExpense.toLocaleString()}</Text>
            <View style={styles.financialIndicator}>
              <Text style={[styles.financialChangeNegative, { color: '#e17055' }]}>+8.3%</Text>
            </View>
          </View>

          <View style={[styles.financialCard, styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.financialHeader}>
              <View style={styles.financialIconContainer}>
                <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Account Balance</Text>
            </View>
            <Text style={[styles.financialValue, { color: colors.text }]}>₹{accountBalance.toLocaleString()}</Text>
            <View style={styles.financialIndicator}>
              <Text style={[styles.financialChange, { color: '#00b894' }]}>+4.2%</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.financialCard, styles.repaymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setRepaymentModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.financialHeader}>
              <View style={styles.financialIconContainer}>
                <Ionicons name="time-outline" size={20} color="#e17055" />
              </View>
              <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Pending Repayment</Text>
            </View>
            <Text style={[styles.financialValue, { color: colors.text }]}>₹{pendingRepayment.toLocaleString()}</Text>
            <View style={styles.financialIndicator}>
              <Text style={[styles.financialChange, { color: '#e17055' }]}>Due Soon</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Quick Stats */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Dashboard' },
              { name: 'Events' }
            ],
          });
        }}
        activeOpacity={0.8}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Events</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
            <Ionicons name="time-outline" size={32} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{upcomingEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#fdcb6e', borderLeftWidth: 4 }]}>
            <Ionicons name="hourglass-outline" size={32} color="#fdcb6e" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{inProgressEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#00b894', borderLeftWidth: 4 }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#00b894" />
            <Text style={[styles.statNumber, { color: colors.text }]}>{completedEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Requirements Progress */}
      <TouchableOpacity 
        style={styles.section}
        onPress={() => {
          navigation.reset({
            index: 1,
            routes: [
              { name: 'Dashboard' },
              { name: 'Events' }
            ],
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements Overview</Text>
          <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{totalRequirements} total</Text>
        </View>
        
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: colors.textSecondary }]} />
              <Text style={[styles.progressLabel, { color: colors.text }]}>To Do</Text>
            </View>
            <Text style={[styles.progressCount, { color: colors.text }]}>{toDoRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(toDoRequirements / totalRequirements) * 100}%`, backgroundColor: colors.textSecondary }
                ]} 
              />
            </View>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#fdcb6e' }]} />
              <Text style={[styles.progressLabel, { color: colors.text }]}>In Progress</Text>
            </View>
            <Text style={[styles.progressCount, { color: colors.text }]}>{inProgressRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(inProgressRequirements / totalRequirements) * 100}%`, backgroundColor: '#fdcb6e' }
                ]} 
              />
            </View>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#00b894' }]} />
              <Text style={[styles.progressLabel, { color: colors.text }]}>Completed</Text>
            </View>
            <Text style={[styles.progressCount, { color: colors.text }]}>{completedRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedRequirements / totalRequirements) * 100}%`, backgroundColor: SUCCESS_GREEN }
                ]} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
      </ScrollView>

      <RepaymentDetailsModal
        visible={repaymentModalVisible}
        onClose={() => setRepaymentModalVisible(false)}
        repayments={repayments || []}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
  },
  loadingText: {
    marginTop: 16,
    color: NEUTRAL_GRAY,
    fontSize: 14,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 14,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
  },
  financialGrid: {
    gap: 16,
  },
  financialCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: SUCCESS_GREEN,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: DANGER_RED,
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: BRAND_GOLD,
    backgroundColor: '#fefefe',
  },
  repaymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: DANGER_RED,
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  financialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  financialLabel: {
    fontSize: 16,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
    flex: 1,
  },
  financialValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginBottom: 12,
    letterSpacing: -1,
  },
  financialIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderRadius: 20,
  },
  financialChange: {
    fontSize: 14,
    color: SUCCESS_GREEN,
    fontWeight: '700',
  },
  financialChangeNegative: {
    fontSize: 14,
    color: DANGER_RED,
    fontWeight: '700',
  },
  profitCard: {
    marginTop: 4,
  },
  financialIcon: {
    marginBottom: 12,
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
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    gap: 12,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  progressLabel: {
    fontSize: 16,
    color: PREMIUM_DARK,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f3f4',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  timelineDate: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PREMIUM_DARK,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  timelineDays: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  timelineDaysLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  timelineContent: {
    flex: 1,
  },
  timelineArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  timelineEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginBottom: 6,
  },
  timelineEventDetails: {
    fontSize: 15,
    color: NEUTRAL_GRAY,
    marginBottom: 8,
  },
  timelineEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineEventVenue: {
    fontSize: 14,
    color: NEUTRAL_GRAY,
    fontWeight: '500',
  },
  resourceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resourceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resourceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PREMIUM_DARK,
    marginBottom: 6,
  },
  resourceLabel: {
    fontSize: 13,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
  },
});
