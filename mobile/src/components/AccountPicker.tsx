import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker as RNPicker } from '@react-native-picker/picker';

interface AccountPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  teamMembers?: Array<{ id: string; name: string }>;
  error?: string;
  placeholder?: string;
}

const BRAND_MAROON = '#800020';

export function AccountPicker({ 
  label, 
  value, 
  onChange, 
  teamMembers = [], 
  error, 
  placeholder 
}: AccountPickerProps) {
  const [customNameModalVisible, setCustomNameModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Build account options: DDC Fund + team members + Add custom option
  const teamMemberNames = teamMembers.map(m => m.name);
  const accountOptions = ['DDC Fund', ...teamMemberNames];

  const handleAddCustomName = () => {
    if (customName.trim()) {
      onChange(customName.trim());
      setCustomName('');
      setCustomNameModalVisible(false);
    }
  };

  // Check if current value is a custom name (not in predefined options)
  const isCustomValue = value && !accountOptions.includes(value);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
          <RNPicker
            selectedValue={value}
            onValueChange={(val) => {
              if (val === '__ADD_CUSTOM__') {
                setCustomNameModalVisible(true);
              } else {
                onChange(val);
              }
            }}
            style={styles.picker}
          >
            {placeholder && <RNPicker.Item label={placeholder} value="" />}
            {accountOptions.map((option) => (
              <RNPicker.Item key={option} label={option} value={option} />
            ))}
            {isCustomValue && <RNPicker.Item label={value} value={value} />}
            <RNPicker.Item label="+ Add Custom Name" value="__ADD_CUSTOM__" />
          </RNPicker>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Custom Name Modal */}
      <Modal
        visible={customNameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Account Name</Text>
              <TouchableOpacity onPress={() => setCustomNameModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account name"
                placeholderTextColor="#999"
                value={customName}
                onChangeText={setCustomName}
                editable={!isAddingCustom}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, isAddingCustom && styles.buttonDisabled]}
                onPress={() => setCustomNameModalVisible(false)}
                disabled={isAddingCustom}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, isAddingCustom && styles.buttonDisabled]}
                onPress={handleAddCustomName}
                disabled={isAddingCustom || !customName.trim()}
              >
                {isAddingCustom ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.addButtonText}>Add Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  pickerContainerError: {
    borderColor: '#ef4444',
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: BRAND_MAROON,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
