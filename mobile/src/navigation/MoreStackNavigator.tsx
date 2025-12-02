import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MoreScreen from '../screens/MoreScreen';
import AssetsScreen from '../screens/AssetsScreen';
import TeamScreen from '../screens/TeamScreen';
import VendorsScreen from '../screens/VendorsScreen';
import ConfigurationScreen from '../screens/ConfigurationScreen';
import AppConfigurationScreen from '../screens/AppConfigurationScreen';
import { useTheme } from '../contexts';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Assets: undefined;
  Team: undefined;
  Vendors: undefined;
  Configuration: undefined;
  AppConfiguration: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const BRAND_MAROON = '#800020';

export default function MoreStackNavigator() {
  const { colors, isDark } = useTheme();
  
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
        name="Assets" 
        component={AssetsScreen}
        options={{ title: 'Assets' }}
      />
      <Stack.Screen 
        name="Team" 
        component={TeamScreen}
        options={{ title: 'Team Members' }}
      />
      <Stack.Screen 
        name="Vendors" 
        component={VendorsScreen}
        options={{ title: 'Vendors' }}
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
    </Stack.Navigator>
  );
}
