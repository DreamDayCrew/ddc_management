import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useUser } from "../contexts";
import DashboardScreen from "../screens/DashboardScreen";
import EventsStackNavigator from "./EventsStackNavigator";
import RentalsStackNavigator from "./RentalsStackNavigator";
import ExpensesScreen from "../screens/ExpensesScreen";
import ReportsScreen from "../screens/ReportsScreen";
import MoreStackNavigator from "./MoreStackNavigator";

const Tab = createBottomTabNavigator();

const BRAND_MAROON = "#800020";
const BRAND_MAROON_LIGHT = "#a0203a";

export default function BottomTabNavigator() {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  
  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Dashboard") {
            iconName = focused ? "analytics" : "analytics-outline";
          } else if (route.name === "Events") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Service") {
            iconName = focused ? "briefcase" : "briefcase-outline";
          } else if (route.name === "Reports") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "More") {
            iconName = focused ? "menu" : "menu-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: isDark ? "#2d3748" : BRAND_MAROON,
          elevation: 4,
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          color: "#ffffff",
        },
        headerTintColor: "#ffffff",
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerTitle: `Hi ${firstName}, Welcome!` }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Service"
        component={RentalsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ headerTitle: "Reports" }}
      />
      <Tab.Screen
        name="More"
        component={MoreStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
