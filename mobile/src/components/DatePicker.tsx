import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep showing on iOS
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, error && styles.inputError]}
        onPress={() => setShow(true)}
      >
        <Text style={styles.inputText}>
          {value.toLocaleDateString()}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
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
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputText: {
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
