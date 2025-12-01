// Environment configuration for mobile app
/// <reference types="@types/react-native" />

const PRODUCTION_API_URL = 'https://ddc-management.onrender.com';
// Use your computer's local IP address for development on physical devices
// Server is running on port 5000
const LOCAL_DEV_URL = 'http://172.19.129.244:5000';

export const config = {
  API_URL: __DEV__ 
    ? LOCAL_DEV_URL            // Local development server (localhost:5000)
    : PRODUCTION_API_URL,      // Production deployment URL
  
  API_TIMEOUT: 10000,
  
  // App metadata
  APP_NAME: 'Dream Day Crew',
  APP_VERSION: '1.0.0',
};

// Validation helper - warn if production URL not configured
if (!__DEV__ && config.API_URL === PRODUCTION_API_URL) {
  console.error(
    '⚠️ PRODUCTION API URL NOT CONFIGURED!\n' +
    'Update PRODUCTION_API_URL in mobile/src/config/environment.ts\n' +
    'before building APK for distribution.'
  );
}

export default config;
