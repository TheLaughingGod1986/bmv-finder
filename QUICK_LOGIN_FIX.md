# Quick Login Fix

## Current Issue
You're seeing "Demo Mode: Authentication is not configured" which means you can't log in.

## Immediate Solution

### Option 1: Quick Fix (Works Now)
1. **Open your browser's Developer Tools** (F12)
2. **Go to Console tab**
3. **Paste this code and press Enter:**

```javascript
// Temporarily enable login by setting a mock user
localStorage.setItem('mock_user', JSON.stringify({
  id: 'temp-user-123',
  email: 'demo@example.com',
  name: 'Demo User'
}));

// Reload the page
window.location.reload();
```

4. **You should now be logged in as a demo user**

### Option 2: Proper Fix (Recommended)
Set up Supabase environment variables:

1. **Create `.env.local` file** in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

2. **Get Supabase credentials:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or use existing one
   - Go to Settings → API
   - Copy Project URL and anon key

3. **Restart your development server:**
```bash
npm run dev
```

## Testing
After either fix:
- The "Demo Mode" warning should disappear
- Google login should work
- You should be able to access all features

## Which Option to Choose?
- **Option 1**: Quick test to see if everything else works
- **Option 2**: Proper setup for full functionality 