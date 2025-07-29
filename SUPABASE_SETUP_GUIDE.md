# 🔐 Supabase Authentication Setup Guide

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Create Supabase Project**
1. **Visit:** https://supabase.com
2. **Sign up/Login** with GitHub
3. **Create New Project:**
   - Name: `bmv-finder`
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Click "Create new project"

### **Step 2: Get Your Credentials**
1. **Go to:** Settings → API
2. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)

### **Step 3: Update Environment Variables**
Edit your `.env.local` file and replace:
```bash
# Replace these placeholder values:
NEXT_PUBLIC_SUPABASE_URL="https://your-actual-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-actual-anon-key"
```

### **Step 4: Set Up Database Schema**
1. **Go to:** SQL Editor in Supabase Dashboard
2. **Copy and paste** the contents of `scripts/setup-supabase-schema.sql`
3. **Click "Run"** to create the necessary tables

### **Step 5: Configure Authentication**
1. **Go to:** Authentication → Settings
2. **Enable Email Auth** (should be enabled by default)
3. **Optional:** Enable Google/Apple OAuth for social login

### **Step 6: Test Authentication**
1. **Restart your dev server:** `npm run dev`
2. **Try signing up** with a test email
3. **Check the database** to see if user profile was created

---

## 🔧 **Detailed Configuration**

### **Authentication Settings**
In Supabase Dashboard → Authentication → Settings:

#### **Email Auth Configuration**
```json
{
  "enable_signup": true,
  "enable_confirmations": true,
  "enable_notifications": true,
  "mailer_autoconfirm": false,
  "secure_email_change_enabled": true
}
```

#### **OAuth Providers (Optional)**
- **Google:** Add Google OAuth credentials
- **Apple:** Add Apple OAuth credentials
- **GitHub:** Add GitHub OAuth credentials

### **Email Templates**
Customize email templates in Authentication → Email Templates:
- **Confirm signup**
- **Reset password**
- **Change email address**

### **Site URL Configuration**
Set your site URL in Authentication → Settings:
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com`

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. "Supabase not configured" Error**
**Solution:** Check your environment variables are correct and restart dev server

#### **2. Authentication not working**
**Solution:** 
- Verify database schema is set up
- Check Row Level Security policies
- Ensure triggers are created

#### **3. Email confirmation not working**
**Solution:**
- Check email templates in Supabase dashboard
- Verify SMTP settings
- Test with a real email address

#### **4. OAuth not working**
**Solution:**
- Verify OAuth provider credentials
- Check redirect URLs
- Ensure provider is enabled

### **Debug Steps**
1. **Check browser console** for errors
2. **Check Supabase logs** in dashboard
3. **Verify environment variables** are loaded
4. **Test with different email** addresses

---

## 📊 **Database Schema**

The setup creates these tables:

### **profiles Table**
```sql
- id (UUID, Primary Key)
- email (TEXT)
- name (TEXT)
- tier (TEXT, Default: 'free')
- billing_metadata (JSONB)
- stripe_customer_id (TEXT)
- lookup_count (INTEGER, Default: 0)
- last_lookup_reset (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### **Row Level Security**
- Users can only access their own profile
- Automatic profile creation on signup
- Secure update triggers

---

## 🔒 **Security Features**

### **Built-in Security**
- ✅ Row Level Security (RLS)
- ✅ JWT token authentication
- ✅ Secure password hashing
- ✅ Email confirmation
- ✅ Rate limiting
- ✅ CORS protection

### **Best Practices**
- ✅ Use environment variables
- ✅ Enable email confirmations
- ✅ Set up proper redirect URLs
- ✅ Monitor authentication logs
- ✅ Regular security updates

---

## 🚀 **Next Steps**

Once Supabase is configured:

1. **Test user registration** and login
2. **Verify profile creation** in database
3. **Test search limit functionality** for anonymous vs authenticated users
4. **Set up Stripe integration** for payments
5. **Configure email notifications**

---

## 📞 **Support**

If you encounter issues:
1. **Check Supabase documentation:** https://supabase.com/docs
2. **Review authentication logs** in Supabase dashboard
3. **Test with minimal configuration** first
4. **Contact Supabase support** if needed 