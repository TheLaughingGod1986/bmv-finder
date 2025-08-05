# 🔧 Vercel Environment Variables Setup

## Current Issue
The upgrade cards are showing an error: "NEXT_PUBLIC_BASE_URL must be set in your environment and start with http:// or https://"

## Solution
You need to set the correct environment variables in your Vercel deployment.

## Required Environment Variables

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: `bmv-finder`
3. Go to **Settings** → **Environment Variables**

### 2. Add These Variables

#### **NEXT_PUBLIC_BASE_URL**
```
Name: NEXT_PUBLIC_BASE_URL
Value: https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app
Environment: Production, Preview, Development
```

#### **NEXT_PUBLIC_APP_URL** (if not already set)
```
Name: NEXT_PUBLIC_APP_URL
Value: https://bmv-finder-git-main-bens-projects-11c93b15.vercel.app
Environment: Production, Preview, Development
```

#### **Supabase Variables** (if not already set)
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://qrxcfmbkdfhv2c4xyv3csy.supabase.co
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Your Supabase anon key]
Environment: Production, Preview, Development
```

#### **Stripe Variables** (if using payments)
```
Name: STRIPE_SECRET_KEY
Value: [Your Stripe secret key]
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: [Your Stripe publishable key]
Environment: Production, Preview, Development
```

### 3. Redeploy
After adding the variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Wait for deployment to complete

## What This Fixes

✅ **Upgrade Cards**: No more error messages on subscription buttons
✅ **OAuth Redirects**: Proper authentication redirects
✅ **Stripe Checkout**: Working payment flows
✅ **Chrome Extension**: Proper API communication
✅ **PDF Reports**: Working report generation

## Verification

After redeployment, check:
1. **Upgrade buttons** should work without errors
2. **Google login** should redirect properly
3. **Chrome extension** should connect to your account
4. **Payment flows** should work correctly

## Troubleshooting

### Still Seeing Errors?
1. **Check variable names**: Make sure they're exactly as shown
2. **Check environments**: Variables should be set for all environments
3. **Redeploy**: Force a new deployment after adding variables
4. **Clear cache**: Hard refresh the page (Ctrl+Shift+R)

### Variables Not Working?
1. **Check Vercel logs**: Look for environment variable errors
2. **Verify deployment**: Make sure variables are included in build
3. **Test locally**: Try with `.env.local` file first

## Local Development

For local development, create a `.env.local` file:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://qrxcfmbkdfhv2c4xyv3csy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
STRIPE_SECRET_KEY=[your-stripe-secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-stripe-publishable]
``` 