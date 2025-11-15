import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export const useNetworkConnectivity = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      
      // Only show alert on first check if not connected
      if (!hasChecked && !connected) {
        setHasChecked(true);
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection to use the app properly.',
          [{ text: 'OK', style: 'default' }]
        );
      } else if (!hasChecked) {
        setHasChecked(true);
      }
      
      setIsConnected(connected);
    });

    return () => unsubscribe();
  }, [hasChecked]);

  return { isConnected, hasChecked };
};
