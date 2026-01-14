import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurity } from '../contexts';
import { useTheme } from '../contexts';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const BRAND_MAROON = '#800020';

type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
  description: string;
};

const resourcesMenu: MenuItem[] = [
  {
    id: 'assets',
    title: 'Assets',
    icon: 'cube',
    screen: 'Assets',
    description: 'Manage equipment and resources'
  },
  {
    id: 'rental-rates',
    title: 'Rental Rates',
    icon: 'pricetag',
    screen: 'RentalRates',
    description: 'Set pricing for asset rentals'
  },
  {
    id: 'team',
    title: 'Team Members',
    icon: 'people',
    screen: 'Team',
    description: 'Manage your team'
  },
  {
    id: 'vendors',
    title: 'Vendors',
    icon: 'business',
    screen: 'Vendors',
    description: 'Manage vendor relationships'
  },
  {
    id: 'catalog',
    title: 'Service Catalog',
    icon: 'book',
    screen: 'Catalog',
    description: 'View and manage service packages'
  },
  {
    id: 'gallery',
    title: 'DDC Gallery',
    icon: 'images',
    screen: 'Gallery',
    description: 'View all event images'
  }
];

const settingsMenu: MenuItem[] = [
  {
    id: 'configuration',
    title: 'Business Configuration',
    icon: 'settings',
    screen: 'Configuration',
    description: 'Configure business settings'
  },
  {
    id: 'app-configuration',
    title: 'App Configuration',
    icon: 'lock-closed',
    screen: 'AppConfiguration',
    description: 'Security and app settings'
  }
];

export default function MoreScreen({ navigation }: any) {
  const { securitySettings, logout } = useSecurity();
  const { colors, isDark } = useTheme();

  const handleLogout = () => {
    
    if (securitySettings.pinEnabled || securitySettings.biometricEnabled) {
      logout();
    } else {
      Alert.alert(
        'No Security Enabled', 
        'Please enable PIN or biometric authentication in App Configuration to use this feature.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };
  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => navigation.navigate(item.screen)}
      data-testid={`button-navigate-${item.id}`}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: isDark ? colors.surface : 'rgba(128, 0, 32, 0.1)' }]}>
        <Ionicons name={item.icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/*<View style={styles.header}>
        <Image 
          source={require('../../assets/ddc-logo.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View> */}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Resources</Text>
        <View style={styles.menuList}>
          {resourcesMenu.map(renderMenuItem)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Settings</Text>
        <View style={styles.menuList}>
          {settingsMenu.map(renderMenuItem)}
        </View>
      </View>

      {/* Security Section */}
      {(securitySettings.pinEnabled || securitySettings.biometricEnabled) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security</Text>
          <View style={styles.menuList}>
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2' }]}>
                <Ionicons name="log-out-outline" size={24} color={colors.error} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.error }]}>Lock App</Text>
                <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>Lock the app and require authentication</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.text }]}>Dream Day Crew</Text>
        <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Event Management System v1.0.27</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    padding: 24,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  logo: {
    width: 200,
    height: 80,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
