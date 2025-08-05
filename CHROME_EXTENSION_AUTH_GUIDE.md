# 🔌 Chrome Extension Authentication Setup

## Overview
The BMV Finder Chrome extension now supports proper authentication with your main application account. This allows you to:

- ✅ Sign in with your existing BMV Finder account
- ✅ Sync captured properties with your watchlist
- ✅ Access your subscription limits and features
- ✅ Use the extension across multiple devices

## How to Sign In

### Step 1: Install the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the `chrome-extension/` folder
4. The BMV Finder extension should now appear in your extensions list

### Step 2: Sign In to Your Account
1. **Click the BMV Finder extension icon** in your Chrome toolbar
2. **Click the "Sign In" button** (blue button in the extension popup)
3. **A new tab will open** with the authentication page
4. **Sign in** with your Google account or email/password
5. **You'll be automatically redirected** back to the extension
6. **The extension will now show your account details** and limits

### Step 3: Start Capturing Properties
1. **Visit any property website** (Rightmove, Zoopla, etc.)
2. **Look for the "Capture Property" button** (usually appears on property pages)
3. **Click it to save the property** to your watchlist
4. **Check your extension** to see captured properties

## Account Tiers & Limits

| Plan | Capture Limit | Features |
|------|---------------|----------|
| **Free** | 5 properties | Basic capture |
| **Mid-Tier** | 50 properties | Enhanced features |
| **Premium** | Unlimited | All features |

## Troubleshooting

### "Demo User" Still Showing
- **Clear extension data**: Right-click extension → Options → Clear Data
- **Reinstall extension**: Remove and reload the extension
- **Check authentication**: Make sure you're signed in on the main site

### Properties Not Syncing
- **Check internet connection**: Extension needs to connect to the API
- **Verify authentication**: Make sure you're signed in
- **Check API status**: Visit the main site to ensure it's working

### Sign In Button Not Working
- **Check URL**: Make sure the extension is pointing to the correct deployment
- **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
- **Try incognito mode**: Test in a private browsing window

## Technical Details

### Authentication Flow
1. Extension opens authentication page with callback URL
2. User signs in on main application
3. Authentication page redirects back to extension with token
4. Extension stores token and validates with API
5. Extension shows user account details and limits

### API Endpoints Used
- `GET /api/user/membership` - Get user account details and limits
- `POST /api/properties/capture` - Save captured properties
- `GET /api/watchlist` - Get user's watchlist

### Storage
- **Local Storage**: Properties captured offline
- **Chrome Storage**: Authentication tokens and user data
- **Main Application**: Synced watchlist and account data

## Development Notes

### Local Development
To test locally, update the API URL in `background.js`:
```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Local
// const API_BASE_URL = 'https://your-deployment.vercel.app/api'; // Production
```

### Extension Permissions
The extension requires these permissions:
- `storage` - Save captured properties and auth data
- `tabs` - Open authentication pages
- `activeTab` - Access property page data
- `scripting` - Inject content scripts

### Security
- Authentication tokens are stored securely in Chrome storage
- API calls use Bearer token authentication
- Extension validates tokens with main application
- Failed authentication clears stored data automatically 