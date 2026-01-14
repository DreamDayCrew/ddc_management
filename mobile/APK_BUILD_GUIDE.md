# APK Build & Distribution Guide

## 🎯 Complete Guide to Building and Distributing Dream Day Crew Mobile App

This guide will walk you through building an APK file that your team can install directly on their Android phones.

## ⚙️ Prerequisites Setup (One-Time)

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Create/Login to Expo Account

If you don't have an Expo account:
1. Go to https://expo.dev
2. Sign up for a free account
3. Verify your email

Login via command line:
```bash
eas login
```

### 3. Initialize EAS in Your Project

```bash
cd mobile
eas build:configure
```

This will:
- Create `eas.json` configuration file (already created)
- Link your project to your Expo account
- Generate a project ID

## 🔧 Pre-Build Configuration

### Update Production API URL

Before building, update the API URL to point to your production backend:

**File: `mobile/src/config/environment.ts`**

```typescript
export const config = {
  API_URL: __DEV__ 
    ? 'http://10.0.2.2:5001'  // Development
    : 'https://YOUR-REPLIT-APP.repl.co',  // 👈 Update this!
  // ... rest of config
};
```

**To get your Replit URL:**
1. Go to your Replit project
2. Click "Deploy" or check your deployment URL
3. Copy the full HTTPS URL

## 📦 Building the APK

### Step 1: Start the Build

```bash
cd mobile
eas build --platform android --profile preview
```

**What this does:**
- `--platform android`: Builds for Android only
- `--profile preview`: Creates an APK (not an AAB for Play Store)

### Step 2: Wait for Build

The build process takes **10-15 minutes**. You'll see:

```
✔ Build in progress...
✔ Build finished!
```

### Step 3: Download the APK

After the build completes, you'll get a link:
```
https://expo.dev/artifacts/eas/[unique-id].apk
```

**Two ways to download:**

**Option A: Download to Computer**
1. Click the link or copy-paste in browser
2. Download the APK file
3. Transfer to phones via email/WhatsApp

**Option B: Direct Download on Phone**
1. Open the link directly on Android phone
2. Download APK
3. Install immediately

## 📱 Installing the APK on Android Phones

### For Each Team Member:

1. **Transfer the APK**
   - Send via WhatsApp, email, or Google Drive
   - Or have them open the Expo build link directly

2. **Enable Unknown Sources** (if needed)
   - Go to Settings > Security
   - Enable "Install unknown apps" for your file manager/browser
   - (This is safe - it's your own app!)

3. **Install the App**
   - Open the APK file
   - Tap "Install"
   - Wait for installation to complete
   - Tap "Open" to launch Dream Day Crew

4. **First Launch**
   - App will connect to your backend
   - All data should load from the database
   - If connection fails, check your backend URL configuration

## 🔄 Updating the App (When You Make Changes)

### When to Build a New Version

Build a new APK when you:
- Fix bugs
- Add new features
- Update UI/styling
- Change backend logic

### Update Process

1. **Make your code changes** in the `mobile/` directory

2. **Update version number** in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"  // Increment this
  }
}
```

3. **Build new APK**:
```bash
eas build --platform android --profile preview
```

4. **Distribute to team**:
   - Share new APK link
   - Team members uninstall old version
   - Install new version

**Note:** Team will need to reinstall - auto-updates require Play Store deployment

## 💰 Cost & Limits

### Expo Free Tier Includes:
- **30 builds per month** (plenty for a small team)
- Unlimited team members
- Full feature access

### If You Need More:
- Upgrade to Expo Production plan: $29/month
- Or wait until next month (free tier resets)

## 🐛 Common Issues & Solutions

### Build Fails

**Error: "Invalid credentials"**
- Solution: Run `eas login` again

**Error: "Project not configured"**
- Solution: Run `eas build:configure`

### APK Won't Install

**Error: "App not installed"**
- Solution: Uninstall old version first
- Solution: Clear cache: Settings > Apps > Package Installer > Clear Cache

**Error: "Install blocked"**
- Solution: Enable "Unknown sources" in security settings

### App Can't Connect to Backend

**Symptom: "Failed to load" on all screens**
- Check backend is running (web version should work)
- Verify API URL in `src/config/environment.ts`
- Check backend logs for CORS errors
- Ensure backend URL starts with `https://` (not `http://`)

### App Crashes on Startup

**Solution 1: Rebuild with latest code**
```bash
eas build --platform android --profile preview --clear-cache
```

**Solution 2: Check Expo build logs**
- Go to https://expo.dev
- View your build logs for errors

## 📊 Build History & Management

### View All Builds

```bash
eas build:list
```

### View Build Details

1. Go to https://expo.dev
2. Navigate to your project
3. View "Builds" tab
4. See all APK downloads and build logs

## 🚀 Distribution Best Practices

### For Your 4-Person Team:

**Option 1: WhatsApp Group**
1. Create a team WhatsApp group
2. Share APK link when you build
3. Pin the latest version message

**Option 2: Google Drive**
1. Create shared Drive folder
2. Upload APK with version number
3. Name file: `DreamDayCrew_v1.0.1.apk`

**Option 3: Email**
1. Send APK to team emails
2. Include version number and changelog

## 📝 Version Tracking

Recommended naming convention:

- `v1.0.0` - Initial release
- `v1.0.1` - Bug fixes
- `v1.1.0` - New features
- `v2.0.0` - Major update

Keep a changelog:
```markdown
## v1.0.1 (Date)
- Fixed expense calculation bug
- Updated team members screen

## v1.0.0 (Date)
- Initial release
```

## 🆘 Getting Help

If you encounter issues:

1. **Check Expo Docs**: https://docs.expo.dev/build/setup/
2. **View build logs** on expo.dev
3. **Check backend logs** for API connection issues
4. **Verify configuration** in app.json and eas.json

## ✅ Pre-Distribution Checklist

Before sharing with your team:

- [ ] Backend is deployed and accessible
- [ ] API URL in config points to production
- [ ] Test APK on at least one device
- [ ] All main features work (Dashboard, Events, Expenses, Team, Assets)
- [ ] Data loads correctly
- [ ] Navigation works smoothly
- [ ] Version number updated in app.json

## 📞 Team Installation Instructions

Share this with your team:

---

**Dream Day Crew Mobile App - Installation**

1. Download the APK: [Your APK Link]
2. Open the downloaded file
3. If prompted, allow installation from unknown sources
4. Tap "Install"
5. Open the app
6. All your event data will be loaded automatically!

For issues, contact [Your Contact Info]

---

## 🎉 Success!

Once installed, your team can now:
- ✅ View events on the go
- ✅ Track expenses from anywhere
- ✅ Check team schedules
- ✅ Manage assets remotely
- ✅ All data synced with the web app

No Play Store needed - direct APK works perfectly for small teams!
