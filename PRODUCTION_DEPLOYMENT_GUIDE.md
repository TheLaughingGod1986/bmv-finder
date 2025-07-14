# BMV Finder - Production Deployment Guide

## 🚀 **Complete Production Deployment Checklist**

This guide covers everything you need to deploy your BMV Finder platform to production, including the web application, mobile app, and all supporting infrastructure.

---

## 📋 **Pre-Deployment Checklist**

### ✅ **Environment Setup**
- [ ] Production server/cloud infrastructure configured
- [ ] Domain name registered and DNS configured
- [ ] SSL certificates obtained and installed
- [ ] Environment variables configured
- [ ] Database backups and recovery procedures tested
- [ ] Monitoring and logging systems set up

### ✅ **Security Audit**
- [ ] API rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CORS policies configured
- [ ] Authentication system tested
- [ ] Data encryption verified

### ✅ **Performance Testing**
- [ ] Load testing completed
- [ ] Response times optimized
- [ ] Database queries optimized
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Image optimization completed

---

## 🏗️ **Infrastructure Setup**

### **1. Cloud Platform Selection**

#### **Option A: Vercel (Recommended for Next.js)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

#### **Option B: AWS (Enterprise)**
```bash
# Deploy using AWS Amplify
npm install -g @aws-amplify/cli
amplify init
amplify push
```

#### **Option C: DigitalOcean (Cost-effective)**
```bash
# Deploy to DigitalOcean App Platform
# Upload your code and configure build settings
```

### **2. Database Setup**

#### **Elasticsearch Production Configuration**
```yaml
# elasticsearch.yml
cluster.name: bmv-finder-prod
node.name: node-1
network.host: 0.0.0.0
http.port: 9200
discovery.type: single-node
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

#### **Environment Variables**
```env
# .env.production
ELASTICSEARCH_URL=https://your-elasticsearch-cluster.com
ELASTICSEARCH_USERNAME=your-username
ELASTICSEARCH_PASSWORD=your-secure-password
NEXT_PUBLIC_API_URL=https://api.bmvfinder.com
DATABASE_URL=your-database-connection-string
REDIS_URL=your-redis-connection-string
JWT_SECRET=your-super-secure-jwt-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
SENTRY_DSN=your-sentry-dsn
```

### **3. Domain & SSL Setup**

#### **Domain Configuration**
```bash
# Configure DNS records
A     @      your-server-ip
CNAME www    your-domain.com
CNAME api    api.your-domain.com
```

#### **SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt-get install certbot

# Obtain SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🌐 **Web Application Deployment**

### **1. Build & Deploy**

#### **Production Build**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

#### **Deployment Scripts**
```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production npm run build",
    "start:prod": "NODE_ENV=production npm start",
    "deploy": "npm run build:prod && vercel --prod"
  }
}
```

### **2. Environment Configuration**

#### **Production Environment Variables**
```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.bmvfinder.com
NEXT_PUBLIC_APP_URL=https://bmvfinder.com
ELASTICSEARCH_URL=https://your-elasticsearch-cluster.com
REDIS_URL=redis://your-redis-instance.com:6379
JWT_SECRET=your-super-secure-jwt-secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
SENTRY_DSN=https://your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### **3. Performance Optimization**

#### **Next.js Configuration**
```javascript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
}
```

---

## 📱 **Mobile App Deployment**

### **1. iOS App Store Deployment**

#### **Build Configuration**
```json
{
  "expo": {
    "name": "BMV Finder",
    "slug": "bmv-finder-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.bmvfinder.mobile",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan property details",
        "NSLocationWhenInUseUsageDescription": "This app uses location to find nearby properties"
      }
    }
  }
}
```

#### **Build Commands**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### **2. Android Google Play Deployment**

#### **Build Configuration**
```json
{
  "expo": {
    "android": {
      "package": "com.bmvfinder.mobile",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3A7CA5"
      },
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

#### **Build Commands**
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### **3. Mobile App Configuration**

#### **API Configuration**
```javascript
// mobile-app/src/config/api.js
export const API_CONFIG = {
  BASE_URL: 'https://api.bmvfinder.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const FEATURE_FLAGS = {
  OFFLINE_MODE: true,
  PUSH_NOTIFICATIONS: true,
  LOCATION_SERVICES: true,
};
```

---

## 🔧 **Backend Services Deployment**

### **1. API Server Setup**

#### **Production Server Configuration**
```javascript
// server.js
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['https://bmvfinder.com', 'https://www.bmvfinder.com'],
  credentials: true
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### **2. Database Migration**

#### **Elasticsearch Index Setup**
```bash
# Create production indices
curl -X PUT "https://your-elasticsearch-cluster.com/hpi_data" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "postcode": { "type": "keyword" },
        "region": { "type": "keyword" },
        "hpi_value": { "type": "float" },
        "date": { "type": "date" }
      }
    }
  }'
```

#### **Data Import Script**
```bash
# Import production data
node scripts/import-hpi-data.js --mode=production --source=ons
```

---

## 📊 **Monitoring & Analytics Setup**

### **1. Application Monitoring**

#### **Sentry Configuration**
```javascript
// sentry.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

#### **Health Check Endpoints**
```javascript
// pages/api/health.js
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    elasticsearch: await checkElasticsearchHealth(),
    redis: await checkRedisHealth(),
  };
  
  res.status(200).json(health);
}
```

### **2. Performance Monitoring**

#### **Google Analytics Setup**
```javascript
// lib/analytics.js
import { GA_TRACKING_ID } from '../config';

export const pageview = (url) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_location: url,
  });
};

export const event = ({ action, category, label, value }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

### **3. Error Tracking**

#### **Error Boundary Setup**
```javascript
// components/ErrorBoundary.js
import React from 'react';
import * as Sentry from '@sentry/nextjs';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

---

## 🔒 **Security Configuration**

### **1. API Security**

#### **Rate Limiting Configuration**
```javascript
// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits for different user types
    if (req.user?.tier === 'premium') return 1000;
    if (req.user?.tier === 'pro') return 500;
    return 100; // Free tier
  },
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### **CORS Configuration**
```javascript
// middleware/cors.js
import cors from 'cors';

const corsOptions = {
  origin: [
    'https://bmvfinder.com',
    'https://www.bmvfinder.com',
    'https://admin.bmvfinder.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const corsMiddleware = cors(corsOptions);
```

### **2. Data Protection**

#### **Encryption Configuration**
```javascript
// lib/encryption.js
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY;

export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedText) => {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipher(algorithm, secretKey);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

---

## 🚀 **Deployment Commands**

### **1. Complete Deployment Script**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting BMV Finder Production Deployment..."

# 1. Environment setup
echo "📋 Setting up environment..."
cp .env.production .env
npm install

# 2. Build application
echo "🏗️ Building application..."
npm run build:prod

# 3. Run tests
echo "🧪 Running tests..."
npm run test:ci

# 4. Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

# 5. Verify deployment
echo "✅ Verifying deployment..."
curl -f https://bmvfinder.com/api/health || exit 1

echo "🎉 Deployment completed successfully!"
```

### **2. Mobile App Deployment**
```bash
#!/bin/bash
# deploy-mobile.sh

echo "📱 Starting Mobile App Deployment..."

# 1. Build iOS app
echo "🍎 Building iOS app..."
eas build --platform ios --profile production --non-interactive

# 2. Build Android app
echo "🤖 Building Android app..."
eas build --platform android --profile production --non-interactive

# 3. Submit to stores
echo "📤 Submitting to app stores..."
eas submit --platform ios --latest
eas submit --platform android --latest

echo "🎉 Mobile app deployment completed!"
```

---

## 📈 **Post-Deployment Checklist**

### ✅ **Immediate Verification**
- [ ] Website loads correctly at production URL
- [ ] All API endpoints responding
- [ ] Database connections working
- [ ] SSL certificates valid
- [ ] Mobile apps available in stores
- [ ] Analytics tracking working
- [ ] Error monitoring active

### ✅ **Performance Verification**
- [ ] Page load times under 3 seconds
- [ ] API response times under 500ms
- [ ] Database query performance optimal
- [ ] Caching working correctly
- [ ] CDN serving static assets
- [ ] Mobile app performance acceptable

### ✅ **Security Verification**
- [ ] Rate limiting active
- [ ] CORS policies enforced
- [ ] Input validation working
- [ ] Authentication secure
- [ ] Data encryption active
- [ ] Security headers present

### ✅ **Monitoring Verification**
- [ ] Health checks passing
- [ ] Error tracking active
- [ ] Performance monitoring working
- [ ] Analytics collecting data
- [ ] Alerts configured
- [ ] Logs being collected

---

## 🔄 **Continuous Deployment Setup**

### **1. GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Build application
        run: npm run build:prod
        env:
          NODE_ENV: production
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### **2. Automated Testing**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Run E2E tests
        run: npm run test:e2e
```

---

## 📞 **Support & Maintenance**

### **1. Monitoring Dashboard**
- **Application Health**: https://status.bmvfinder.com
- **Performance Metrics**: https://analytics.bmvfinder.com
- **Error Tracking**: https://sentry.io/bmvfinder
- **User Analytics**: https://analytics.google.com

### **2. Emergency Contacts**
- **Technical Support**: tech@bmvfinder.com
- **Infrastructure**: infra@bmvfinder.com
- **Security**: security@bmvfinder.com
- **24/7 On-call**: +44-xxx-xxx-xxxx

### **3. Maintenance Schedule**
- **Daily**: Health checks and monitoring review
- **Weekly**: Performance analysis and optimization
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Full security audit and penetration testing

---

## 🎉 **Launch Checklist**

### **Final Launch Steps**
1. **Announcement**: Social media and email campaign
2. **Monitoring**: 24/7 monitoring for first 48 hours
3. **Support**: Customer support team ready
4. **Documentation**: User guides and help center
5. **Feedback**: User feedback collection system
6. **Analytics**: Conversion tracking and user behavior analysis

### **Success Metrics**
- **Performance**: < 3s page load times
- **Uptime**: > 99.9% availability
- **User Engagement**: > 60% session duration
- **Conversion**: > 5% sign-up rate
- **Mobile**: > 40% mobile usage

---

## 🏆 **Congratulations!**

Your BMV Finder platform is now **production-ready** with:
- ✅ **Scalable Infrastructure**: Cloud-based, auto-scaling
- ✅ **Security Hardened**: Rate limiting, encryption, monitoring
- ✅ **Performance Optimized**: Caching, CDN, optimization
- ✅ **Mobile Ready**: Cross-platform mobile apps
- ✅ **Monitoring Active**: Real-time health and performance tracking
- ✅ **Automated Deployment**: CI/CD pipeline for continuous delivery

**Ready to launch and scale to thousands of users!** 🚀 