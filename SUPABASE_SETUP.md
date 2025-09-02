# 🔐 Supabase Authentication Setup Guide

This guide will help you set up real authentication for BMV Finder using Supabase.

## 📋 Prerequisites

1. A Supabase account (free tier available)
2. Node.js and npm installed
3. Git installed

## 🚀 Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `bmv-finder`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

## 🗄️ Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql` from this project
4. Click "Run" to execute the schema
5. Verify the tables were created in **Table Editor**

## 🔑 Step 3: Get API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## ⚙️ Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Replace the placeholder values with your actual Supabase credentials

## 🔐 Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following:

### Site URL
- Set to your production domain: `https://your-domain.com`
- For development: `http://localhost:3000`

### Redirect URLs
Add these redirect URLs:
- `http://localhost:3000/auth/callback` (development)
- `https://your-domain.com/auth/callback` (production)

### Email Templates (Optional)
Customize the email templates for:
- Confirm signup
- Reset password
- Magic link

## 🔗 Step 6: Enable Google OAuth (Optional)

1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com):
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-project.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** to Supabase

## 🧪 Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Click "Sign In" in the navigation
4. Try creating a new account
5. Check the **Authentication** → **Users** section in Supabase dashboard

## 🚀 Step 8: Deploy to Production

1. Add your environment variables to your hosting platform:
   - **Vercel**: Add to Project Settings → Environment Variables
   - **Netlify**: Add to Site Settings → Environment Variables
   - **Railway**: Add to Project Variables

2. Update the **Site URL** and **Redirect URLs** in Supabase to match your production domain

## 🔧 Troubleshooting

### Common Issues

**"Invalid API key"**
- Check that your environment variables are correctly set
- Ensure you're using the `anon` key, not the `service_role` key

**"Invalid redirect URL"**
- Verify the redirect URLs in Supabase match your domain
- Check for trailing slashes and protocol (http vs https)

**"User not found"**
- Check that the database schema was created correctly
- Verify RLS policies are enabled

**"Permission denied"**
- Ensure Row Level Security is properly configured
- Check that the user has the correct policies applied

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

## 📊 Monitoring

Monitor your authentication system:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Supabase Dashboard** → **Logs** → **Auth**
3. **Supabase Dashboard** → **Database** → **Logs**

## 🔒 Security Best Practices

1. **Never expose service role key** in client-side code
2. **Use environment variables** for all sensitive data
3. **Enable RLS** on all tables
4. **Regularly rotate** API keys
5. **Monitor** authentication logs for suspicious activity
6. **Use HTTPS** in production
7. **Set up proper CORS** policies

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Authentication Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Providers Guide](https://supabase.com/docs/guides/auth/social-login)

## 🆘 Support

If you encounter issues:

1. Check the [Supabase Status Page](https://status.supabase.com)
2. Review the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Check the [Next.js Documentation](https://nextjs.org/docs)

---

**🎉 Congratulations!** You now have a fully functional authentication system with Supabase!
