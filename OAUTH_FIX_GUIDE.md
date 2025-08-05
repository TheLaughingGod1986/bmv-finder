# OAuth Redirect Fix Guide

## Problem
Google OAuth login redirects to localhost instead of the live site URL.

## Root Cause
The OAuth redirect URLs in Supabase are not properly configured for the production domain.

## Solution Steps

### 1. Update Environment Variables
Make sure your production environment has the correct `NEXT_PUBLIC_APP_URL`:

```bash
NEXT_PUBLIC_APP_URL="https://bmvfinder.com"
```

### 2. Update Supabase OAuth Settings
In your Supabase dashboard:

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `https://bmvfinder.com`
3. Add **Redirect URLs**:
   - `https://bmvfinder.com/auth/callback`
   - `https://bmvfinder.com/account`
   - `https://bmvfinder.com/`

### 3. Update Google OAuth Settings
In Google Cloud Console:

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   - `https://bmvfinder.com/auth/callback`
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

### 4. Code Changes Made
The following files have been updated to use the correct redirect URL:

#### `src/app/components/AuthForm.tsx`
```typescript
// Before
redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/auth/callback`

// After  
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`
```

#### `src/app/components/AuthModal.tsx`
```typescript
// Before
redirectTo: `${window.location.origin}/auth/callback`

// After
redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`
```

### 5. Verification Steps

1. **Test in Development**:
   ```bash
   npm run dev
   # Should redirect to localhost:3000/auth/callback
   ```

2. **Test in Production**:
   - Deploy changes
   - Try Google login
   - Should redirect to `https://bmvfinder.com/auth/callback`

### 6. Common Issues

#### Issue: Still redirecting to localhost
**Solution**: Check that `NEXT_PUBLIC_APP_URL` is set correctly in your production environment.

#### Issue: OAuth error "redirect_uri_mismatch"
**Solution**: Add the exact redirect URL to Google OAuth settings.

#### Issue: Supabase auth error
**Solution**: Verify Supabase site URL and redirect URLs match exactly.

### 7. Environment Variables Checklist

Make sure these are set in production:

```bash
NEXT_PUBLIC_APP_URL="https://bmvfinder.com"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 8. Testing

After making changes:

1. Clear browser cache and cookies
2. Test Google login in incognito mode
3. Verify redirect goes to correct domain
4. Check that user is properly authenticated

## Files Modified
- `src/app/components/AuthForm.tsx`
- `src/app/components/AuthModal.tsx`

## Status
✅ Code changes completed
⏳ Requires Supabase and Google OAuth configuration updates 