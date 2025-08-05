# Authentication Setup Guide

## Current Status
The application is in "Demo Mode" because Supabase authentication is not configured.

## Quick Fix Steps

### 1. Set Environment Variables
Create or update your `.env.local` file with your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# App Configuration  
NEXT_PUBLIC_APP_URL="https://bmvfinder.com"
```

### 2. Get Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure OAuth Providers
In Supabase Dashboard → **Authentication** → **Providers**:

#### Google OAuth Setup:
1. Enable **Google** provider
2. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
3. Set **Redirect URL**: `https://bmvfinder.com/auth/callback`

### 4. Update URL Configuration
In Supabase Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `https://bmvfinder.com`
- **Redirect URLs**:
  - `https://bmvfinder.com/auth/callback`
  - `https://bmvfinder.com/account`
  - `https://bmvfinder.com/`

### 5. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   - `https://bmvfinder.com/auth/callback`
   - `https://your-project-id.supabase.co/auth/v1/callback`

## Testing
After setup:
1. Restart your development server
2. The "Demo Mode" warning should disappear
3. Google login should work properly

## Development vs Production
- **Development**: Uses `localhost:3000` for redirects
- **Production**: Uses `https://bmvfinder.com` for redirects

The code changes we made will automatically use the correct URL based on the environment. 