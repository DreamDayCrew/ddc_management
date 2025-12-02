import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../contexts';

interface ThemedViewProps extends ViewProps {
  backgroundColor?: 'background' | 'card' | 'surface' | 'primary';
  borderColor?: 'border' | 'primary' | 'error';
  children?: React.ReactNode;
}

export function ThemedView({
  backgroundColor = 'background',
  borderColor,
  style,
  children,
  ...props
}: ThemedViewProps) {
  const { colors } = useTheme();

  const themedStyle = {
    backgroundColor: colors[backgroundColor],
    ...(borderColor && { borderColor: colors[borderColor] }),
  };

  return (
    <View style={[themedStyle, style]} {...props}>
      {children}
    </View>
  );
}