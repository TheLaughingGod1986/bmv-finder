# Live OAuth Redirect Fix

## Problem
When logging in on your live site (https://bmvfinder.com), you're being redirected to `localhost:3000` instead of staying on the live domain.

## Root Cause
OAuth redirect URLs in Supabase and Google Cloud Console are still pointing to localhost instead of your live domain.

## Solution Steps

### Step 1: Update Supabase OAuth Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `qrxcfmbkdfhv2c4xyv3csy.supabase.co`
3. **Navigate to**: Authentication → URL Configuration
4. **Update these settings**:

```
Site URL: https://bmvfinder.com

Redirect URLs (add these):
- https://bmvfinder.com/auth/callback
- https://bmvfinder.com/account
- https://bmvfinder.com/
```

### Step 2: Update Google OAuth Settings

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client ID** (the one used for this project)
4. **Click "Edit"**
5. **Add these Authorized redirect URIs**:

```
https://bmvfinder.com/auth/callback
https://qrxcfmbkdfhv2c4xyv3csy.supabase.co/auth/v1/callback
```

6. **Click "Save"**

### Step 3: Update Environment Variables

Make sure your live environment (Vercel) has the correct environment variable:

```
NEXT_PUBLIC_APP_URL=https://bmvfinder.com
```

### Step 4: Redeploy Your Application

After updating the OAuth settings:

1. **Push your latest changes** to trigger a new deployment
2. **Or manually redeploy** from your Vercel dashboard

### Step 5: Test the Fix

1. **Go to your live site**: https://bmvfinder.com
2. **Try logging in** with Google
3. **You should now be redirected to**: `https://bmvfinder.com/auth/callback`
4. **Instead of**: `localhost:3000`

## Expected Result

After these changes:
- ✅ Login redirects to live domain
- ✅ Authentication completes successfully
- ✅ User stays on live site
- ✅ No more localhost redirects

## Troubleshooting

If it still doesn't work:

1. **Clear browser cache** and try again
2. **Check that all redirect URLs are exactly correct** (no typos)
3. **Wait 5-10 minutes** for OAuth changes to propagate
4. **Try in incognito mode** to bypass any cached redirects

## Files That Need Environment Variable

Make sure these files use the environment variable correctly:
- `src/app/components/AuthForm.tsx`
- `src/app/components/AuthModal.tsx`
- `src/app/layout.tsx`

The code changes we made earlier should automatically use the correct URL based on `NEXT_PUBLIC_APP_URL`. 