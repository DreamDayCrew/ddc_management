import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import AssetsScreen from '../screens/AssetsScreen';
import TeamScreen from '../screens/TeamScreen';
import VendorsScreen from '../screens/VendorsScreen';
import CatalogScreen from '../screens/CatalogScreen';
import GalleryScreen from '../screens/GalleryScreen';
import ConfigurationScreen from '../screens/ConfigurationScreen';
import AppConfigurationScreen from '../screens/AppConfigurationScreen';
import RentalRatesScreen from '../screens/RentalRatesScreen';
import { useTheme, useUser } from '../contexts';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Dashboard: undefined;
  Expenses: undefined;
  Assets: undefined;
  RentalRates: undefined;
  Team: undefined;
  Vendors: undefined;
  Catalog: undefined;
  Gallery: undefined;
  Configuration: undefined;
  AppConfiguration: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const BRAND_MAROON = '#800020';

export default function MoreStackNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  
  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'User';
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#2d3748' : BRAND_MAROON,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          color: '#ffffff',
        },
        headerTintColor: '#ffffff',
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen 
        name="MoreMenu" 
        component={MoreScreen}
        options={{ title: 'More' }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: `Hi ${firstName}, Welcome!` }}
      />
      <Stack.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{ title: 'Expenses' }}
      />
      <Stack.Screen 
        name="Assets" 
        component={AssetsScreen}
        options={({ navigation }) => ({ 
          title: 'Assets',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // If can't go back in stack, navigate to Dashboard
                  navigation.getParent()?.dispatch(
                    CommonActions.navigate('Dashboard')
                  );
                }
              }}
              style={{ marginLeft: 0 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Team" 
        component={TeamScreen}
        options={({ navigation }) => ({ 
          title: 'Team Members',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // If can't go back in stack, navigate to Dashboard
                  navigation.getParent()?.dispatch(
                    CommonActions.navigate('Dashboard')
                  );
                }
              }}
              style={{ marginLeft: 0 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Vendors" 
        component={VendorsScreen}
        options={{ title: 'Vendors' }}
      />
      <Stack.Screen 
        name="Catalog" 
        component={CatalogScreen}
        options={{ title: 'Service Catalog' }}
      />
      <Stack.Screen 
        name="Gallery" 
        component={GalleryScreen}
        options={{ title: 'DDC Gallery' }}
      />
      <Stack.Screen 
        name="Configuration" 
        component={ConfigurationScreen}
        options={{ title: 'Business Configuration' }}
      />
      <Stack.Screen 
        name="AppConfiguration" 
        component={AppConfigurationScreen}
        options={{ title: 'App Configuration' }}
      />
      <Stack.Screen 
        name="RentalRates" 
        component={RentalRatesScreen}
        options={{ title: 'Rental Rates' }}
      />
    </Stack.Navigator>
  );
}
