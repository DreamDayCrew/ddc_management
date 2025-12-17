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
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
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

  const createExpenseForEvent = async (amount: string, status: string) => {
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
        from_account: event.clientName || 'Client Payment',
        to_account: 'DDC Fund',
        description: `Payment for ${formData.eventName || event.eventName} - ${status}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        eventId: event.id,
        contributor: [],
        contribution: [],
        contribution_status: [],
      };

      const createdExpense = await api.createExpense(expenseData as any);

      await api.updateEvent(event.id, {
        expenseId: createdExpense.id,
        paymentStatus: status,
      } as any);

      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
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

  const handlePaymentStatusChange = (newStatus: string) => {
    if (!event) {
      setFormData({ ...formData, paymentStatus: newStatus });
      setShowPaymentStatusDropdown(false);
      return;
    }

    const currentStatus = event.paymentStatus;
    if (newStatus === currentStatus) {
      setShowPaymentStatusDropdown(false);
      return;
    }

    if (newStatus === 'Paid') {
      setShowPaymentStatusDropdown(false);
      const amount = event.finalizedQuote || '0';
      if (parseFloat(amount) > 0) {
        createExpenseForEvent(amount, newStatus);
      } else {
        setFormData({ ...formData, paymentStatus: newStatus });
      }
    } else if (newStatus === 'Partial') {
      setShowPaymentStatusDropdown(false);
      setPendingPaymentStatus(newStatus);
      setPartialExpenseAmount(event.finalizedQuote || '');
      setShowPartialExpenseDialog(true);
    } else {
      setFormData({ ...formData, paymentStatus: newStatus });
      setShowPaymentStatusDropdown(false);
    }
  };

  const handlePartialExpenseConfirm = () => {
    if (pendingPaymentStatus && partialExpenseAmount && event?.id) {
      createExpenseForEvent(partialExpenseAmount, pendingPaymentStatus);
    }
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
                <Text style={[styles.label, { color: colors.text }]}>Payment Status</Text>
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

      {/* Partial Payment Amount Dialog */}
      <Modal
        visible={showPartialExpenseDialog}
        animationType="fade"
        transparent={true}
        onRequestClose={handlePartialExpenseCancel}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.dialogHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Enter Partial Payment Amount</Text>
              <TouchableOpacity onPress={handlePartialExpenseCancel} style={styles.dialogCloseButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dialogContent}>
              <Text style={[styles.dialogLabel, { color: colors.textSecondary }]}>
                Enter the amount received for this partial payment:
              </Text>
              <TextInput
                style={[styles.dialogInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={partialExpenseAmount}
                onChangeText={setPartialExpenseAmount}
                placeholder="Enter amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                autoFocus={true}
                data-testid="input-partial-amount"
              />
              <Text style={[styles.dialogHint, { color: colors.textSecondary }]}>
                This will create a Credit expense from Client Payment to DDC Fund
              </Text>
            </View>
            
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogCancelButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6', borderColor: colors.border }]}
                onPress={handlePartialExpenseCancel}
                disabled={isCreatingExpense}
                data-testid="button-cancel-partial"
              >
                <Text style={[styles.dialogCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.dialogConfirmButton, { backgroundColor: isDark ? '#4a5568' : '#800020' }, isCreatingExpense && styles.dialogConfirmButtonDisabled]}
                onPress={handlePartialExpenseConfirm}
                disabled={isCreatingExpense || !partialExpenseAmount}
                data-testid="button-confirm-partial"
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
});
