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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useConfiguration } from '../hooks/useApi';
import { DatePicker } from './DatePicker';
import { Picker } from './Picker';

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
  const [formData, setFormData] = useState({
    eventName: '',
    providedService: '',
    venue: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    clientEmail: '',
    eventStatus: 'Inquired',
  });

  // Sync form data when event prop changes
  useEffect(() => {
    if (event && visible) {
      setFormData({
        eventName: event.eventName || '',
        providedService: event.providedService || '',
        venue: event.venue || '',
        clientName: event.clientName || '',
        clientPhone: event.clientPhone || '',
        clientAddress: event.clientAddress || '',
        clientEmail: event.clientEmail || '',
        eventStatus: event.eventStatus || 'Inquired',
      });
      setEventDate(event.eventDate ? new Date(event.eventDate) : new Date());
    } else if (!visible) {
      resetForm();
    }
  }, [event, visible]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { eventDate: string }) => {
      if (event) {
        return await api.updateEvent(event.id, data as any);
      }
      return await api.createEvent(data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setFormData({
      eventName: '',
      providedService: '',
      venue: '',
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientEmail: '',
      eventStatus: 'Inquired',
    });
    setEventDate(new Date());
  };

  const handleSubmit = () => {
    if (!formData.eventName || !formData.venue || !formData.providedService) {
      alert('Please fill in Event Name, Service, and Venue');
      return;
    }
    
    const submitData = {
      ...formData,
      eventDate: eventDate.toISOString().split('T')[0],
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
              label="Event Date *"
              value={eventDate}
              onChange={setEventDate}
            />

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
    maxHeight: '90%',
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
