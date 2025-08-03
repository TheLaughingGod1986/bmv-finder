# Hardcoded Values Fix - Configuration Guide

## Overview
This document outlines the hardcoded values that were identified and fixed in the codebase, along with instructions for proper configuration.

## 🔐 Critical Security Fixes

### Elasticsearch API Key & URL
**Issue**: Hardcoded Elasticsearch credentials were found in multiple files.

**Files Fixed**:
- `src/estimate.js`
- `src/uploadHpi.js`
- `src/testHpiSystem.js`
- `src/createHpiIndex.js`
- `src/updateHpiFromOns.js`
- `scripts/test-hpi-pipeline.js`
- `scripts/populate-simple.js`
- `scripts/test-search-after.js`
- `scripts/inspect-postcodes.js`
- `scripts/update-index-mapping.js`
- `scripts/populate-medium.js`

**Configuration Required**:
```bash
# Add to .env.local
ELASTICSEARCH_URL="your-elasticsearch-url"
ELASTICSEARCH_API_KEY="your-elasticsearch-api-key"
```

## 🌐 Domain & URL Configuration

### App URL Configuration
**Issue**: Hardcoded `bmvfinder.com` domain in multiple files.

**Files Fixed**:
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/page.metadata.ts`

**Configuration Required**:
```bash
# Add to .env.local
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Social Media Links
**Issue**: Hardcoded social media URLs in Footer component.

**Files Fixed**:
- `src/app/components/Footer.tsx`

**Configuration Required**:
```bash
# Add to .env.local
NEXT_PUBLIC_SOCIAL_TWITTER="https://twitter.com/your-handle"
NEXT_PUBLIC_SOCIAL_LINKEDIN="https://linkedin.com/company/your-company"
NEXT_PUBLIC_SOCIAL_FACEBOOK="https://facebook.com/your-page"
NEXT_PUBLIC_SOCIAL_INSTAGRAM="https://instagram.com/your-handle"
NEXT_PUBLIC_SOCIAL_GITHUB="https://github.com/your-username/your-repo"
```

## 📧 Email Configuration

### Support & Contact Emails
**Issue**: Hardcoded email addresses throughout the application.

**Files Fixed**:
- `src/app/components/Footer.tsx`
- `src/app/components/HpiDataDisplay.tsx`
- `src/app/components/RecentSalesDisplay.tsx`

**Configuration Required**:
```bash
# Add to .env.local
NEXT_PUBLIC_SUPPORT_EMAIL="support@your-domain.com"
NEXT_PUBLIC_LEGAL_EMAIL="legal@your-domain.com"
NEXT_PUBLIC_PRIVACY_EMAIL="privacy@your-domain.com"
```

## 🛠️ New Configuration System

### Centralized Config File
Created `src/lib/config.ts` to centralize all configuration values:

```typescript
import { config } from '@/lib/config';

// Usage examples:
const appUrl = config.appUrl;
const supportEmail = config.supportEmail;
const twitterUrl = config.social.twitter;
```

### Environment Variables Structure
Updated `production.env.example` with all required environment variables.

## 📋 Setup Instructions

1. **Copy environment template**:
   ```bash
   cp production.env.example .env.local
   ```

2. **Fill in your actual values** in `.env.local`

3. **Update your deployment environment** with the same variables

4. **Test the configuration**:
   ```bash
   npm run health:check
   ```

## 🔍 Verification Checklist

- [ ] Elasticsearch credentials are set in environment variables
- [ ] App URL is configured correctly
- [ ] Social media links are updated
- [ ] Support email addresses are configured
- [ ] All hardcoded values have been replaced with environment variables
- [ ] Configuration is tested in development and production

## 🚨 Security Notes

- Never commit `.env.local` to version control
- Use different credentials for development and production
- Regularly rotate API keys and secrets
- Monitor for any remaining hardcoded values in new code

## 📚 Related Documentation

- `ENV_ORGANIZATION_GUIDE.md` - Environment variable organization
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Production deployment setup
- `src/lib/config.ts` - Centralized configuration file 