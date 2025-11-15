import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { queryClient } from './src/lib/queryClient';
import { useNetworkConnectivity } from './src/hooks/useNetworkConnectivity';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';

export default function App() {
  const { isConnected, hasChecked } = useNetworkConnectivity();

  // Show a loading indicator while checking network connectivity
  if (!hasChecked) {
    return (
      <SafeAreaProvider style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <NetworkStatusBanner />
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <BottomTabNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}
