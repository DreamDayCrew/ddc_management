import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep showing on iOS
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, { backgroundColor: colors.card, borderColor: error ? colors.error : colors.border }]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.inputText, { color: colors.text }]}>
          {value.toLocaleDateString()}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      
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
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputError: {
    // Will be handled dynamically
  },
  inputText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
