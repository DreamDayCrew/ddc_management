import { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '../navigation/EventsStackNavigator';
import { api } from '../lib/api';
import { config as envConfig } from '../config/environment';
import type { Event, Requirement, FulfillmentPlan, TeamMember, Vendor, Asset, Configuration } from '../types';
import AddRequirementModal from '../components/AddRequirementModal';
import AddPlanModal from '../components/AddPlanModal';
import AddEventModal from '../components/AddEventModal';
import ConfirmDialog from '../components/ConfirmDialog';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

const BRAND_MAROON = '#800020';

export default function EventDetailsScreen({ route, navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { eventId } = route.params;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
  // Log component initialization
  console.log('🚀 EventDetailsScreen initializing for eventId:', eventId);
  console.log('🌐 Environment config:', envConfig);
  console.log('🌐 API_URL from env:', envConfig.API_URL);
  console.log('🌐 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
  console.log('🌐 __DEV__ flag:', __DEV__);
  
  // Validate eventId
  if (!eventId || typeof eventId !== 'string') {
    console.error('❌ Invalid eventId:', eventId);
  }
  
  // Modal state management
  const [requirementModalVisible, setRequirementModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRequirementDeleteConfirm, setShowRequirementDeleteConfirm] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<Requirement | null>(null);
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
  
  // Log data loading status
  console.log('📊 Data loading status:', {
    eventLoading,
    requirementsLoading,
    plansLoading,
    eventData: !!event,
    requirementsCount: requirements?.length || 0,
    configLoaded: !!config
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

  // Calculate invoice value based on requirements (after individual requirement discounts)
  const calculateInvoiceValue = useCallback(() => {
    if (!requirements || requirements.length === 0) return 0;

    return requirements.reduce((total, req) => {
      const price = parseFloat(String(req.order ?? '0'));
      const baseAmount = isNaN(price) ? 0 : price;
      
      // Subtract requirement-level discount if enabled
      let discountAmount = 0;
      if (req.req_discount === 'true' && req.req_discount_amount) {
        const reqDiscount = parseFloat(String(req.req_discount_amount));
        discountAmount = isNaN(reqDiscount) ? 0 : reqDiscount;
      }
      
      return total + (baseAmount - discountAmount);
    }, 0);
  }, [requirements]);

  // Calculate event-level discount amount (requirement discounts already applied in calculateInvoiceValue)
  const calculateDiscountAmount = useCallback(() => {
    // Only get event-level discount since requirement discounts are already subtracted in calculateInvoiceValue
    let eventDiscount = 0;
    if (event && event.discount === 'true' && event.discount_amount) {
      eventDiscount = parseFloat(String(event.discount_amount)) || 0;
    }
    
    return eventDiscount;
  }, [event]);

  // Check if there are changes to either invoice value or DDC cost
  const hasChanges = useMemo(() => {
    if (!event) return false;
    
    const currentInvoiceValue = calculateInvoiceValue();
    const currentDiscountAmount = calculateDiscountAmount();
    const currentFinalInvoiceValue = currentInvoiceValue - currentDiscountAmount;
    const currentDDCCost = calculateDDCCost();
    
    const dbInvoiceValue = parseFloat(event.finalizedQuote || '0');
    const dbDDCCost = parseFloat(event.ddcCost || '0');
    
    const invoiceChanged = Math.abs(currentFinalInvoiceValue - dbInvoiceValue) > 0.01;
    const ddcCostChanged = Math.abs(currentDDCCost - dbDDCCost) > 0.01;
    
    return invoiceChanged || ddcCostChanged;
  }, [event, calculateInvoiceValue, calculateDiscountAmount, calculateDDCCost]);

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
    const discountAmount = calculateDiscountAmount();
    const finalInvoiceValue = invoiceValue - discountAmount;
    const ddcCost = calculateDDCCost();

    Alert.alert(
      'Confirm Update',
      `Update budget with these values?\n\nGross Invoice: ₹${invoiceValue.toLocaleString()}\nDiscount: ₹${discountAmount.toLocaleString()}\nFinal Invoice: ₹${finalInvoiceValue.toLocaleString()}\nDDC Spent: ₹${ddcCost.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            updateBudgetMutation.mutate({
              finalizedQuote: finalInvoiceValue.toString(),
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

  // Delete requirement mutation
  const deleteRequirementMutation = useMutation({
    mutationFn: (requirementId: string) => api.deleteRequirement(eventId, requirementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      Alert.alert('Success', 'Requirement deleted successfully');
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to delete requirement: ${error.message}`);
    },
  });

  const handleDeleteEvent = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteEventMutation.mutate();
    setShowDeleteConfirm(false);
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

  const handleDeleteRequirement = (requirement: Requirement) => {
    setRequirementToDelete(requirement);
    setShowRequirementDeleteConfirm(true);
  };

  const confirmDeleteRequirement = () => {
    if (requirementToDelete) {
      deleteRequirementMutation.mutate(requirementToDelete.id);
    }
    setShowRequirementDeleteConfirm(false);
    setRequirementToDelete(null);
  };

  const cancelDeleteRequirement = () => {
    setShowRequirementDeleteConfirm(false);
    setRequirementToDelete(null);
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

  const handleDownloadInvoice = async () => {
    console.log('📥 Starting invoice download process...');
    console.log('📥 Event ID:', eventId);
    console.log('📥 Event data available:', !!event);
    console.log('📥 Config data available:', !!config);
    
    try {
      // Validate invoice requirements
      if (!event || !config) {
        console.error('❌ Missing data - Event:', !!event, 'Config:', !!config);
        Alert.alert('Error', 'Event data or configuration not loaded');
        return;
      }

      if (!requirements || requirements.length === 0) {
        console.error('❌ No requirements found for event:', eventId);
        Alert.alert('Cannot Generate Invoice', 'No requirements found for this event');
        return;
      }
      
      console.log('📊 Requirements found:', requirements.length);
      console.log('📊 Requirements data:', requirements.map(r => ({ id: r.id, description: r.description, order: r.order })));

      const invoiceValue = calculateInvoiceValue();
      const discountAmount = calculateDiscountAmount();
      const finalInvoiceValue = invoiceValue - discountAmount;
      
      console.log('💰 Calculated values:', {
        invoiceValue,
        discountAmount,
        finalInvoiceValue
      });
      
      if (finalInvoiceValue <= 0) {
        Alert.alert('Cannot Generate Invoice', 'Final invoice amount must be greater than zero');
        return;
      }

      // Generate invoice number
      const invoiceNumber = `INV${event.id.slice(-5).toUpperCase()}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      // Create download URL for the invoice using the config API URL
      const baseUrl = envConfig.API_URL;
      const downloadUrl = `${baseUrl}/api/events/${eventId}/invoice?invoice_number=${invoiceNumber}`;
      
      console.log('🌐 API Configuration:');
      console.log('  Base URL:', baseUrl);
      console.log('  Full download URL:', downloadUrl);
      console.log('  Invoice number:', invoiceNumber);
      
      Alert.alert(
        'Download Invoice',
        `Invoice ${invoiceNumber}\nGross Amount: ₹${invoiceValue.toLocaleString()}\nDiscount: ₹${discountAmount.toLocaleString()}\nFinal Amount: ₹${finalInvoiceValue.toLocaleString()}\n\nThis will open your browser to download the PDF.${Platform.OS === 'android' ? '\n\nFor Samsung devices: After the PDF opens, tap the download icon in your browser.' : ''}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download', 
            onPress: async () => {
              console.log('🔗 Attempting to open URL:', downloadUrl);
              console.log('🔗 Current platform:', Platform.OS);
              
              try {
                // Test if the API URL is reachable first
                console.log('🧪 Testing API connectivity...');
                
                // First test with a simple health check
                const healthUrl = `${envConfig.API_URL}/api/events/${eventId}/health`;
                console.log('🏥 Testing health endpoint:', healthUrl);
                const healthResponse = await fetch(healthUrl, { 
                  method: 'GET',
                  mode: 'cors',
                  headers: {
                    'Accept': 'application/json',
                  }
                });
                console.log('🏥 Health check response:', healthResponse.status);
                if (healthResponse.ok) {
                  const healthData = await healthResponse.json();
                  console.log('🏥 Health data:', healthData);
                }
                
                // Then test the actual download URL
                const testResponse = await fetch(downloadUrl, { 
                  method: 'HEAD',
                  mode: 'cors'
                });
                console.log('✅ Invoice API URL reachable, status:', testResponse.status);
                console.log('✅ Response headers:', Object.fromEntries(testResponse.headers.entries()));
              } catch (error) {
                console.error('❌ Invoice API URL not reachable:', error);
                Alert.alert('Network Error', `Cannot reach server at ${envConfig.API_URL}. Please check if the backend server is running.`);
                return;
              }
              
              // Open the download URL in the browser
              Linking.openURL(downloadUrl)
                .then(() => {
                  console.log('✅ Successfully opened URL in browser');
                })
                .catch((error) => {
                  console.error('❌ Failed to open URL:', error);
                  Alert.alert('Error', 'Cannot open browser. Please check your internet connection.');
                });
            }
          }
        ]
      );
    } catch (error) {
      console.error('💥 Invoice download error:', error);
      console.error('💥 Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadQuote = async () => {
    console.log('📋 Starting quote download process...');
    console.log('📋 Event ID:', eventId);
    console.log('📋 Event data available:', !!event);
    console.log('📋 Config data available:', !!config);
    
    try {
      // Validate quote requirements
      if (!event || !config) {
        console.error('❌ Missing data - Event:', !!event, 'Config:', !!config);
        Alert.alert('Error', 'Event data or configuration not loaded');
        return;
      }

      if (!requirements || requirements.length === 0) {
        Alert.alert('Cannot Generate Quote', 'No requirements found for this event');
        return;
      }

      const quoteValue = calculateInvoiceValue();
      const discountAmount = calculateDiscountAmount();
      const finalQuoteValue = quoteValue - discountAmount;
      
      if (finalQuoteValue <= 0) {
        Alert.alert('Cannot Generate Quote', 'Final quote amount must be greater than zero');
        return;
      }

      // Generate quote number
      const quoteNumber = `QUO${event.id.slice(-5).toUpperCase()}${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      // Create download URL for the quote
      const baseUrl = envConfig.API_URL;
      const downloadUrl = `${baseUrl}/api/events/${eventId}/quote?quote_number=${quoteNumber}`;
      
      console.log('🌐 Quote API Configuration:');
      console.log('  Base URL (env):', envConfig.API_URL);
      console.log('  Base URL (used):', baseUrl);
      console.log('  Full download URL:', downloadUrl);
      console.log('  Quote number:', quoteNumber);
      
      Alert.alert(
        'Download Quote',
        `Quote ${quoteNumber}\nGross Amount: ₹${quoteValue.toLocaleString()}\nDiscount: ₹${discountAmount.toLocaleString()}\nFinal Amount: ₹${finalQuoteValue.toLocaleString()}\n\nThis will open your browser to download the PDF.${Platform.OS === 'android' ? '\n\nFor Samsung devices: After the PDF opens, tap the download icon in your browser.' : ''}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download', 
            onPress: async () => {
              console.log('🔗 Attempting to open quote URL:', downloadUrl);
              console.log('🔗 Current platform:', Platform.OS);
              console.log('🔗 User agent:', navigator.userAgent);
              
              try {
                // Test if the API URL is reachable first
                console.log('🧪 Testing quote API connectivity...');
                
                // First test with a simple health check
                const healthUrl = `${envConfig.API_URL}/api/events/${eventId}/health`;
                console.log('🏥 Testing quote health endpoint:', healthUrl);
                const healthResponse = await fetch(healthUrl, { 
                  method: 'GET',
                  mode: 'cors',
                  headers: {
                    'Accept': 'application/json',
                  }
                });
                console.log('🏥 Quote health check response:', healthResponse.status);
                if (healthResponse.ok) {
                  const healthData = await healthResponse.json();
                  console.log('🏥 Quote health data:', healthData);
                }
                
                // Then test the actual download URL
                const testResponse = await fetch(downloadUrl, { 
                  method: 'HEAD',
                  mode: 'cors'
                });
                console.log('✅ API URL reachable, status:', testResponse.status);
                console.log('✅ Response headers:', Object.fromEntries(testResponse.headers.entries()));
              } catch (error) {
                console.error('❌ Quote API URL not reachable:', error);
                Alert.alert('Network Error', `Cannot reach server at ${envConfig.API_URL}. Please check if the backend server is running.`);
                return;
              }
              
              // Open the download URL in the browser
              import('expo-linking').then(({ default: Linking }) => {
                Linking.openURL(downloadUrl)
                  .then(() => {
                    console.log('✅ Successfully opened quote URL in browser');
                  })
                  .catch((error) => {
                    console.error('❌ Failed to open quote URL:', error);
                    Alert.alert('Error', 'Cannot open browser. Please check your internet connection.');
                  });
              }).catch((linkingError) => {
                console.error('❌ Failed to import expo-linking:', linkingError);
                Alert.alert('Error', 'Failed to load linking module');
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('💥 Quote download error:', error);
      console.error('💥 Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to download quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Event not found</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const invoiceValue = calculateInvoiceValue();
  const discountAmount = calculateDiscountAmount();
  const ddcCost = calculateDDCCost();
  const finalInvoiceValue = invoiceValue - discountAmount;
  const profitLoss = finalInvoiceValue - ddcCost;
  const isProfitable = profitLoss >= 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Event Header */}
      <View style={[styles.header, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            <Text style={[styles.eventName, { color: colors.text }]}>{event.eventName}</Text>
            <Text style={[styles.eventService, { color: colors.primary }]}>{event.providedService}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={handleDownloadQuote}
              data-testid="button-download-quote"
            >
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={handleDownloadInvoice}
              data-testid="button-download-invoice"
            >
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={handleEditEvent}
              data-testid="button-edit-event"
            >
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={handleDeleteEvent}
              data-testid="button-delete-event"
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, getStatusColor(event.eventStatus)]}>
            <Text style={[styles.statusText, { color: '#000000' }]}>{event.eventStatus}</Text>
          </View>
        </View>
      </View>

      {/* Budget Summary */}
      <View style={[styles.section, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Budget Summary</Text>
        <View style={styles.budgetSummary}>
          <View style={[styles.budgetItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Invoice Value:</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>₹{invoiceValue.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.budgetItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Discount:</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>₹{discountAmount.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.budgetItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>Final Invoice:</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>₹{finalInvoiceValue.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.budgetItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>DDC Spent:</Text>
            <Text style={[styles.budgetValue, { color: colors.text }]}>₹{ddcCost.toLocaleString()}</Text>
          </View>
          
          <View style={[styles.budgetItem, styles.profitLossItem, { borderTopColor: colors.border }]}>
            <Text style={[styles.budgetLabel, { color: colors.textSecondary }]}>{isProfitable ? 'Profit' : 'Loss'}:</Text>
            <Text style={[styles.budgetValue, isProfitable ? styles.profitText : styles.lossText]}>
              ₹{Math.abs(profitLoss).toLocaleString()}
            </Text>
          </View>
        </View>
        
        {hasChanges && (
          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: colors.primary }]}
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
      <View style={[styles.section, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Event Information</Text>
        <InfoRow icon="calendar" label="Event Date" value={new Date(event.eventDate).toLocaleDateString()} />
        <InfoRow icon="location" label="Venue" value={event.venue} />
        {event.clientName && <InfoRow icon="person" label="Client" value={event.clientName} />}
        {event.clientPhone && <InfoRow icon="call" label="Phone" value={event.clientPhone} />}
        {event.clientEmail && <InfoRow icon="mail" label="Email" value={event.clientEmail} />}
      </View>

      {/* Requirements & Plans */}
      <View style={[styles.section, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements ({requirements.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddRequirement}
            data-testid="button-add-requirement"
          >
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {requirements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No requirements added yet</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
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
            
            // Calculate requirement discount
            const requirementDiscount = parseFloat(String(req.req_discount_amount ?? '0'));
            const hasDiscount = req.req_discount === 'true' && requirementDiscount > 0;
            
            // Calculate effective invoice amount after discount
            const effectiveInvoiceAmount = invoiceAmount - requirementDiscount;
            
            // Calculate variance using effective invoice amount
            const variance = actualCost - effectiveInvoiceAmount;

            return (
              <View key={req.id} style={[styles.requirementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.requirementHeader}>
                  <Text style={[styles.requirementTitle, { color: colors.text }]}>{req.requirement}</Text>
                  <View style={styles.requirementActions}>
                    <View style={[styles.reqStatusBadge, getStatusColor(req.requirementStatus)]}>
                      <Text style={[styles.reqStatusText, { color: '#000000' }]}>{req.requirementStatus}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleEditRequirement(req)}
                      data-testid={`button-edit-requirement-${req.id}`}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteRequirement(req)}
                      data-testid={`button-delete-requirement-${req.id}`}
                      style={styles.actionButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {req.description && (
                  <Text style={[styles.requirementDesc, { color: colors.textSecondary }]}>{req.description}</Text>
                )}

                <View style={[styles.requirementFinancials, { borderTopColor: colors.border }]}>
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Base Amount:</Text>
                    <Text style={[styles.financialValue, { color: colors.text }]}>₹{invoiceAmount.toLocaleString()}</Text>
                  </View>
                  {hasDiscount && (
                    <>
                      <View style={styles.financialRow}>
                        <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Discount:</Text>
                        <Text style={[styles.financialValue, styles.discountText]}>-₹{requirementDiscount.toLocaleString()}</Text>
                      </View>
                      <View style={styles.financialRow}>
                        <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Invoice Amount:</Text>
                        <Text style={[styles.financialValue, { color: colors.text }]}>₹{effectiveInvoiceAmount.toLocaleString()}</Text>
                      </View>
                    </>
                  )}
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Actual Cost:</Text>
                    <Text style={[styles.financialValue, { color: colors.text }]}>₹{actualCost.toLocaleString()}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>Variance:</Text>
                    <Text style={[
                      styles.financialValue,
                      { color: colors.text },
                      variance > 0 ? styles.lossText : variance < 0 ? styles.profitText : {}
                    ]}>
                      {variance > 0 ? '+' : ''}₹{variance.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Fulfillment Plans */}
                <View style={[styles.plansSection, { borderTopColor: colors.border }]}>
                  <View style={styles.plansHeader}>
                    <Text style={[styles.plansTitle, { color: colors.text }]}>Fulfillment Plans ({plans.length})</Text>
                    <TouchableOpacity
                      onPress={() => handleAddPlan(req.id)}
                      data-testid={`button-add-plan-${req.id}`}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
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
                          style={[styles.planItem, { backgroundColor: colors.card }]}
                          onPress={() => handleEditPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <View style={styles.planHeader}>
                            <Ionicons 
                              name={iconName} 
                              size={16} 
                              color={colors.textSecondary} 
                            />
                            <Text style={[styles.planName, { color: colors.text }]}>{planDetails}</Text>
                          </View>
                          <Text style={[styles.planPayment, { color: colors.primary }]}>₹{parseFloat(plan.payment || '0').toLocaleString()}</Text>
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

      {/* Requirement Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showRequirementDeleteConfirm}
        title="Delete Requirement"
        message={requirementToDelete ? `Are you sure you want to delete "${requirementToDelete.requirement}"? All associated plans will also be deleted.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={confirmDeleteRequirement}
        onCancel={cancelDeleteRequirement}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationBox, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
            <Text style={[styles.confirmationTitle, { color: colors.error }]}>Delete Event?</Text>
            <Text style={[styles.warningText, { color: colors.primary }]}>⚠️ This action cannot be undone!</Text>
            <Text style={[styles.confirmationMessage, { color: colors.text }]}>
              Are you sure you want to delete "{event?.eventName}"?
            </Text>
            <View style={[styles.deletionInfo, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca' }]}>
              <Text style={[styles.deletionInfoTitle, { color: colors.error }]}>This will permanently delete:</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.text }]}>• The event and all its information</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.text }]}>• All requirements ({requirements.length})</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.text }]}>• All associated fulfillment plans</Text>
              <Text style={[styles.deletionInfoItem, { color: colors.text }]}>• All related invoicing data</Text>
            </View>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleteEventMutation.isPending}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.deleteConfirmButton, { backgroundColor: colors.error }]}
                onPress={confirmDelete}
                disabled={deleteEventMutation.isPending}
              >
                {deleteEventMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Helper component for info rows
function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}:</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
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
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
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
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventService: {
    fontSize: 16,
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
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  budgetSummary: {
    marginBottom: 12,
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  profitLossItem: {
    borderBottomWidth: 0,
    paddingTop: 12,
    borderTopWidth: 2,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitText: {
    color: '#10b981',
  },
  lossText: {
    color: '#ef4444',
  },
  discountText: {
    color: '#f59e0b',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyButton: {
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
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
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
    flex: 1,
    marginRight: 8,
  },
  requirementActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  requirementDesc: {
    fontSize: 14,
    marginBottom: 12,
  },
  requirementFinancials: {
    borderTopWidth: 1,
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
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
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
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    flex: 1,
  },
  planPayment: {
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
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
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationBox: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deletionInfo: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  deletionInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  deletionInfoItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    // backgroundColor will be set dynamically using colors.error
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
