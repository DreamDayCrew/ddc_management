// Environment configuration for mobile app
// When testing with Expo Go, you'll need to update the API_URL to point to your development server

export const config = {
  // Update this with your actual backend URL
  // For Android emulator: http://10.0.2.2:5000
  // For iOS simulator: http://localhost:5000
  // For physical device: http://<YOUR_COMPUTER_IP>:5000
  // For Replit deployment: https://your-app-name.repl.co
  API_URL: __DEV__ 
    ? 'http://10.0.2.2:5000'  // Default for Android emulator
    : 'https://your-replit-app-url.repl.co',  // Update with production URL
  
  API_TIMEOUT: 10000,
  
  // App metadata
  APP_NAME: 'Dream Day Crew',
  APP_VERSION: '1.0.0',
};

export default config;
