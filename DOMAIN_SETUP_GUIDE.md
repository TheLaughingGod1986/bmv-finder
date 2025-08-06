# 🌐 Domain Configuration Guide - Property Intelligence Platform

## 🎯 **Current Status**
- **Current URL**: `https://bmv-finder-bpcueqrtv-bens-projects-11c93b15.vercel.app`
- **Custom Domain**: Not configured
- **SSL Certificate**: Automatic (provided by Vercel)

## 🚀 **Step 1: Choose Your Domain**

### **Recommended Domain Options**
1. **Primary Options**:
   - `bmvfinder.com` (matches current branding)
   - `propertyintelligence.com` (matches new branding)
   - `propertyintelligence.co.uk` (UK-focused)

2. **Alternative Options**:
   - `bmv-finder.com`
   - `property-intelligence.com`
   - `propertyintelligence.io`
   - `bmvfinder.co.uk`

### **Domain Registration**
- **Recommended**: Namecheap, GoDaddy, or Google Domains
- **Cost**: ~$10-15/year for .com domains
- **Time**: 5-10 minutes to register

## 🔧 **Step 2: Configure DNS Records**

### **Option A: Using Vercel's DNS (Recommended)**
1. **Transfer domain to Vercel** (if supported)
2. **Automatic configuration** - no manual DNS setup needed
3. **Automatic SSL certificate**

### **Option B: Using External DNS Provider**
Configure these DNS records with your domain provider:

#### **For Root Domain (e.g., bmvfinder.com)**
```
Type: A
Name: @
Value: 76.76.19.36
TTL: 3600
```

#### **For WWW Subdomain (e.g., www.bmvfinder.com)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### **Additional Records (Optional)**
```
Type: TXT
Name: @
Value: vc-domain-verify=bmvfinder.com,verification-code
TTL: 3600
```

## 🏗️ **Step 3: Add Domain to Vercel**

### **Using Vercel CLI**
```bash
# Add your domain
vercel domains add bmvfinder.com

# Verify domain ownership
vercel domains verify bmvfinder.com

# Check domain status
vercel domains ls
```

### **Using Vercel Dashboard**
1. Go to: https://vercel.com/dashboard
2. Select your project: `bmv-finder`
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain: `bmvfinder.com`
6. Follow verification steps

## 🔒 **Step 4: SSL Certificate Setup**

### **Automatic SSL (Recommended)**
- Vercel automatically provisions SSL certificates
- No manual configuration required
- Certificates auto-renew

### **Custom SSL (Advanced)**
If you need a custom SSL certificate:
1. Upload certificate to Vercel dashboard
2. Configure in **Settings** → **Domains** → **SSL**
3. Set up auto-renewal

## ⚙️ **Step 5: Update Environment Variables**

### **Update Vercel Environment Variables**
```bash
# Set the new domain in Vercel
vercel env add NEXT_PUBLIC_APP_URL production
# Value: https://bmvfinder.com

vercel env add NEXT_PUBLIC_BASE_URL production
# Value: https://bmvfinder.com
```

### **Update Local Environment**
```bash
# .env.local
NEXT_PUBLIC_APP_URL="https://bmvfinder.com"
NEXT_PUBLIC_BASE_URL="https://bmvfinder.com"
```

## 🔄 **Step 6: Update OAuth Settings**

### **Supabase OAuth Configuration**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL**: `https://bmvfinder.com`
5. Update **Redirect URLs**:
   - `https://bmvfinder.com/auth/callback`
   - `https://bmvfinder.com/account`
   - `https://bmvfinder.com/`

### **Google OAuth Configuration**
1. Go to: https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add **Authorized redirect URIs**:
   - `https://bmvfinder.com/auth/callback`
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

## 🧪 **Step 7: Testing & Verification**

### **Domain Verification Checklist**
- [ ] Domain resolves to your Vercel deployment
- [ ] SSL certificate is active (green lock in browser)
- [ ] OAuth login works with new domain
- [ ] All internal links use the new domain
- [ ] Sitemap is accessible at `https://bmvfinder.com/sitemap.xml`
- [ ] Robots.txt is accessible at `https://bmvfinder.com/robots.txt`

### **Test Commands**
```bash
# Test domain resolution
nslookup bmvfinder.com

# Test SSL certificate
curl -I https://bmvfinder.com

# Test OAuth redirect
curl -I https://bmvfinder.com/auth/callback
```

## 📊 **Step 8: SEO & Analytics Updates**

### **Google Search Console**
1. Add new domain property
2. Verify ownership
3. Submit sitemap: `https://bmvfinder.com/sitemap.xml`
4. Monitor indexing status

### **Google Analytics**
1. Update property settings with new domain
2. Update tracking code if needed
3. Set up domain property

### **Other Analytics**
- Update any external analytics services
- Update social media links
- Update email templates

## 🚨 **Step 9: Redirects & Migration**

### **Set Up Redirects**
Configure 301 redirects from old URL to new domain:
```bash
# In Vercel dashboard or vercel.json
{
  "redirects": [
    {
      "source": "/",
      "destination": "https://bmvfinder.com",
      "permanent": true
    }
  ]
}
```

### **Update External Links**
- Update any external references to your old URL
- Update documentation and guides
- Update Chrome extension configuration

## 🔍 **Step 10: Monitoring**

### **Domain Health Monitoring**
- Monitor SSL certificate expiration
- Monitor DNS propagation
- Monitor domain uptime
- Monitor OAuth functionality

### **Performance Monitoring**
- Monitor Core Web Vitals
- Monitor page load times
- Monitor API response times

## ✅ **Completion Checklist**

- [ ] Domain registered and configured
- [ ] DNS records properly set
- [ ] Domain added to Vercel project
- [ ] SSL certificate active
- [ ] Environment variables updated
- [ ] OAuth settings updated
- [ ] All functionality tested
- [ ] SEO settings updated
- [ ] Analytics configured
- [ ] Redirects set up
- [ ] Monitoring in place

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Domain Not Resolving**
- Check DNS propagation (can take 24-48 hours)
- Verify DNS records are correct
- Check domain provider settings

#### **SSL Certificate Issues**
- Wait for automatic SSL provisioning (up to 24 hours)
- Check DNS records are correct
- Contact Vercel support if needed

#### **OAuth Not Working**
- Verify redirect URLs are updated
- Clear browser cache
- Test in incognito mode

#### **Environment Variables Not Updated**
- Redeploy after updating environment variables
- Check Vercel dashboard for correct values
- Restart development server locally

## 📞 **Support**

If you encounter issues:
1. Check Vercel documentation
2. Contact your domain provider
3. Contact Vercel support
4. Check project documentation

---

**🎉 Congratulations!** Your Property Intelligence Platform will now have a professional custom domain with automatic SSL certificates. 