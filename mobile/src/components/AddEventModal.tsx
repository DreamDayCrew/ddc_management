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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
import { DatePicker } from './DatePicker';
import { Picker } from './Picker';
import { Switch } from './Switch';
import { Collapsible } from './Collapsible';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  event?: any;
}

const BRAND_MAROON = '#800020';

export default function AddEventModal({ visible, onClose, event }: AddEventModalProps) {
  const queryClient = useQueryClient();
  const { data: config } = useConfiguration();
  
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [registeredDate, setRegisteredDate] = useState<Date>(new Date());
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{event ? 'Edit Event' : 'Add New Event'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Basic Information Section */}
            <Collapsible title="Basic Information" defaultExpanded={true} icon="information-circle">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.eventName}
                  onChangeText={(text) => setFormData({ ...formData, eventName: text })}
                  placeholder="Enter event name"
                  placeholderTextColor="#999"
                />
              </View>

              <Picker
                label="Service Provided *"
                value={formData.providedService}
                onChange={(value) => setFormData({ ...formData, providedService: value })}
                options={services}
                placeholder="Select a service"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Venue *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.venue}
                  onChangeText={(text) => setFormData({ ...formData, venue: text })}
                  placeholder="Event venue location"
                  placeholderTextColor="#999"
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
                <Text style={styles.label}>Source</Text>
                <TextInput
                  style={styles.input}
                  value={formData.source}
                  onChangeText={(text) => setFormData({ ...formData, source: text })}
                  placeholder="How did you find us? (Instagram, Referral, etc.)"
                  placeholderTextColor="#999"
                />
              </View>

              <Picker
                label="Event Status"
                value={formData.eventStatus}
                onChange={(value) => setFormData({ ...formData, eventStatus: value })}
                options={['Inquired', 'In Progress', 'Completed']}
                placeholder="Select status"
              />
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
                  <Text style={styles.label}>Discount Amount</Text>
                  <TextInput
                    style={[styles.input, !formData.discount && styles.inputDisabled]}
                    value={formData.discountAmount}
                    onChangeText={(text) => setFormData({ ...formData, discountAmount: text })}
                    placeholder="Enter discount amount"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    editable={formData.discount}
                  />
                  <Text style={styles.helpText}>The amount discounted from the invoice price</Text>
                </View>
              </View>
            </Collapsible>

            {/* Client Information Section */}
            <Collapsible title="Client Information" defaultExpanded={true} icon="person">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.clientName}
                  onChangeText={(text) => setFormData({ ...formData, clientName: text })}
                  placeholder="Client name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.clientPhone}
                  onChangeText={(text) => setFormData({ ...formData, clientPhone: text })}
                  placeholder="Phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.clientAddress}
                  onChangeText={(text) => setFormData({ ...formData, clientAddress: text })}
                  placeholder="Client address"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.clientEmail}
                  onChangeText={(text) => setFormData({ ...formData, clientEmail: text })}
                  placeholder="email@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </Collapsible>

            {/* Payment Information Section */}
            <Collapsible title="Payment Information" defaultExpanded={true} icon="card">
              <Picker
                label="Payment Mode"
                value={formData.paymentMode}
                onChange={(value) => setFormData({ ...formData, paymentMode: value })}
                options={config?.paymentModes || ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card']}
                placeholder="Select payment mode"
              />

              <Picker
                label="Payment Status"
                value={formData.paymentStatus}
                onChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                options={config?.paymentStatuses || ['Pending', 'Partial', 'Completed', 'Refunded']}
                placeholder="Select payment status"
              />
            </Collapsible>

            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>{event ? 'Update Event' : 'Create Event'}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: '#fff',
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
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
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
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  discountSection: {
    marginBottom: 16,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#9ca3af',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: BRAND_MAROON,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
