import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkConnectivity } from '../hooks/useNetworkConnectivity';

const NetworkStatusBanner: React.FC = () => {
  const { isConnected } = useNetworkConnectivity();

  if (isConnected === null || isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={16} color="#ffffff" />
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    zIndex: 9999,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default NetworkStatusBanner;
