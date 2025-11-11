// Environment configuration for mobile app
// IMPORTANT: Update the PRODUCTION_API_URL before building APK for distribution

// Get the Replit deployment URL from environment or use placeholder
// To get your URL: Deploy your app on Replit and copy the deployment URL
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'REPLACE_WITH_YOUR_REPLIT_URL';

export const config = {
  // API URL based on environment
  // Development: Uses Android emulator localhost or your local IP
  // Production: Uses your Replit deployment URL
  API_URL: __DEV__ 
    ? 'http://10.0.2.2:5000'  // Android emulator (use your computer's IP for physical device)
    : PRODUCTION_API_URL,      // REPLACE_WITH_YOUR_REPLIT_URL before building APK!
  
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
