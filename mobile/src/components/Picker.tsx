import { View, Text, StyleSheet } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { useTheme } from '../contexts';

interface PickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
  placeholder?: string;
}

export function Picker({ label, value, onChange, options, error, placeholder }: PickerProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: error ? colors.error : colors.border }]}>
        <RNPicker
          selectedValue={value}
          onValueChange={onChange}
          style={[styles.picker, { color: colors.text }]}
        >
          {placeholder && <RNPicker.Item label={placeholder} value="" color={colors.textSecondary} />}
          {options.map((option) => (
            <RNPicker.Item key={option} label={option} value={option} color={colors.text} />
          ))}
        </RNPicker>
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  pickerContainerError: {
    // Will be handled dynamically
  },
  picker: {
    height: 50,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
