import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { useTheme } from '../contexts';

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetails: { eventId: string };
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

const BRAND_MAROON = '#800020';

export default function EventsStackNavigator() {
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
        name="EventsList" 
        component={EventsScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ title: 'Event Details' }}
      />
    </Stack.Navigator>
  );
}
