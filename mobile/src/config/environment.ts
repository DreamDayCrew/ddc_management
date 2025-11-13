// Environment configuration for mobile app
// IMPORTANT: Update the PRODUCTION_API_URL before building APK for distribution

// Get the Replit deployment URL from environment or use placeholder
// To get your URL: Deploy your app on Replit and copy the deployment URL
const PRODUCTION_API_URL = 'https://ddc-management.onrender.com';

// Replit development URL - automatically works with Expo Go on physical devices
const REPLIT_DEV_URL = 'https://11f1ac2b-9680-4ae7-a0f5-0f47d2dbbf65-00-156r0awcxd3y4.kirk.replit.dev';

export const config = {
  // API URL based on environment
  // Development: Uses Replit dev URL (accessible from phone via Expo Go)
  // Production: Uses your deployment URL
  API_URL: __DEV__ 
    ? REPLIT_DEV_URL           // Replit development server (works with Expo Go)
    : PRODUCTION_API_URL,      // Production deployment URL
  
  API_TIMEOUT: 10000,
  
  // App metadata
  APP_NAME: 'Dream Day Crew',
  APP_VERSION: '1.0.0',
};

// Validation helper - warn if production URL not configured
if (!__DEV__ && config.API_URL === 'REPLACE_WITH_YOUR_REPLIT_URL') {
  console.error(
    '⚠️ PRODUCTION API URL NOT CONFIGURED!\n' +
    'Update PRODUCTION_API_URL in mobile/src/config/environment.ts\n' +
    'before building APK for distribution.'
  );
}

export default config;
