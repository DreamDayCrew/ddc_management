import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';

const BRAND_MAROON = '#800020';

export default function DashboardScreenSimple() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dream Day Crew</Text>
        <Text style={styles.headerSubtitle}>Dashboard</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Your mobile app is working correctly.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: BRAND_MAROON,
    padding: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
