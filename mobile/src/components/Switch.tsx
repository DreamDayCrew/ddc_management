import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ value, onValueChange, disabled = false, label }: SwitchProps) {
  const translateX = React.useRef(new Animated.Value(value ? 20 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 20 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.switchContainer,
          value ? styles.switchContainerActive : styles.switchContainerInactive,
          disabled && styles.switchContainerDisabled,
        ]}
      >
        <Animated.View
          style={[
            styles.switchThumb,
            value ? styles.switchThumbActive : styles.switchThumbInactive,
            { transform: [{ translateX }] },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  switchContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  switchContainerActive: {
    backgroundColor: '#800020',
  },
  switchContainerInactive: {
    backgroundColor: '#d1d5db',
  },
  switchContainerDisabled: {
    opacity: 0.5,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchThumbActive: {
    backgroundColor: '#ffffff',
  },
  switchThumbInactive: {
    backgroundColor: '#ffffff',
  },
});