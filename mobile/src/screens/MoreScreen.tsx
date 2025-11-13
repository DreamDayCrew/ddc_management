import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  }
];

const settingsMenu: MenuItem[] = [
  {
    id: 'configuration',
    title: 'Business Configuration',
    icon: 'settings',
    screen: 'Configuration',
    description: 'Configure business settings'
  }
];

export default function MoreScreen({ navigation }: any) {
  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => navigation.navigate(item.screen)}
      data-testid={`button-navigate-${item.id}`}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons name={item.icon} size={24} color={BRAND_MAROON} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('@assets/Logo Sticker_1763031270643.jpeg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <View style={styles.menuList}>
          {resourcesMenu.map(renderMenuItem)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuList}>
          {settingsMenu.map(renderMenuItem)}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Dream Day Crew</Text>
        <Text style={styles.footerSubtext}>Event Management System v1.0</Text>
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
