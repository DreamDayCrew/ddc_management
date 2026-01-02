import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { queryClient } from './src/lib/queryClient';
import { useNetworkConnectivity } from './src/hooks/useNetworkConnectivity';
import NetworkStatusBanner from './src/components/NetworkStatusBanner';
import { SecurityProvider, useSecurity, UserProvider, useUser } from './src/contexts';
import { ThemeProvider, useTheme } from './src/contexts';
import AuthenticationScreen from './src/screens/AuthenticationScreen';
import UserIdentificationScreen from './src/screens/UserIdentificationScreen';

function AppContent() {
  const { isConnected, hasChecked } = useNetworkConnectivity();
  const { isAuthenticated, isLoading } = useSecurity();
  const { isUserIdentified, isUserLoading } = useUser();
  const { colors, isDark } = useTheme();

  // Show loading indicator while checking network connectivity, user, or authentication
  if (!hasChecked || isLoading || isUserLoading) {
    return (
      <SafeAreaProvider style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaProvider>
    );
  }

  // Show user identification screen if user not identified
  if (!isUserIdentified) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <UserIdentificationScreen />
          <StatusBar style={isDark ? "light" : "dark"} />
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  // Show authentication screen if not authenticated (but user is identified)
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <AuthenticationScreen />
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaProvider>
    );
  }

  // Show main app if user identified and authenticated
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <NetworkStatusBanner />
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <BottomTabNavigator />
            <StatusBar style={isDark ? "light" : "dark"} />
          </NavigationContainer>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SecurityProvider>
          <AppContent />
        </SecurityProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
