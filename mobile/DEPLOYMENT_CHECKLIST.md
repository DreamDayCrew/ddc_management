# 🚀 Pre-APK Build Checklist

Before building your APK for distribution, **make sure you complete ALL these steps**:

## ✅ Critical Pre-Build Steps

### 1. Configure Production API URL ⚠️ REQUIRED

**File to update:** `mobile/src/config/environment.ts`

**Current code:**
```typescript
const PRODUCTION_API_URL = process.env.o || 'REPLACE_WITH_YOUR_REPLIT_URL';
```

**What to do:**
1. Deploy your backend on Replit (click "Deploy" button)
2. Copy your deployment URL (something like: `https://your-project-name-username.repl.co`)
3. Replace `'REPLACE_WITH_YOUR_REPLIT_URL'` with your actual URL:

```typescript
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-actual-repl-url.repl.co';
```

**How to verify:** The URL should start with `https://` and end with `.repl.co`

### 2. Test Backend Deployment

1. Open your Replit deployment URL in a browser
2. Add `/api/events` to the URL (e.g., `https://your-url.repl.co/api/events`)
3. You should see your events data in JSON format
4. If you see an error, your backend isn't deployed correctly

### 3. Verify CORS is Working

The backend already has CORS enabled. To verify:
1. Check `server/index.ts` has the CORS middleware
2. Make sure your backend workflow is running

### 4. Update Version Number (Optional but Recommended)

**File:** `mobile/app.json`

Update the version if this isn't your first build:
```json
{
  "expo": {
    "version": "1.0.1"  // Increment for each new build
  }
}
```

## 📝 Quick Start Build Command

Once you've completed the steps above:

```bash
cd mobile
eas build --platform android --profile preview
```

## ⚠️ Common Mistakes

❌ **Forgetting to update API URL** - App will not connect to backend  
❌ **Backend not deployed** - App will show "Failed to load" on all screens  
❌ **Using `http://` instead of `https://`** - Won't work in production APK  
❌ **Testing without restarting** - Changes don't apply until rebuild  

## ✨ After Build Completes

1. Download the APK from the link provided
2. Test it on your own phone first before distributing
3. Verify all screens load data correctly
4. Share APK with your team via WhatsApp/email

## 🔍 How to Get Your Replit Deployment URL

1. Go to your Replit project
2. Look for the "Deploy" button in the top right
3. Click "Deploy" if not already deployed
4. Copy the deployment URL shown
5. Format: `https://[project-name]-[username].repl.co`

## 📱 Testing Your APK

After downloading:
1. Install on your Android phone
2. Open the app
3. Check each tab loads:
   - ✅ Dashboard shows statistics
   - ✅ Events list displays your events
   - ✅ Expenses shows transactions
   - ✅ Team displays members
   - ✅ Assets shows inventory

If any screen shows "Failed to load", your API URL is likely incorrect.

## 🆘 If Build Fails

1. **"Project not configured"**: Run `eas build:configure`
2. **"Invalid credentials"**: Run `eas login` again
3. **"Build failed"**: Check build logs on expo.dev
4. **Other errors**: See `APK_BUILD_GUIDE.md` for troubleshooting

## 📚 Next Steps

After successful build and testing:
- [ ] Share APK with team
- [ ] Send installation instructions
- [ ] Provide support info (your contact)
- [ ] Keep APK file backed up

Remember: Every time you make code changes, you'll need to rebuild the APK!
