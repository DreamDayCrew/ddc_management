import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import EventsScreen from '../screens/EventsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import TeamScreen from '../screens/TeamScreen';
import AssetsScreen from '../screens/AssetsScreen';

const Tab = createBottomTabNavigator();

// Simple icon component (you can replace with icon library later)
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    Events: '📅',
    Expenses: '💰',
    Team: '👥',
    Assets: '📦',
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[name]}</Text>
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: '#1f2937',
        },
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
