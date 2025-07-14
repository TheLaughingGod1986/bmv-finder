#!/bin/bash

# BMV Finder Production Infrastructure Setup Script
# This script sets up all necessary infrastructure for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Setting up BMV Finder Production Infrastructure${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
PROJECT_NAME="bmv-finder"
REGION="us-east-1"  # Change as needed

echo -e "${BLUE}Infrastructure Setup Guide${NC}"
echo ""

# Step 1: Database Setup
print_info "Step 1: Database Infrastructure"

echo -e "${BLUE}Elasticsearch Setup Options:${NC}"
echo "1. Elastic Cloud (Recommended)"
echo "   - Visit: https://cloud.elastic.co"
echo "   - Create a new deployment"
echo "   - Choose region: $REGION"
echo "   - Plan: Production (at least 2GB RAM)"
echo "   - Save credentials to .env.local"
echo ""

echo -e "${BLUE}Alternative: Self-hosted Elasticsearch${NC}"
echo "   - Use Docker: docker run -d --name elasticsearch -p 9200:9200 -e discovery.type=single-node elasticsearch:8.13.0"
echo "   - Or use managed service (AWS OpenSearch, etc.)"
echo ""

# Step 2: Caching Setup
print_info "Step 2: Caching Infrastructure"

echo -e "${BLUE}Redis Setup Options:${NC}"
echo "1. Upstash Redis (Recommended for Vercel)"
echo "   - Visit: https://upstash.com"
echo "   - Create new database"
echo "   - Region: $REGION"
echo "   - Save REST URL and token to .env.local"
echo ""

echo -e "${BLUE}Alternative: Redis Cloud${NC}"
echo "   - Visit: https://redis.com/redis-enterprise-cloud/overview/"
echo "   - Create free tier account"
echo "   - Deploy in $REGION"
echo ""

# Step 3: Authentication Setup
print_info "Step 3: Authentication Infrastructure"

echo -e "${BLUE}Supabase Setup:${NC}"
echo "1. Visit: https://supabase.com"
echo "2. Create new project"
echo "3. Choose region: $REGION"
echo "4. Save project URL and keys to .env.local"
echo "5. Enable authentication providers as needed"
echo ""

# Step 4: Payment Processing
print_info "Step 4: Payment Infrastructure"

echo -e "${BLUE}Stripe Setup:${NC}"
echo "1. Visit: https://stripe.com"
echo "2. Create account and get API keys"
echo "3. Set up webhook endpoint: https://your-domain.com/api/webhooks/stripe"
echo "4. Save keys to .env.local"
echo "5. Configure products and pricing plans"
echo ""

# Step 5: Monitoring Setup
print_info "Step 5: Monitoring Infrastructure"

echo -e "${BLUE}Sentry Setup (Error Tracking):${NC}"
echo "1. Visit: https://sentry.io"
echo "2. Create new project"
echo "3. Choose Next.js framework"
echo "4. Save DSN to .env.local"
echo ""

echo -e "${BLUE}Google Analytics Setup:${NC}"
echo "1. Visit: https://analytics.google.com"
echo "2. Create new property"
echo "3. Get tracking ID"
echo "4. Save to .env.local"
echo ""

# Step 6: Email Service
print_info "Step 6: Email Infrastructure"

echo -e "${BLUE}Email Service Options:${NC}"
echo "1. SendGrid (Recommended)"
echo "   - Visit: https://sendgrid.com"
echo "   - Create account and verify domain"
echo "   - Get API key and save to .env.local"
echo ""

echo -e "${BLUE}Alternative: Resend${NC}"
echo "   - Visit: https://resend.com"
echo "   - Create account and verify domain"
echo "   - Get API key and save to .env.local"
echo ""

# Step 7: Domain and SSL
print_info "Step 7: Domain and SSL Setup"

echo -e "${BLUE}Domain Setup:${NC}"
echo "1. Purchase domain (e.g., bmvfinder.com)"
echo "2. Configure DNS records:"
echo "   - A record: @ → Vercel IP"
echo "   - CNAME: www → your-vercel-domain.vercel.app"
echo "3. Add domain to Vercel project"
echo "4. SSL certificate will be auto-provisioned"
echo ""

# Step 8: Security Setup
print_info "Step 8: Security Infrastructure"

echo -e "${BLUE}Security Headers:${NC}"
echo "✅ Already configured in next.config.js"
echo ""

echo -e "${BLUE}Rate Limiting:${NC}"
echo "✅ Already implemented in API routes"
echo ""

echo -e "${BLUE}Environment Variables:${NC}"
echo "✅ Use production.env.example as template"
echo ""

# Step 9: Performance Setup
print_info "Step 9: Performance Infrastructure"

echo -e "${BLUE}CDN Setup:${NC}"
echo "✅ Vercel provides global CDN automatically"
echo ""

echo -e "${BLUE}Image Optimization:${NC}"
echo "✅ Next.js Image component configured"
echo ""

# Step 10: Backup Strategy
print_info "Step 10: Backup Infrastructure"

echo -e "${BLUE}Database Backups:${NC}"
echo "1. Elasticsearch: Enable snapshots"
echo "2. Supabase: Automatic backups enabled"
echo "3. Redis: Enable persistence"
echo ""

echo -e "${BLUE}Application Backups:${NC}"
echo "1. Code: GitHub repository"
echo "2. Environment: Secure storage"
echo "3. Data: Regular exports"
echo ""

# Step 11: CI/CD Setup
print_info "Step 11: CI/CD Infrastructure"

echo -e "${BLUE}GitHub Actions Setup:${NC}"
echo "1. Create .github/workflows/deploy.yml"
echo "2. Configure secrets:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_PROJECT_ID"
echo "   - VERCEL_ORG_ID"
echo "3. Enable automatic deployments"
echo ""

# Step 12: Environment Variables Checklist
print_info "Step 12: Environment Variables Checklist"

cat > env-checklist.md << 'EOF'
# Environment Variables Checklist

## Required Variables
- [ ] DATABASE_URL
- [ ] ELASTICSEARCH_URL
- [ ] ELASTICSEARCH_USERNAME
- [ ] ELASTICSEARCH_PASSWORD
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] ONS_API_KEY
- [ ] GOOGLE_MAPS_API_KEY
- [ ] SENTRY_DSN
- [ ] GOOGLE_ANALYTICS_ID
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASSWORD
- [ ] FROM_EMAIL
- [ ] REDIS_URL
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN
- [ ] JWT_SECRET
- [ ] ENCRYPTION_KEY

## Optional Variables
- [ ] MIXPANEL_TOKEN
- [ ] ENABLE_ANALYTICS
- [ ] ENABLE_NOTIFICATIONS
- [ ] ENABLE_PAYMENTS
- [ ] ENABLE_PREDICTIONS

## Security Notes
- Use strong, unique secrets
- Rotate secrets regularly
- Never commit .env.local to git
- Use different secrets for each environment
EOF

print_status "Environment checklist created: env-checklist.md"

# Step 13: Cost Estimation
print_info "Step 13: Cost Estimation"

cat > cost-estimation.md << 'EOF'
# Monthly Cost Estimation

## Infrastructure Costs
- Vercel Pro: $20/month
- Elastic Cloud: $50-100/month
- Upstash Redis: $10-20/month
- Supabase Pro: $25/month
- SendGrid: $15/month
- Sentry: $26/month
- Domain: $10-15/year

## Total Estimated Cost: $150-200/month

## Cost Optimization Tips
1. Start with free tiers where possible
2. Monitor usage and scale gradually
3. Use reserved instances for predictable workloads
4. Implement proper caching to reduce database costs
5. Set up billing alerts
EOF

print_status "Cost estimation created: cost-estimation.md"

# Final Summary
echo ""
echo -e "${GREEN}🎉 Infrastructure Setup Guide Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Follow each step above to set up services"
echo "2. Update .env.local with all credentials"
echo "3. Run: ./scripts/deploy-production.sh"
echo "4. Test all functionality"
echo "5. Set up monitoring and alerting"
echo ""
echo -e "${BLUE}Important Files Created:${NC}"
echo "• env-checklist.md - Environment variables checklist"
echo "• cost-estimation.md - Monthly cost estimation"
echo ""
echo -e "${BLUE}Support:${NC}"
echo "• Vercel Documentation: https://vercel.com/docs"
echo "• Elasticsearch Documentation: https://www.elastic.co/guide"
echo "• Supabase Documentation: https://supabase.com/docs"
echo "• Stripe Documentation: https://stripe.com/docs"
echo ""

print_status "Infrastructure setup guide completed!" 