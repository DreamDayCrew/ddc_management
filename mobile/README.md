# Dream Day Crew Mobile App

React Native mobile application for Dream Day Crew event management system.

## 📱 Features

- **Dashboard**: View event statistics and overview
- **Events**: Manage events with detailed information
- **Expenses**: Track expenses and financial transactions
- **Team**: View team members and their roles
- **Assets**: Manage inventory and assets

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- Expo Go app on your Android phone (download from Play Store)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies (already done):
```bash
npm install
```

### Configuration

**Important**: Before running the app, update the API URL in `src/config/environment.ts`:

For testing with Expo Go on a physical Android device:
1. Find your computer's IP address:
   - Windows: Run `ipconfig` in command prompt
   - Mac/Linux: Run `ifconfig` or `ip addr`
2. Update `src/config/environment.ts`:
```typescript
API_URL: __DEV__ 
  ? 'http://YOUR_COMPUTER_IP:5000'  // Replace YOUR_COMPUTER_IP
  : 'https://your-replit-app-url.repl.co',
```

For testing with Android Emulator:
- Use `http://10.0.2.2:5000` (already configured as default)

## 🏃 Running the App

### Method 1: Expo Go (Recommended for Testing)

1. Make sure your backend server is running:
```bash
# From the root directory
npm run dev
```

2. Start the Expo development server:
```bash
cd mobile
npm start
```

3. Scan the QR code with Expo Go app on your Android phone
   - Make sure your phone and computer are on the same WiFi network

### Method 2: Test in Browser (Limited functionality)

```bash
npm run web
```

## 📦 Building APK for Distribution

### Setup Expo EAS (One-time)

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure the project:
```bash
eas build:configure
```

### Build APK

1. Update the API URL in `src/config/environment.ts` to point to your production backend

2. Run the build command:
```bash
eas build --platform android --profile preview
```

3. Wait for the build to complete (10-15 minutes)

4. Download the APK file from the provided link

5. Share the APK file with your team via email/WhatsApp

### Installing the APK

1. Transfer the APK file to your Android phone
2. Open the file on your phone
3. Allow installation from unknown sources if prompted
4. Install and open Dream Day Crew app

## 🔧 Troubleshooting

### Can't connect to backend

- Verify your backend server is running
- Check that the API URL in `src/config/environment.ts` is correct
- For physical devices, ensure phone and computer are on same WiFi
- Check that CORS is enabled on the backend (already configured)

### App crashes on startup

- Check the Expo console for error messages
- Verify all dependencies are installed: `npm install`
- Clear Expo cache: `npx expo start --clear`

### Expo Go not scanning QR code

- Make sure Expo Go app is updated to latest version
- Try entering the URL manually in Expo Go app
- Check firewall settings on your computer

## 📱 Testing Checklist

Before distributing the APK, test these features:

- [ ] Dashboard loads with event statistics
- [ ] Events list displays all events
- [ ] Expenses list shows transactions
- [ ] Team members page displays correctly
- [ ] Assets inventory is visible
- [ ] All navigation tabs work
- [ ] Data refreshes when pulling down

## 🔄 Updating the App

When you make code changes:

1. For Expo Go testing:
   - Save your changes
   - App will reload automatically

2. For APK distribution:
   - Make your changes
   - Build new APK: `eas build --platform android --profile preview`
   - Share new APK with team

## 📝 Notes

- This app connects to the same backend as the web app
- All data is shared between web and mobile
- APK builds are free with Expo (limited builds per month)
- For production app store deployment, additional configuration needed

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev
3. Check backend logs for API errors
