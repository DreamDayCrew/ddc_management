import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import EventsScreen from '../screens/EventsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import TeamScreen from '../screens/TeamScreen';
import AssetsScreen from '../screens/AssetsScreen';

const Tab = createBottomTabNavigator();

// Simple text-based tab labels (icon library can be added later if desired)
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const getInitial = (tabName: string) => {
    const initials: Record<string, string> = {
      Dashboard: 'D',
      Events: 'E',
      Expenses: 'X',
      Team: 'T',
      Assets: 'A',
    };
    return initials[tabName] || tabName[0];
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 14, backgroundColor: focused ? '#2563eb' : 'transparent' }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: focused ? '#ffffff' : '#9ca3af' }}>
        {getInitial(name)}
      </Text>
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
