# 🚀 Quick Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- Docker Desktop (for Elasticsearch)
- Git

## 1. Start Docker Desktop
Make sure Docker Desktop is running on your machine.

## 2. Run the Setup Script
```bash
./scripts/setup-env.sh
```

This script will:
- ✅ Create/update your `.env.local` file
- ✅ Configure local development settings
- ✅ Start Elasticsearch in Docker
- ✅ Wait for Elasticsearch to be ready

## 3. Install Dependencies
```bash
npm install
```

## 4. Start Development Server
```bash
npm run dev
```

## 5. Test the Setup
```bash
npm run health:check
```

## 🔧 Manual Configuration (if needed)

If you prefer to configure manually, edit `.env.local`:

```bash
# Essential for local development
ELASTICSEARCH_URL="http://localhost:9201"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"

# Optional - update with your actual values
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-key"
```

## 🐳 Start Elasticsearch Manually
```bash
docker-compose -f docker-compose.elasticsearch.yml up -d
```

## 📊 Verify Elasticsearch
```bash
curl http://localhost:9201
```

## 🚨 Troubleshooting

### Docker not running
- Start Docker Desktop
- Run `docker info` to verify

### Elasticsearch not starting
- Check Docker logs: `docker-compose -f docker-compose.elasticsearch.yml logs`
- Ensure port 9201 is available

### Environment variables not loading
- Restart your development server
- Check `.env.local` file exists and has correct format

## 📚 Next Steps
- Read `HARDCODED_VALUES_FIX.md` for details about the security fixes
- Check `ENV_ORGANIZATION_GUIDE.md` for environment variable organization
- Review `src/lib/config.ts` for centralized configuration 