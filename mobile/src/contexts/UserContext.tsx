import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MobileUser {
  id: string;
  name: string;
  designation: string;
}

interface UserContextType {
  user: MobileUser | null;
  isUserLoading: boolean;
  isUserIdentified: boolean;
  setUser: (user: MobileUser) => Promise<void>;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@ddc_mobile_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<MobileUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const saved = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        const userData = JSON.parse(saved);
        setUserState(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsUserLoading(false);
    }
  };

  const setUser = async (userData: MobileUser) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUserState(userData);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  };

  const clearUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUserState(null);
    } catch (error) {
      console.error('Error clearing user:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isUserLoading,
        isUserIdentified: user !== null,
        setUser,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
