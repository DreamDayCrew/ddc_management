// Environment configuration for mobile app
// <reference types="@types/react-native" />
import { Platform } from "react-native";

const PRODUCTION_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://ddc-management.onrender.com";

const LOCAL_DEV_URL =
  process.env.EXPO_PUBLIC_LOCAL_DEV_URL ?? "http://localhost:5000";

const getApiUrl = (): string => {
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }
  if (Platform.OS === "web") {
    return LOCAL_DEV_URL;
  }
  return LOCAL_DEV_URL;
};

export const config = {
  API_URL: getApiUrl(),
  API_TIMEOUT: Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 10000),
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME ?? "Dream Day Crew",
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION ?? "1.0.0",
};

if (__DEV__) {
  console.log(`📱 API URL: ${config.API_URL} (Platform: ${Platform.OS})`);
}

export default config;
