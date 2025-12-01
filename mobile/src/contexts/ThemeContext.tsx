import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type Theme = 'dark' | 'light' | 'system';

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
};

const lightColors: ThemeColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#d1d5db',
  primary: '#800020',
  primaryText: '#ffffff',
  surface: '#ffffff',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

const darkColors: ThemeColors = {
  background: '#111827',
  card: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#374151',
  primary: '#800020',
  primaryText: '#ffffff',
  surface: '#374151',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() || 'light'
  );

  // Determine if dark mode should be active
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  
  // Get current colors based on theme
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    // Load saved theme preference
    loadTheme();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme || 'light');
    });

    return () => subscription?.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    colors,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};