# 🚀 BMV Finder - Production Deployment Guide

This comprehensive guide covers the complete deployment process for the BMV Finder platform, from development to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [Security Configuration](#security-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Performance Optimization](#performance-optimization)
8. [Go-Live Checklist](#go-live-checklist)
9. [Post-Deployment](#post-deployment)
10. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **Elasticsearch**: 8.x or higher
- **Redis**: 6.x or higher (optional but recommended)
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 20GB SSD
- **CPU**: Minimum 2 cores

### Required Services

- **Vercel Account**: For hosting and deployment
- **Supabase Account**: For database and authentication
- **Elasticsearch Service**: For property search
- **Domain Name**: For production URL
- **SSL Certificate**: For HTTPS

## 🌍 Environment Setup

### 1. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="BMV Finder"

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Elasticsearch
ELASTICSEARCH_URL=https://your-elasticsearch-cluster.com
ELASTICSEARCH_USERNAME=your-username
ELASTICSEARCH_PASSWORD=your-password
ELASTICSEARCH_INDEX_PREFIX=bmv_finder_prod

# Redis (Optional)
REDIS_URL=redis://your-redis-instance:6379
REDIS_PASSWORD=your-redis-password

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret
```

### 2. Vercel Configuration

Create a `vercel.json` file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.co https://your-elasticsearch-cluster.com;"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

## 🗄️ Database Configuration

### 1. Supabase Setup

1. **Create a new Supabase project**
2. **Run database migrations**:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'elite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  billing_metadata JSONB DEFAULT '{}'
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. Elasticsearch Setup

1. **Create Elasticsearch cluster**
2. **Configure index templates**:

```bash
# Create property index template
curl -X PUT "your-elasticsearch-cluster.com/_index_template/bmv_finder_properties" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["bmv_finder_prod_properties*"],
    "template": {
      "settings": {
        "number_of_shards": 2,
        "number_of_replicas": 1,
        "analysis": {
          "analyzer": {
            "postcode_analyzer": {
              "type": "custom",
              "tokenizer": "keyword",
              "filter": ["lowercase", "trim"]
            }
          }
        }
      },
      "mappings": {
        "properties": {
          "postcode": {
            "type": "text",
            "analyzer": "postcode_analyzer",
            "fields": {
              "keyword": {
                "type": "keyword"
              }
            }
          },
          "price": {
            "type": "integer"
          },
          "bedrooms": {
            "type": "integer"
          },
          "property_type": {
            "type": "keyword"
          },
          "location": {
            "type": "geo_point"
          },
          "created_at": {
            "type": "date"
          }
        }
      }
    }
  }'
```

## 🚀 Application Deployment

### 1. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ELASTICSEARCH_URL
vercel env add ELASTICSEARCH_USERNAME
vercel env add ELASTICSEARCH_PASSWORD
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
```

### 2. Custom Domain Setup

1. **Add domain in Vercel dashboard**
2. **Configure DNS records**:
   - A record: `@` → Vercel IP
   - CNAME record: `www` → `cname.vercel-dns.com`
3. **Enable SSL certificate**

### 3. Build Optimization

```bash
# Install dependencies
npm ci --production

# Build application
npm run build

# Test build
npm run start
```

## 🔒 Security Configuration

### 1. Security Headers

Ensure all security headers are configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.supabase.co https://your-elasticsearch-cluster.com;"
        }
      ]
    }
  ]
}
```

### 2. Authentication Security

- Enable MFA for admin accounts
- Implement rate limiting
- Configure session timeouts
- Enable audit logging

### 3. Data Protection

- Enable encryption at rest
- Implement data backup
- Configure GDPR compliance
- Set up data retention policies

## 📊 Monitoring Setup

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install @sentry/nextjs

# Configure Sentry
# Create sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Performance Monitoring

- Set up Vercel Analytics
- Configure Google Analytics
- Implement custom performance metrics
- Set up alerting for performance issues

### 3. Error Tracking

- Configure Sentry for error tracking
- Set up error notifications
- Implement error recovery mechanisms
- Monitor API response times

## ⚡ Performance Optimization

### 1. Caching Strategy

```javascript
// Implement Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache frequently accessed data
const cacheKey = `property:${postcode}`;
const cached = await client.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Store in cache
await client.setex(cacheKey, 3600, JSON.stringify(data));
```

### 2. Database Optimization

- Add database indexes
- Implement connection pooling
- Optimize queries
- Set up read replicas

### 3. CDN Configuration

- Configure Vercel Edge Network
- Optimize static assets
- Implement image optimization
- Set up cache headers

## ✅ Go-Live Checklist

### Pre-Launch

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Elasticsearch indexes created
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Security headers implemented
- [ ] Authentication system tested
- [ ] Performance benchmarks met
- [ ] Load testing completed
- [ ] Backup system configured

### Security

- [ ] Security headers active
- [ ] Authentication system active
- [ ] Rate limiting configured
- [ ] Input validation active
- [ ] Security monitoring enabled
- [ ] GDPR compliance verified
- [ ] Privacy policy published
- [ ] Terms of service published

### Monitoring

- [ ] Health checks active
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Log aggregation active
- [ ] Alert notifications tested
- [ ] Uptime monitoring configured

### Performance

- [ ] CDN configured
- [ ] Caching system active
- [ ] Database optimized
- [ ] API response times < 2s
- [ ] Page load times < 3s
- [ ] Error rate < 1%

## 🔄 Post-Deployment

### 1. Health Checks

```bash
# Run system integration tests
node scripts/system-integration-test.js

# Run performance optimization
node scripts/performance-optimization.js

# Run security hardening
node scripts/security-hardening.js

# Run production readiness assessment
node scripts/production-readiness.js
```

### 2. Monitoring Setup

- Verify all monitoring systems are active
- Test alert notifications
- Check performance metrics
- Monitor error rates

### 3. User Acceptance Testing

- Test all user journeys
- Verify authentication flows
- Check property search functionality
- Test portfolio management features

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Database Connection Issues

```bash
# Check environment variables
vercel env ls

# Test database connection
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

#### 3. Elasticsearch Connection Issues

```bash
# Test Elasticsearch connection
curl -X GET "your-elasticsearch-cluster.com/_cluster/health"
```

#### 4. Performance Issues

```bash
# Run performance analysis
node scripts/performance-optimization.js

# Check Vercel Analytics
# Monitor API response times
```

### Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Elasticsearch Documentation**: https://www.elastic.co/guide
- **Next.js Documentation**: https://nextjs.org/docs

## 📞 Support

For deployment support:

1. Check the troubleshooting section
2. Review error logs in Vercel dashboard
3. Run diagnostic scripts
4. Contact support team with error details

---

**Last Updated**: December 2024
**Version**: 1.0.0
