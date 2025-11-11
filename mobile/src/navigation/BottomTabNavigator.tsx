import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import EventsScreen from '../screens/EventsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import TeamScreen from '../screens/TeamScreen';
import AssetsScreen from '../screens/AssetsScreen';

const Tab = createBottomTabNavigator();

const BRAND_MAROON = '#800020';
const BRAND_MAROON_LIGHT = '#a0203a';

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Team') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Assets') {
            iconName = focused ? 'cube' : 'cube-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: BRAND_MAROON,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: BRAND_MAROON,
          elevation: 4,
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          color: '#ffffff',
        },
        headerTintColor: '#ffffff',
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ headerTitle: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventsScreen}
        options={{ headerTitle: 'Events' }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{ headerTitle: 'Expenses' }}
      />
      <Tab.Screen 
        name="Team" 
        component={TeamScreen}
        options={{ headerTitle: 'Team' }}
      />
      <Tab.Screen 
        name="Assets" 
        component={AssetsScreen}
        options={{ headerTitle: 'Assets' }}
      />
    </Tab.Navigator>
  );
}
