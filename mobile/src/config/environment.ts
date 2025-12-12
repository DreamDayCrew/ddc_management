// Environment configuration for mobile app
// <reference types="@types/react-native" />
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://ddc-management.onrender.com";
// Use your computer's local IP address for development on physical devices
// Server is running on port 5000
const LOCAL_DEV_URL = "http://172.19.129.244:5000";

// Determine the correct API URL based on platform and environment
const getApiUrl = (): string => {
  // Always use production URL for deployed apps
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // For Expo web mode (running in browser), use production backend
  // since localhost/LAN IPs don't work properly in browser context
  if (Platform.OS === "web") {
    // Use production API for Expo web testing
    return LOCAL_DEV_URL;
  }

  // For native development (Android/iOS emulator or physical device)
  return LOCAL_DEV_URL;
};

export const config = {
  API_URL: getApiUrl(),

  API_TIMEOUT: 10000,

  // App metadata
  APP_NAME: "Dream Day Crew",
  APP_VERSION: "1.0.0",
};

// Log which API URL is being used in development
if (__DEV__) {
  console.log(`📱 API URL: ${config.API_URL} (Platform: ${Platform.OS})`);
}

export default config;
