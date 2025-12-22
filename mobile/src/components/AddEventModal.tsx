import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
import envConfig from '../config/environment';
import { DatePicker } from './DatePicker';
import { Picker } from './Picker';
import { Switch } from './Switch';
import { Collapsible } from './Collapsible';
import { useTheme } from '../contexts';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  event?: any;
}

export default function AddEventModal({ visible, onClose, event }: AddEventModalProps) {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [registeredDate, setRegisteredDate] = useState<Date>(new Date());
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showEventStatusDropdown, setShowEventStatusDropdown] = useState(false);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);
  
  const [showPartialExpenseDialog, setShowPartialExpenseDialog] = useState(false);
  const [partialExpenseAmount, setPartialExpenseAmount] = useState('');
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<string | null>(null);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [showPendingConfirmDialog, setShowPendingConfirmDialog] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExpenseDatePicker, setShowExpenseDatePicker] = useState(false);
  const [showLinkedExpenseDialog, setShowLinkedExpenseDialog] = useState(false);
  
  // Query for linked expense
  const { data: linkedExpense, refetch: refetchLinkedExpense } = useQuery({
    queryKey: ['/api/expenses/by-event', event?.id],
    queryFn: async () => {
      if (!event?.id) return null;
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-event/${event.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!event?.id && visible,
  });
  
  const linkedExpenseId = linkedExpense?.id || null;
  
  const [formData, setFormData] = useState({
    eventName: '',
    providedService: '',
    venue: '',
    source: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    clientEmail: '',
    eventStatus: 'Inquired',
    paymentMode: '',
    paymentStatus: 'Pending',
    discount: false,
    discountAmount: '0',
  });

  // Sync form data when event prop changes
  useEffect(() => {
    if (event && visible) {
      setFormData({
        eventName: event.eventName || '',
        providedService: event.providedService || '',
        venue: event.venue || '',
        source: event.source || '',
        clientName: event.clientName || '',
        clientPhone: event.clientPhone || '',
        clientAddress: event.clientAddress || '',
        clientEmail: event.clientEmail || '',
        eventStatus: event.eventStatus || 'Inquired',
        paymentMode: event.paymentMode || '',
        paymentStatus: event.paymentStatus || 'Pending',
        discount: event.discount === 'true',
        discountAmount: event.discount_amount || '0',
      });
      setEventDate(event.eventDate ? new Date(event.eventDate) : new Date());
      setRegisteredDate(event.registeredOn ? new Date(event.registeredOn) : new Date());
    } else if (!visible) {
      resetForm();
    }
  }, [event, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: Omit<typeof formData, 'discount' | 'discountAmount'> & { discount: string; discount_amount: string; eventDate: string }) => {
      if (event) {
        return await api.updateEvent(event.id, data as any);
      }
      return await api.createEvent(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      if (event) {
        queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
        Alert.alert('Success', 'Event updated successfully!');
      } else {
        Alert.alert('Success', 'Event created successfully!');
      }
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      Alert.alert('Error', `Failed to ${event ? 'update' : 'create'} event: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      eventName: '',
      providedService: '',
      venue: '',
      source: '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientEmail: '',
      eventStatus: 'Inquired',
      paymentMode: '',
      paymentStatus: 'Pending',
      discount: false,
      discountAmount: '0',
    });
    setEventDate(new Date());
    setRegisteredDate(new Date());
    setShowServiceDropdown(false);
    setShowEventStatusDropdown(false);
    setShowPaymentModeDropdown(false);
    setShowPaymentStatusDropdown(false);
    setShowPartialExpenseDialog(false);
    setPartialExpenseAmount('');
    setPendingPaymentStatus(null);
    setIsCreatingExpense(false);
  };

  const createExpenseForEvent = async (amount: string, status: string, dateStr?: string) => {
    if (!event?.id) {
      Alert.alert('Error', 'Cannot create expense: event ID is required');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsCreatingExpense(true);
    try {
      const expenseData = {
        type: 'Credit',
        category: 'Event',
        from_account: 'Client Payment',
        to_account: 'DDC Fund',
        description: `Payment from ${formData.eventName || event.eventName}`,
        amount: amount,
        date: dateStr || new Date().toISOString().split('T')[0],
        status: 'Paid',
        eventId: event.id,
        contributor: [],
        contribution: [],
        contribution_status: [],
      };

      const createdExpense = await api.createExpense(expenseData as any);

      // Update payment status on event
      await api.updateEvent(event.id, {
        paymentStatus: status,
      } as any);

      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });

      setFormData({ ...formData, paymentStatus: status });

      Alert.alert(
        'Success',
        `Expense created and linked to event (₹${numericAmount.toLocaleString('en-IN')})`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to create expense: ${(error as Error).message}`);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!event) {
      setFormData({ ...formData, paymentStatus: newStatus });
      setShowPaymentStatusDropdown(false);
      return;
    }

    const currentStatus = formData.paymentStatus || event.paymentStatus;
    if (newStatus === currentStatus) {
      setShowPaymentStatusDropdown(false);
      return;
    }

    // Check if expense is already linked
    let hasLinkedExpense = false;
    try {
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-event/${event.id}`);
      if (res.ok) {
        hasLinkedExpense = true;
      }
    } catch {
      // No expense linked
    }

    // If changing to Pending and expense is linked, show confirmation
    if (newStatus === 'Pending' && hasLinkedExpense) {
      setShowPaymentStatusDropdown(false);
      setShowPendingConfirmDialog(true);
      return;
    }

    // If changing from Partial to Paid, update expense to full amount
    if (currentStatus === 'Partial' && newStatus === 'Paid' && hasLinkedExpense) {
      setShowPaymentStatusDropdown(false);
      const fullAmount = event.finalizedQuote || '0';
      updateExpenseAmount(fullAmount, newStatus);
      return;
    }

    if (newStatus === 'Paid') {
      setShowPaymentStatusDropdown(false);
      const amount = event.finalizedQuote || '0';
      if (parseFloat(amount) > 0) {
        setPendingPaymentStatus(newStatus);
        setPartialExpenseAmount(amount);
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setShowPartialExpenseDialog(true);
      } else {
        setFormData({ ...formData, paymentStatus: newStatus });
      }
    } else if (newStatus === 'Partial') {
      setShowPaymentStatusDropdown(false);
      const totalAmount = parseFloat(event.finalizedQuote || '0');
      if (totalAmount <= 0) {
        Alert.alert('Error', 'Cannot create partial payment: no finalized quote set');
        return;
      }
      setPendingPaymentStatus(newStatus);
      setPartialExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setShowPartialExpenseDialog(true);
    } else {
      setFormData({ ...formData, paymentStatus: newStatus });
      setShowPaymentStatusDropdown(false);
    }
  };

  const updateExpenseAmount = async (amount: string, status: string) => {
    if (!event?.id) return;
    
    setIsCreatingExpense(true);
    try {
      // Get existing expense
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-event/${event.id}`);
      if (!res.ok) {
        // No expense exists, create a new one
        createExpenseForEvent(amount, status);
        return;
      }
      const existingExpense = await res.json();
      
      // Update the expense amount
      await api.updateExpense(existingExpense.id, {
        amount: amount,
      });
      
      // Update payment status
      await api.updateEvent(event.id, { paymentStatus: status } as any);
      
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      
      setFormData({ ...formData, paymentStatus: status });
      Alert.alert('Success', `Payment updated to full amount (₹${parseFloat(amount).toLocaleString('en-IN')})`);
    } catch (error) {
      Alert.alert('Error', `Failed to update expense: ${(error as Error).message}`);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handlePendingConfirm = async () => {
    if (!event?.id) return;
    
    setShowPendingConfirmDialog(false);
    setIsCreatingExpense(true);
    
    try {
      // Get and delete the linked expense
      const res = await fetch(`${envConfig.API_URL}/api/expenses/by-event/${event.id}`);
      if (res.ok) {
        const expense = await res.json();
        await api.deleteExpense(expense.id);
      }
      
      // Update event status to Pending
      await api.updateEvent(event.id, { paymentStatus: 'Pending' } as any);
      
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
      
      setFormData({ ...formData, paymentStatus: 'Pending' });
      Alert.alert('Success', 'Payment status changed to Pending and expense removed');
    } catch (error) {
      Alert.alert('Error', `Failed to update: ${(error as Error).message}`);
    } finally {
      setIsCreatingExpense(false);
    }
  };

  const handlePendingCancel = () => {
    setShowPendingConfirmDialog(false);
  };

  const handlePartialExpenseConfirm = () => {
    // Use pendingPaymentStatus or fallback to current form status
    const effectiveStatus = pendingPaymentStatus || formData.paymentStatus;
    
    if (!effectiveStatus || !event?.id) {
      Alert.alert('Error', 'Please select a payment status');
      return;
    }

    const maxAmount = parseFloat(event.finalizedQuote || '0');
    
    // For "Paid" status, use full amount if partialExpenseAmount is empty
    let effectiveAmount = partialExpenseAmount;
    if (effectiveStatus === 'Paid' && (!partialExpenseAmount || partialExpenseAmount.trim() === '')) {
      effectiveAmount = event.finalizedQuote || '0';
    }
    
    if (!effectiveAmount || effectiveAmount.trim() === '') {
      Alert.alert('Error', 'Please enter a payment amount');
      return;
    }

    const amount = parseFloat(effectiveAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }
    
    // Only enforce max amount check if a quote has been set
    if (maxAmount > 0 && amount > maxAmount) {
      Alert.alert('Error', `Amount cannot exceed the total quote (₹${maxAmount.toLocaleString('en-IN')})`);
      return;
    }

    // Auto-upgrade to Paid if amount equals full amount
    const finalStatus = effectiveStatus === 'Partial' && amount >= maxAmount ? 'Paid' : effectiveStatus;
    
    createExpenseForEvent(effectiveAmount, finalStatus, expenseDate);
    setShowPartialExpenseDialog(false);
    setPendingPaymentStatus(null);
  };

  const handlePartialExpenseCancel = () => {
    setShowPartialExpenseDialog(false);
    setPendingPaymentStatus(null);
    setPartialExpenseAmount('');
  };

  const handleSubmit = () => {
    if (!formData.eventName || !formData.venue || !formData.providedService) {
      alert('Please fill in Event Name, Service, and Venue');
      return;
    }
    
    const submitData = {
      ...formData,
      discount: formData.discount ? 'true' : 'false',
      discount_amount: formData.discountAmount,
      eventDate: eventDate.toISOString().split('T')[0],
      registeredOn: registeredDate.toISOString().split('T')[0],
    };
    
    createMutation.mutate(submitData);
  };

  const services = config?.servicesProvided || ['Corporate Event', 'Wedding', 'Birthday', 'Other'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{event ? 'Edit Event' : 'Add New Event'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Basic Information Section */}
            <Collapsible title="Basic Information" defaultExpanded={true} icon="information-circle">
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Event Name *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.eventName}
                  onChangeText={(text) => setFormData({ ...formData, eventName: text })}
                  placeholder="Enter event name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Service Provided Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Service Provided *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setShowServiceDropdown(!showServiceDropdown);
                      setShowEventStatusDropdown(false);
                      setShowPaymentModeDropdown(false);
                      setShowPaymentStatusDropdown(false);
                    }}
                  >
                    <Ionicons name="business" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: formData.providedService ? colors.text : colors.textSecondary }]}>
                      {formData.providedService || 'Select a service'}
                    </Text>
                    <Ionicons 
                      name={showServiceDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Venue *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.venue}
                  onChangeText={(text) => setFormData({ ...formData, venue: text })}
                  placeholder="Event venue location"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <DatePicker
                label="Registered Date *"
                value={registeredDate}
                onChange={setRegisteredDate}
              />

              <DatePicker
                label="Event Date *"
                value={eventDate}
                onChange={setEventDate}
              />

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Source</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.source}
                  onChangeText={(text) => setFormData({ ...formData, source: text })}
                  placeholder="How did you find us? (Instagram, Referral, etc.)"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Event Status Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Event Status</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setShowEventStatusDropdown(!showEventStatusDropdown);
                      setShowServiceDropdown(false);
                      setShowPaymentModeDropdown(false);
                      setShowPaymentStatusDropdown(false);
                    }}
                  >
                    <Ionicons name="flag" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: formData.eventStatus ? colors.text : colors.textSecondary }]}>
                      {formData.eventStatus || 'Select status'}
                    </Text>
                    <Ionicons 
                      name={showEventStatusDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Collapsible>

            {/* Discount Information Section */}
            <Collapsible title="Discount Information" defaultExpanded={true} icon="pricetag">
              <View style={styles.discountSection}>
                <Switch
                  label="Event Discount"
                  value={formData.discount}
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      discount: value,
                      discountAmount: value ? formData.discountAmount : '0'
                    });
                  }}
                />
                
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Discount Amount</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
                      !formData.discount && { backgroundColor: isDark ? '#374151' : '#f5f5f5', color: colors.textSecondary }
                    ]}
                    value={formData.discountAmount}
                    onChangeText={(text) => setFormData({ ...formData, discountAmount: text })}
                    placeholder="Enter discount amount"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    editable={formData.discount}
                  />
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>The amount discounted from the invoice price</Text>
                </View>
              </View>
            </Collapsible>

            {/* Client Information Section */}
            <Collapsible title="Client Information" defaultExpanded={true} icon="person">
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Client Name</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.clientName}
                  onChangeText={(text) => setFormData({ ...formData, clientName: text })}
                  placeholder="Client name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Client Phone</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.clientPhone}
                  onChangeText={(text) => setFormData({ ...formData, clientPhone: text })}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Client Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.clientAddress}
                  onChangeText={(text) => setFormData({ ...formData, clientAddress: text })}
                  placeholder="Client address"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Client Email</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                  value={formData.clientEmail}
                  onChangeText={(text) => setFormData({ ...formData, clientEmail: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Collapsible>

            {/* Payment Information Section */}
            <Collapsible title="Payment Information" defaultExpanded={true} icon="card">
              {/* Payment Mode Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Payment Mode</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setShowPaymentModeDropdown(!showPaymentModeDropdown);
                      setShowServiceDropdown(false);
                      setShowEventStatusDropdown(false);
                      setShowPaymentStatusDropdown(false);
                    }}
                  >
                    <Ionicons name="wallet" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: formData.paymentMode ? colors.text : colors.textSecondary }]}>
                      {formData.paymentMode || 'Select payment mode'}
                    </Text>
                    <Ionicons 
                      name={showPaymentModeDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Payment Status Dropdown */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Payment Status</Text>
                  {event && (formData.paymentStatus === 'Paid' || formData.paymentStatus === 'Partial' || formData.paymentStatus === 'Completed') && (
                    <TouchableOpacity
                      onPress={() => {
                        if (linkedExpenseId) {
                          setShowLinkedExpenseDialog(true);
                        } else {
                          // Open record payment dialog
                          const existingDate = linkedExpense?.date ? new Date(linkedExpense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                          setExpenseDate(existingDate);
                          setPartialExpenseAmount('');
                          setPendingPaymentStatus(formData.paymentStatus);
                          setShowPartialExpenseDialog(true);
                        }
                      }}
                      disabled={isCreatingExpense}
                    >
                      <Text style={[styles.expenseLink, { color: colors.primary }]}>
                        {isCreatingExpense ? 'Linking...' : linkedExpenseId ? 'View Linked Expense' : 'Link Expense'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.categoryDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      setShowPaymentStatusDropdown(!showPaymentStatusDropdown);
                      setShowServiceDropdown(false);
                      setShowEventStatusDropdown(false);
                      setShowPaymentModeDropdown(false);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.textSecondary} style={styles.dropdownIcon} />
                    <Text style={[styles.dropdownText, { color: formData.paymentStatus ? colors.text : colors.textSecondary }]}>
                      {formData.paymentStatus || 'Select payment status'}
                    </Text>
                    <Ionicons 
                      name={showPaymentStatusDropdown ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Collapsible>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                  onPress={onClose}
                  disabled={createMutation.isPending}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: isDark ? '#4a5568' : '#800020' }, createMutation.isPending && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{event ? 'Update Event' : 'Create Event'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          {/* Service Dropdown List - Outside ScrollView for proper layering */}
          {showServiceDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 260 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {services.map((service: string) => (
                  <TouchableOpacity 
                    key={service}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.providedService === service && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, providedService: service });
                      setShowServiceDropdown(false);
                    }}
                  >
                    <Ionicons name="business" size={18} color={formData.providedService === service ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.providedService === service && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {service}
                    </Text>
                    {formData.providedService === service && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Event Status Dropdown List */}
          {showEventStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 320 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {['Inquired', 'In Progress', 'Completed'].map((status: string) => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.eventStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, eventStatus: status });
                      setShowEventStatusDropdown(false);
                    }}
                  >
                    <Ionicons name="flag" size={18} color={formData.eventStatus === status ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.eventStatus === status && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {status}
                    </Text>
                    {formData.eventStatus === status && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Payment Mode Dropdown List */}
          {showPaymentModeDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 380 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {(config?.paymentModes || ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card']).map((mode: string) => (
                  <TouchableOpacity 
                    key={mode}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.paymentMode === mode && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, paymentMode: mode });
                      setShowPaymentModeDropdown(false);
                    }}
                  >
                    <Ionicons name="wallet" size={18} color={formData.paymentMode === mode ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.paymentMode === mode && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {mode}
                    </Text>
                    {formData.paymentMode === mode && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Payment Status Dropdown List */}
          {showPaymentStatusDropdown && (
            <View style={[styles.fixedDropdownList, { backgroundColor: colors.card, borderColor: colors.border, top: 440 }]}>
              <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                indicatorStyle={isDark ? "white" : "black"}
                style={styles.dropdownScroll}
              >
                {(config?.paymentStatuses || ['Pending', 'Partial', 'Paid']).map((status: string) => (
                  <TouchableOpacity 
                    key={status}
                    style={[
                      styles.dropdownItem, 
                      { backgroundColor: colors.card, borderBottomColor: colors.border },
                      formData.paymentStatus === status && [styles.selectedDropdownItem, { backgroundColor: colors.surface }]
                    ]}
                    onPress={() => handlePaymentStatusChange(status)}
                    disabled={isCreatingExpense}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={formData.paymentStatus === status ? colors.primary : colors.textSecondary} style={styles.dropdownItemIcon} />
                    <Text style={[styles.dropdownItemText, { color: colors.text }, formData.paymentStatus === status && [styles.selectedDropdownItemText, { color: isDark ? '#e2e8f0' : colors.primary }]]}>
                      {status}
                    </Text>
                    {formData.paymentStatus === status && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Overlay to close dropdowns */}
          {(showServiceDropdown || showEventStatusDropdown || showPaymentModeDropdown || showPaymentStatusDropdown) && (
            <TouchableOpacity 
              style={styles.dropdownOverlay}
              onPress={() => {
                setShowServiceDropdown(false);
                setShowEventStatusDropdown(false);
                setShowPaymentModeDropdown(false);
                setShowPaymentStatusDropdown(false);
              }}
              activeOpacity={1}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Pending Status Confirmation Dialog */}
      <Modal
        visible={showPendingConfirmDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePendingCancel}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.dialogHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Change to Pending Status</Text>
              <TouchableOpacity onPress={handlePendingCancel} style={styles.dialogCloseButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dialogContent}>
              <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>
                Expense record will be deleted if the payment status is changed to Pending. If you want, you can choose Partial to provide partial payment.
              </Text>
              <Text style={[styles.dialogLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                Are you sure you want to continue? This will remove the expense linking also.
              </Text>
            </View>
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={handlePendingCancel}
                disabled={isCreatingExpense}
              >
                <Text style={[styles.dialogCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogConfirmButton, { backgroundColor: isDark ? '#4a5568' : '#dc2626' }, isCreatingExpense && styles.dialogConfirmButtonDisabled]}
                onPress={handlePendingConfirm}
                disabled={isCreatingExpense}
              >
                {isCreatingExpense ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dialogConfirmButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Dialog */}
      <Modal
        visible={showPartialExpenseDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePartialExpenseCancel}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.dialogHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>
                {pendingPaymentStatus === 'Partial' ? 'Enter Partial Payment' : 'Record Payment'}
              </Text>
              <TouchableOpacity onPress={handlePartialExpenseCancel} style={styles.dialogCloseButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dialogContent}>
              <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>
                {pendingPaymentStatus === 'Partial' 
                  ? 'Enter the partial payment amount and date:' 
                  : 'Confirm the payment date for the full amount:'}
              </Text>
              
              {/* Date Input */}
              <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Payment Date</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border 
                }]}
                onPress={() => setShowExpenseDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.datePickerText, { color: colors.text }]}>
                  {new Date(expenseDate).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              {showExpenseDatePicker && (
                <DateTimePicker
                  value={new Date(expenseDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowExpenseDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setExpenseDate(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
              )}
              
              {/* Amount Input - only for Partial */}
              {pendingPaymentStatus === 'Partial' && (
                <>
                  <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Amount</Text>
                  <TextInput
                    style={[styles.dialogInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                    value={partialExpenseAmount}
                    onChangeText={setPartialExpenseAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.dialogHint, { color: colors.textSecondary }]}>
                    Maximum: ₹{parseFloat(event?.finalizedQuote || '0').toLocaleString('en-IN')}
                  </Text>
                </>
              )}
              
              {/* Amount Display - for Paid */}
              {pendingPaymentStatus === 'Paid' && (
                <View style={[styles.amountDisplay, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                  <Text style={[styles.amountLabel, { color: colors.text }]}>Amount:</Text>
                  <Text style={[styles.amountValue, { color: colors.text }]}>
                    ₹{parseFloat(event?.finalizedQuote || '0').toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
              
              <Text style={[styles.dialogHint, { color: colors.textSecondary, marginTop: 8 }]}>
                This will create a Credit expense from Client Payment to DDC Fund
              </Text>
            </View>
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={handlePartialExpenseCancel}
                disabled={isCreatingExpense}
              >
                <Text style={[styles.dialogCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogConfirmButton, { backgroundColor: isDark ? '#4a5568' : '#800020' }, isCreatingExpense && styles.dialogConfirmButtonDisabled]}
                onPress={handlePartialExpenseConfirm}
                disabled={isCreatingExpense || !partialExpenseAmount}
              >
                {isCreatingExpense ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dialogConfirmButtonText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Linked Expense Dialog */}
      <Modal
        visible={showLinkedExpenseDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLinkedExpenseDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.dialogHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Linked Expense</Text>
              <TouchableOpacity onPress={() => setShowLinkedExpenseDialog(false)} style={styles.dialogCloseButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dialogContent}>
              {linkedExpense && (
                <>
                  <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Description:</Text>
                    <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.description}</Text>
                  </View>
                  <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Amount:</Text>
                    <Text style={[styles.expenseDetailValue, { color: colors.text }]}>₹{parseFloat(linkedExpense.amount || '0').toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>Date:</Text>
                    <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{new Date(linkedExpense.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>From Account:</Text>
                    <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.from_account}</Text>
                  </View>
                  {linkedExpense.to_account && (
                    <View style={[styles.expenseDetailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.expenseDetailLabel, { color: colors.textSecondary }]}>To Account:</Text>
                      <Text style={[styles.expenseDetailValue, { color: colors.text }]}>{linkedExpense.to_account}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={() => setShowLinkedExpenseDialog(false)}
              >
                <Text style={[styles.dialogCancelButtonText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogConfirmButton, { backgroundColor: colors.error }]}
                onPress={async () => {
                  if (linkedExpenseId) {
                    try {
                      await api.deleteExpense(linkedExpenseId);
                      await api.updateEvent(event.id, { paymentStatus: 'Pending' } as any);
                      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/expenses/by-event', event.id] });
                      queryClient.invalidateQueries({ queryKey: ['/api/events', event.id] });
                      setFormData({ ...formData, paymentStatus: 'Pending' });
                      setShowLinkedExpenseDialog(false);
                      Alert.alert('Success', 'Expense deleted and payment status reset to Pending');
                    } catch (error: any) {
                      Alert.alert('Error', 'Failed to delete expense: ' + (error.message || 'Unknown error'));
                    }
                  }
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#ffffff" />
                <Text style={[styles.dialogConfirmButtonText, { marginLeft: 4 }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  discountSection: {
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
  },
  fixedDropdownList: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 1000,
    zIndex: 999999,
    maxHeight: 200,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  selectedDropdownItem: {
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 1,
  },
  dropdownItemIcon: {
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
  },
  selectedDropdownItemText: {
    fontWeight: '600',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  modalFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  dialogCloseButton: {
    padding: 4,
  },
  dialogContent: {
    padding: 16,
  },
  dialogLabel: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  dialogHint: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  amountDisplay: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dialogActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dialogCancelButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  dialogCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dialogConfirmButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dialogConfirmButtonDisabled: {
    opacity: 0.6,
  },
  dialogConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expenseLink: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
    minHeight: 48,
  },
  datePickerText: {
    fontSize: 15,
  },
  expenseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  expenseDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  expenseDetailValue: {
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
});
