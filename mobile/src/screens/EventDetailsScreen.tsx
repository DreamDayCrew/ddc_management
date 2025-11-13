import { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '../navigation/EventsStackNavigator';
import { api } from '../lib/api';
import type { Event, Requirement, FulfillmentPlan, TeamMember, Vendor, Asset, Configuration } from '../types';
import AddRequirementModal from '../components/AddRequirementModal';
import AddPlanModal from '../components/AddPlanModal';
import AddEventModal from '../components/AddEventModal';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

const BRAND_MAROON = '#800020';

export default function EventDetailsScreen({ route, navigation }: Props) {
  const { eventId } = route.params;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state management
  const [requirementModalVisible, setRequirementModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | undefined>();
  const [selectedPlan, setSelectedPlan] = useState<FulfillmentPlan | undefined>();
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);

  // Fetch event data
  const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.getEvent(eventId),
  });

  // Fetch requirements
  const { data: requirements = [], isLoading: requirementsLoading, refetch: refetchRequirements } = useQuery({
    queryKey: ['requirements', eventId],
    queryFn: () => api.getEventRequirements(eventId),
  });

  // Fetch all plans
  const { data: allPlans = [], isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.getAllPlans(),
  });

  // Fetch team, vendors, assets for reference
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamMembers(),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  const { data: config } = useQuery({
    queryKey: ['configuration'],
    queryFn: () => api.getConfiguration(),
  });

  // Calculate DDC cost based on current event's plans
  const calculateDDCCost = useCallback(() => {
    if (!allPlans || allPlans.length === 0 || !requirements || requirements.length === 0) return 0;
    
    const requirementIds = new Set(requirements.map(req => req.id));
    const eventPlans = allPlans.filter(plan => requirementIds.has(plan.requirementId));
    
    return eventPlans.reduce((total, plan) => {
      const cost = parseFloat(plan.payment || '0');
      return total + (isNaN(cost) ? 0 : cost);
    }, 0);
  }, [allPlans, requirements]);

  // Calculate invoice value based on requirements
  const calculateInvoiceValue = useCallback(() => {
    if (!requirements || requirements.length === 0) return 0;
    return requirements.reduce((total, req) => {
      const price = parseFloat(String(req.order ?? '0'));
      return total + (isNaN(price) ? 0 : price);
    }, 0);
  }, [requirements]);

  // Check if there are changes to either invoice value or DDC cost
  const hasChanges = useMemo(() => {
    if (!event) return false;
    
    const currentInvoiceValue = calculateInvoiceValue();
    const currentDDCCost = calculateDDCCost();
    
    const dbInvoiceValue = parseFloat(event.finalizedQuote || '0');
    const dbDDCCost = parseFloat(event.ddcCost || '0');
    
    const invoiceChanged = Math.abs(currentInvoiceValue - dbInvoiceValue) > 0.01;
    const ddcCostChanged = Math.abs(currentDDCCost - dbDDCCost) > 0.01;
    
    return invoiceChanged || ddcCostChanged;
  }, [event, calculateInvoiceValue, calculateDDCCost]);

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { finalizedQuote?: string; ddcCost?: string }) => {
      return await api.updateEventBudget(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Success', 'Budget updated successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to update budget: ${error.message}`);
    },
  });

  const handleUpdateBudget = () => {
    const invoiceValue = calculateInvoiceValue();
    const ddcCost = calculateDDCCost();

    Alert.alert(
      'Confirm Update',
      `Update budget with these values?\n\nInvoice Value: ₹${invoiceValue.toLocaleString()}\nDDC Spent: ₹${ddcCost.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateBudgetMutation.mutate({
              finalizedQuote: invoiceValue.toString(),
              ddcCost: ddcCost.toString(),
            });
          },
        },
      ]
    );
  };

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: () => api.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Alert.alert('Success', 'Event deleted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete event: ${error.message}`);
    },
  });

  const handleDeleteEvent = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event?.eventName}"? This will also delete all requirements and plans.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEventMutation.mutate(),
        },
      ]
    );
  };

  // Modal handlers
  const handleAddRequirement = () => {
    setSelectedRequirement(undefined);
    setRequirementModalVisible(true);
  };

  const handleEditRequirement = (requirement: Requirement) => {
    setSelectedRequirement(requirement);
    setRequirementModalVisible(true);
  };

  const handleAddPlan = (requirementId: string) => {
    setSelectedRequirementId(requirementId);
    setSelectedPlan(undefined);
    setPlanModalVisible(true);
  };

  const handleEditPlan = (plan: FulfillmentPlan) => {
    setSelectedRequirementId(plan.requirementId);
    setSelectedPlan(plan);
    setPlanModalVisible(true);
  };

  const handleEditEvent = () => {
    setEventModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchEvent(), refetchRequirements(), refetchPlans()]);
    setRefreshing(false);
  };

  // Get plans for a specific requirement
  const getRequirementPlans = (requirementId: string) => {
    return allPlans.filter(plan => plan.requirementId === requirementId);
  };

  // Calculate actual cost for a requirement (sum of its plans)
  const calculateRequirementActualCost = (requirementId: string) => {
    const plans = getRequirementPlans(requirementId);
    return plans.reduce((total, plan) => {
      const cost = parseFloat(plan.payment || '0');
      return total + (isNaN(cost) ? 0 : cost);
    }, 0);
  };

  if (eventLoading || requirementsLoading || plansLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const invoiceValue = calculateInvoiceValue();
  const ddcCost = calculateDDCCost();
  const profitLoss = invoiceValue - ddcCost;
  const isProfitable = profitLoss >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_MAROON]} />
      }
    >
      {/* Event Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={styles.eventName}>{event.eventName}</Text>
            <Text style={styles.eventService}>{event.providedService}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleEditEvent}
              data-testid="button-edit-event"
            >
              <Ionicons name="create-outline" size={22} color={BRAND_MAROON} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleDeleteEvent}
              data-testid="button-delete-event"
            >
              <Ionicons name="trash-outline" size={22} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, getStatusColor(event.eventStatus)]}>
            <Text style={styles.statusText}>{event.eventStatus}</Text>
          </View>
        </View>
      </View>

      {/* Budget Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Summary</Text>
        <View style={styles.budgetGrid}>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>Invoice Value</Text>
            <Text style={styles.budgetValue}>₹{invoiceValue.toLocaleString()}</Text>
          </View>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetLabel}>DDC Spent</Text>
            <Text style={styles.budgetValue}>₹{ddcCost.toLocaleString()}</Text>
          </View>
          <View style={[styles.budgetCard, isProfitable ? styles.profitCard : styles.lossCard]}>
            <Text style={styles.budgetLabel}>
              {isProfitable ? 'Profit' : 'Loss'}
            </Text>
            <Text style={[styles.budgetValue, isProfitable ? styles.profitText : styles.lossText]}>
              ₹{Math.abs(profitLoss).toLocaleString()}
            </Text>
          </View>
        </View>
        
        {hasChanges && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateBudget}
            disabled={updateBudgetMutation.isPending}
          >
            <Ionicons name="sync" size={20} color="#fff" />
            <Text style={styles.updateButtonText}>
              {updateBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Event Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Information</Text>
        <InfoRow icon="calendar" label="Event Date" value={new Date(event.eventDate).toLocaleDateString()} />
        <InfoRow icon="location" label="Venue" value={event.venue} />
        {event.clientName && <InfoRow icon="person" label="Client" value={event.clientName} />}
        {event.clientPhone && <InfoRow icon="call" label="Phone" value={event.clientPhone} />}
        {event.clientEmail && <InfoRow icon="mail" label="Email" value={event.clientEmail} />}
      </View>

      {/* Requirements & Plans */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Requirements ({requirements.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddRequirement}
            data-testid="button-add-requirement"
          >
            <Ionicons name="add-circle" size={24} color={BRAND_MAROON} />
          </TouchableOpacity>
        </View>
        
        {requirements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No requirements added yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddRequirement}
              data-testid="button-add-first-requirement"
            >
              <Text style={styles.emptyButtonText}>Add First Requirement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          requirements.map((req) => {
            const plans = getRequirementPlans(req.id);
            const actualCost = calculateRequirementActualCost(req.id);
            const invoiceAmount = parseFloat(String(req.order ?? '0'));
            const variance = actualCost - invoiceAmount;

            return (
              <View key={req.id} style={styles.requirementCard}>
                <View style={styles.requirementHeader}>
                  <Text style={styles.requirementTitle}>{req.requirement}</Text>
                  <View style={styles.requirementActions}>
                    <View style={[styles.reqStatusBadge, getStatusColor(req.requirementStatus)]}>
                      <Text style={styles.reqStatusText}>{req.requirementStatus}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEditRequirement(req)}
                      data-testid={`button-edit-requirement-${req.id}`}
                    >
                      <Ionicons name="create-outline" size={18} color={BRAND_MAROON} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {req.description && (
                  <Text style={styles.requirementDesc}>{req.description}</Text>
                )}

                <View style={styles.requirementFinancials}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Invoice Amount:</Text>
                    <Text style={styles.financialValue}>₹{invoiceAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Actual Cost:</Text>
                    <Text style={styles.financialValue}>₹{actualCost.toLocaleString()}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Variance:</Text>
                    <Text style={[
                      styles.financialValue,
                      variance > 0 ? styles.lossText : variance < 0 ? styles.profitText : {}
                    ]}>
                      {variance > 0 ? '+' : ''}₹{variance.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Fulfillment Plans */}
                <View style={styles.plansSection}>
                  <View style={styles.plansHeader}>
                    <Text style={styles.plansTitle}>Fulfillment Plans ({plans.length})</Text>
                    <TouchableOpacity
                      onPress={() => handleAddPlan(req.id)}
                      data-testid={`button-add-plan-${req.id}`}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={BRAND_MAROON} />
                    </TouchableOpacity>
                  </View>
                  {plans.length > 0 && plans.map((plan) => {
                      let planDetails = '';
                      let iconName: any = 'cube';
                      
                      if (plan.planType === 'Team' && plan.teamMemberId) {
                        const member = teamMembers.find(m => m.id === plan.teamMemberId);
                        planDetails = member ? member.name : 'Team Member';
                        iconName = 'people';
                      } else if (plan.planType === 'Vendor' && plan.vendorId) {
                        const vendor = vendors.find(v => v.id === plan.vendorId);
                        planDetails = vendor ? vendor.name : 'Vendor';
                        iconName = 'business';
                      } else if (plan.planType === 'Asset' && plan.assetId) {
                        const asset = assets.find(a => a.id === plan.assetId);
                        planDetails = asset ? asset.name : 'Asset';
                        iconName = 'cube';
                      }

                      return (
                        <TouchableOpacity
                          key={plan.id}
                          style={styles.planItem}
                          onPress={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <View style={styles.planHeader}>
                            <Ionicons 
                              name={iconName} 
                              size={16} 
                              color="#6b7280" 
                            />
                            <Text style={styles.planName}>{planDetails}</Text>
                          </View>
                          <Text style={styles.planPayment}>₹{parseFloat(plan.payment || '0').toLocaleString()}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Modals */}
      <AddRequirementModal
        visible={requirementModalVisible}
        onClose={() => {
          setRequirementModalVisible(false);
          setSelectedRequirement(undefined);
        }}
        eventId={eventId}
        requirement={selectedRequirement}
      />

      <AddPlanModal
        visible={planModalVisible}
        onClose={() => {
          setPlanModalVisible(false);
          setSelectedPlan(undefined);
          setSelectedRequirementId(null);
        }}
        requirementId={selectedRequirementId || ''}
        plan={selectedPlan}
      />

      <AddEventModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        event={event}
      />
    </ScrollView>
  );
}

// Helper component for info rows
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#6b7280" />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return { backgroundColor: '#d1fae5', borderColor: '#10b981' };
    case 'In Progress':
      return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
    case 'Inquired':
      return { backgroundColor: '#dbeafe', borderColor: '#2563eb' };
    default:
      return { backgroundColor: '#e5e7eb', borderColor: '#6b7280' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  eventService: {
    fontSize: 16,
    color: BRAND_MAROON,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  budgetGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  profitCard: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  lossCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profitText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_MAROON,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: BRAND_MAROON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    padding: 4,
  },
  requirementCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  requirementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reqStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1f2937',
  },
  requirementDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  requirementFinancials: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    gap: 6,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  plansSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plansTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginBottom: 6,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  planName: {
    fontSize: 13,
    color: '#1f2937',
    flex: 1,
  },
  planPayment: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_MAROON,
  },
  button: {
    backgroundColor: BRAND_MAROON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 8,
  },
});
