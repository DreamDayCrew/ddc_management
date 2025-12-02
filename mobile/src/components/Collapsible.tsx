import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: string;
}

export function Collapsible({ title, children, defaultExpanded = false, icon }: CollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : '#000' }]}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={20} 
              color={colors.primary} 
              style={styles.headerIcon} 
            />
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    padding: 16,
  },
});