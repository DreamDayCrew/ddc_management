import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinCode?: string;
}

interface SecurityContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  securitySettings: SecuritySettings;
  authenticate: () => Promise<boolean>;
  setAuthenticated: (value: boolean) => void;
  updateSecuritySettings: (settings: SecuritySettings) => Promise<void>;
  logout: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const SECURITY_SETTINGS_KEY = '@security_settings';

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    pinEnabled: false,
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SECURITY_SETTINGS_KEY);
      if (saved) {
        const settings = JSON.parse(saved);
        setSecuritySettings(settings);
        
        // If any security is enabled, user needs to authenticate
        if (settings.pinEnabled || settings.biometricEnabled) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(true); // No security set up
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      setIsAuthenticated(true); // Fail safe
    } finally {
      setIsLoading(false);
    }
  };

  const updateSecuritySettings = async (settings: SecuritySettings) => {
    try {
      await AsyncStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
      setSecuritySettings(settings);
      
      // If no security is enabled, authenticate automatically
      if (!settings.pinEnabled && !settings.biometricEnabled) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      throw error;
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      if (securitySettings.biometricEnabled) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access Dream Day Crew',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });
          
          if (result.success) {
            setIsAuthenticated(true);
            return true;
          }
        }
        return false;
      } else if (securitySettings.pinEnabled) {
        // PIN authentication will be handled by the PIN screen
        return false;
      } else {
        // No security enabled
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const setAuthenticated = (value: boolean) => {
    setIsAuthenticated(value);
  };

  const logout = () => {
    console.log('SecurityContext: logout() called');
    console.log('SecurityContext: setting isAuthenticated to false');
    setIsAuthenticated(false);
  };

  return (
    <SecurityContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        securitySettings,
        authenticate,
        setAuthenticated,
        updateSecuritySettings,
        logout,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};