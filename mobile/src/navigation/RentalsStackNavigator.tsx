import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RentalsScreen from '../screens/RentalsScreen';
import RentalDetailsScreen from '../screens/RentalDetailsScreen';
import { useTheme } from '../contexts';

export type RentalsStackParamList = {
  RentalsList: undefined;
  RentalDetails: { id?: string };
};

const Stack = createNativeStackNavigator<RentalsStackParamList>();

const BRAND_MAROON = '#800020';

export default function RentalsStackNavigator() {
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
        name="RentalsList" 
        component={RentalsScreen}
        options={{ title: 'Service Orders' }}
      />
      <Stack.Screen 
        name="RentalDetails" 
        component={RentalDetailsScreen}
        options={{ title: 'Service Details' }}
      />
    </Stack.Navigator>
  );
}
