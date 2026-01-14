import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, ImageBackground, Dimensions, TouchableOpacity, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useEvents, useExpenses, useAssets, useTeamMembers, useRepayments } from '../hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useTheme } from '../contexts';
import { useState, useRef, useCallback, useEffect } from 'react';
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
  Catalog: undefined;
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

const CAROUSEL_PAGE_WIDTH = width; // Full screen width for each page
const CAROUSEL_CARD_HEIGHT = 250;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { colors, isDark } = useTheme();
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: expenses } = useExpenses();
  const { data: assets } = useAssets();
  const { data: team } = useTeamMembers();
  const { data: repayments } = useRepayments();

  // Debug: Log data types
  useEffect(() => {
    console.log('📊 Dashboard Data Types:', {
      events: events ? `${typeof events} (isArray: ${Array.isArray(events)})` : 'null',
      expenses: expenses ? `${typeof expenses} (isArray: ${Array.isArray(expenses)})` : 'null',
      assets: assets ? `${typeof assets} (isArray: ${Array.isArray(assets)})` : 'null',
      team: team ? `${typeof team} (isArray: ${Array.isArray(team)})` : 'null',
      repayments: repayments ? `${typeof repayments} (isArray: ${Array.isArray(repayments)})` : 'null',
    });
  }, [events, expenses, assets, team, repayments]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / CAROUSEL_PAGE_WIDTH);
    setActiveCardIndex(index);
  }, []);

  useEffect(() => {
    const autoSwipeInterval = setInterval(() => {
      setActiveCardIndex((prevIndex) => {
        const nextIndex = prevIndex === 0 ? 1 : 0;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(autoSwipeInterval);
  }, []);
  
  const { data: requirements = [] } = useQuery({
    queryKey: ['all-requirements'],
    queryFn: async () => {
      if (!events || !Array.isArray(events) || events.length === 0) return [];
      const allReqs = await Promise.all(
        events.map(event => api.getEventRequirements(event.id))
      );
      return allReqs.flat();
    },
    enabled: !!events && Array.isArray(events) && events.length > 0,
  });

  if (eventsLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading dashboard...</Text>
      </View>
    );
  }

  // Fallback if no data - ensure it's always an array
  const safeEvents = Array.isArray(events) ? events : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeTeam = Array.isArray(team) ? team : [];
  
  // Calculate total asset worth (sum of all purchasedAmount values)
  const totalAssetWorth = safeAssets.reduce((sum, asset) => {
    const amount = parseFloat(asset.purchasedAmount as any) || 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0) || 0;

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
  const safeRepayments = Array.isArray(repayments) ? repayments : [];
  safeRepayments.forEach((r) => {
    pendingRepayment += parseFloat(r.pending_amount as any) || 0;
  });

  // Event statistics
  const totalEvents = safeEvents.length;
  const upcomingEvents = safeEvents.filter(e => {
    const eventDate = new Date(e.eventDate);
    const today = new Date();
    return eventDate >= today;
  }).length;
  const inquiredEvents = safeEvents.filter(e => e.eventStatus === 'Inquired').length;
  const inProgressEvents = safeEvents.filter(e => e.eventStatus === 'In Progress').length;
  const completedEvents = safeEvents.filter(e => e.eventStatus === 'Completed').length;

  // Requirement statistics
  const toDoRequirements = requirements.filter(r => r.requirementStatus === 'To Do').length;
  const inProgressRequirements = requirements.filter(r => r.requirementStatus === 'In Progress').length;
  const completedRequirements = requirements.filter(r => r.requirementStatus === 'Completed').length;
  const droppedRequirements = requirements.filter(r => r.requirementStatus === 'Dropped').length;
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

      {/* Swipeable Carousel */}
      <View style={styles.carouselSection}>
        <FlatList
          ref={flatListRef}
          data={[{ key: 'logo' }, { key: 'balance' }]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: CAROUSEL_PAGE_WIDTH,
            offset: CAROUSEL_PAGE_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => {
            if (item.key === 'logo') {
              return (
                <View style={styles.carouselPage}>
                  <LinearGradient
                    colors={
                      isDark 
                        ? ['rgba(128, 0, 32, 0.8)', 'rgba(128, 0, 32, 0.9)', '#1a1a2e']
                        : ['rgba(128, 0, 32, 0.1)', 'rgba(128, 0, 32, 0.3)', '#f8f9fa']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.carouselCard, styles.logoCard]}
                  >
                    <Image
                      source={require('../../assets/ddc_banner3.jpeg')}
                      style={styles.logoImageFull}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                </View>
              );
            } else {
              return (
                <View style={styles.carouselPage}>
                  <LinearGradient
                    colors={
                      isDark 
                        ? ['#150507', '#400C10', '#2A0E13']
                        : ['#C0A050','#400C10', '#E0D080']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.carouselCard, styles.balanceGradientCard]}
                  >
                    <View style={styles.balanceCardContent}>
                      <View style={styles.mainBalanceSection}>
                        <Text style={styles.balanceLabel}>Account Balance</Text>
                        <Text style={[styles.mainBalance, accountBalance >= 0 ? styles.positiveBalance : styles.negativeBalance]}>
                          ₹{accountBalance.toLocaleString()}
                        </Text>
                      </View>
                      
                      <View style={styles.financialMetrics}>
                        <View style={styles.metricRow}>
                          <View style={styles.metricItem}>
                            <View style={styles.metricIconContainer}>
                              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#4ade80" />
                            </View>
                            <Text style={styles.metricValue}>₹{totalIncome.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>Credit</Text>
                          </View>
                          
                          <View style={styles.metricItem}>
                            <View style={styles.metricIconContainer}>
                              <MaterialCommunityIcons name="minus-circle-outline" size={20} color="#f87171" />
                            </View>
                            <Text style={styles.metricValue}>₹{totalExpense.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>Debit</Text>
                          </View>
                          
                          <TouchableOpacity 
                            style={styles.metricItem}
                            onPress={() => setRepaymentModalVisible(true)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.metricIconContainer}>
                              <MaterialCommunityIcons name="clock-outline" size={20} color="#fbbf24" />
                            </View>
                            <Text style={styles.metricValue}>₹{pendingRepayment.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>Pending</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            }
          }}
          keyExtractor={(item) => item.key}
        />
        
        {/* Pagination Dots - Tappable */}
        <View style={styles.paginationContainer}>
          {[0, 1].map((index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index, animated: true });
                setActiveCardIndex(index);
              }}
              style={styles.paginationDotTouchable}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.paginationDot,
                  activeCardIndex === index && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resources Summary */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
        <View style={styles.resourceGrid}>
          <TouchableOpacity 
            style={[styles.resourceCard, styles.modernCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 1,
                  routes: [
                    { name: 'More', state: { routes: [{ name: 'MoreMenu' }] } },
                    { name: 'More', state: { routes: [{ name: 'MoreMenu' }, { name: 'Assets' }] } },
                  ],
                })
              );
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.resourceIcon, styles.modernResourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(212, 175, 55, 0.2)' }]}>
              <Ionicons name="cube-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeAssets.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Assets Worth: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAssetWorth)}</Text>
            <View style={[styles.resourcePulse, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceCard, styles.modernCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 1,
                  routes: [
                    { name: 'More', state: { routes: [{ name: 'MoreMenu' }] } },
                    { name: 'More', state: { routes: [{ name: 'MoreMenu' }, { name: 'Team' }] } },
                  ],
                })
              );
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.resourceIcon, styles.modernResourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(22, 33, 62, 0.2)' }]}>
              <Ionicons name="people-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeTeam.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Team</Text>
            <View style={[styles.resourcePulse, { backgroundColor: colors.primary }]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceCard, styles.modernCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Expenses')}
            activeOpacity={0.8}
          >
            <View style={[styles.resourceIcon, styles.modernResourceIcon, { backgroundColor: isDark ? colors.surface : 'rgba(128, 0, 32, 0.2)' }]}>
              <Ionicons name="card-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.resourceNumber, { color: colors.text }]}>{safeExpenses.length}</Text>
            <Text style={[styles.resourceLabel, { color: colors.textSecondary }]}>Expenses</Text>
            <View style={[styles.resourcePulse, { backgroundColor: colors.primary }]} />
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
                style={[styles.timelineItem, styles.modernTimelineItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Events', { screen: 'EventDetails', params: { eventId: event.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.timelineDate, styles.modernTimelineDate]}>
                  <Text style={[styles.timelineDays, { color: colors.primary }]}>{daysUntil}</Text>
                  <Text style={[styles.timelineDaysLabel, { color: colors.textSecondary }]}>days</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineEventName, { color: colors.text }]} numberOfLines={1}>{event.eventName}</Text>
                  <Text style={[styles.timelineEventDetails, { color: colors.textSecondary }]} numberOfLines={1}>{event.providedService}</Text>
                  <View style={styles.timelineEventMeta}>
                    <Ionicons name="location" size={12} color={colors.textSecondary} />
                    <Text style={[styles.timelineEventVenue, { color: colors.textSecondary }]} numberOfLines={1}>{event.venue}</Text>
                  </View>
                </View>
                <View style={[styles.timelineArrow, styles.modernTimelineArrow]}>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
          <View style={[styles.statCard, styles.modernStatCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{totalEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Events</Text>
          </View>

          <View style={[styles.statCard, styles.modernStatCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="time-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{inquiredEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inquired</Text>
          </View>

          <View style={[styles.statCard, styles.modernStatCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#fbbf24', borderLeftWidth: 4 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#fbbf2420' }]}>
              <Ionicons name="hourglass-outline" size={28} color="#fbbf24" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{inProgressEvents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Progress</Text>
          </View>

          <View style={[styles.statCard, styles.modernStatCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: '#10b981', borderLeftWidth: 4 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#10b98120' }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />
            </View>
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
                  { width: `${(completedRequirements / totalRequirements) * 100}%`, backgroundColor: '#10b981' }
                ]} 
              />
            </View>
          )}

          <View style={styles.progressRow}>
            <View style={styles.progressInfo}>
              <View style={[styles.progressDot, { backgroundColor: '#f31010ff' }]} />
              <Text style={[styles.progressLabel, { color: colors.text }]}>Dropped</Text>
            </View>
            <Text style={[styles.progressCount, { color: colors.text }]}>{droppedRequirements}</Text>
          </View>
          {totalRequirements > 0 && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(droppedRequirements / totalRequirements) * 100}%`, backgroundColor: '#f31010ff' }
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
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PREMIUM_DARK,
    marginBottom: 20,
    letterSpacing: 0.3,
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
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modernStatCard: {
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: PREMIUM_DARK,
    marginBottom: 8,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 15,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  timelineDays: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  timelineDaysLabel: {
    fontSize: 12,
    color: '#6366f1',
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
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
    fontSize: 26,
    fontWeight: '700',
    color: PREMIUM_DARK,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  resourceLabel: {
    fontSize: 14,
    color: NEUTRAL_GRAY,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  resourceWorth: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  
  // Carousel Styles
  carouselSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  carouselPage: {
    width: width,
    paddingHorizontal: 16,
  },
  carouselCard: {
    width: '100%',
    height: CAROUSEL_CARD_HEIGHT,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    height: 48,
    justifyContent: 'center',
  },
  logoImage: {
    height: 48,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoBackgroundCard: {
    width: '100%',
    height: CAROUSEL_CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
  },
  logoBackgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  logoOverlay: {
    flex: 1,
    borderRadius: 24,
  },
  logoCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoImageFull: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  logoCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoCardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 0, 32, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: BRAND_MAROON,
    width: 32,
  },
  paginationDotTouchable: {
    padding: 8,
  },
  
  // Gradient Card Styles
  gradientCard: {
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  glassMorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceGradientCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'space-between',
  },
  balanceCardContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradientContent: {
    alignItems: 'center',
  },
  mainBalanceSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  mainBalance: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: -1.5,
  },
  positiveBalance: {
    color: '#fff',
  },
  negativeBalance: {
    color: '#ffcccb',
  },
  financialMetrics: {
    width: '100%',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  
  // Modern Card Styles
  modernCard: {
    position: 'relative',
    overflow: 'hidden',
    transform: [{ scale: 1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modernResourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resourcePulse: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  
  // Modern Timeline Styles
  modernTimelineItem: {
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modernTimelineDate: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  modernTimelineArrow: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
});
