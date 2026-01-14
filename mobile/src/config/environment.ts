// Environment configuration for mobile app
// <reference types="@types/react-native" />
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://ddc-management.onrender.com";
// Use your computer's local IP address for development on physical devices
// Server is running on port 5000
const LOCAL_DEV_URL = "http://172.19.129.244:5000";
// Replit dev domain for Expo web testing
const REPLIT_DEV_URL = "https://bb12acae-60e8-4eae-9bde-1dd0cd160edf-00-2pci5166o6bfr.riker.replit.dev";

// Determine the correct API URL based on platform and environment
const getApiUrl = (): string => {
  // Always use production URL for deployed apps
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // For Expo web mode (running in browser on Replit), use Replit dev domain
  if (Platform.OS === "web") {
    return REPLIT_DEV_URL;
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
