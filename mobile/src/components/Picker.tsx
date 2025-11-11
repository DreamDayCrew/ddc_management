import { View, Text, StyleSheet } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';

interface PickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
  placeholder?: string;
}

export function Picker({ label, value, onChange, options, error, placeholder }: PickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, error && styles.pickerContainerError]}>
        <RNPicker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
        >
          {placeholder && <RNPicker.Item label={placeholder} value="" />}
          {options.map((option) => (
            <RNPicker.Item key={option} label={option} value={option} />
          ))}
        </RNPicker>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
});
