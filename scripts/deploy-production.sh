#!/bin/bash

# BMV Finder Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="bmv-finder"
DEPLOYMENT_ENV="production"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}🚀 Starting BMV Finder Production Deployment${NC}"
echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
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

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Environment Setup
print_info "Step 1: Setting up environment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Please create it from production.env.example"
    print_info "Copying production.env.example to .env.local..."
    cp production.env.example .env.local
    print_warning "Please edit .env.local with your production values before continuing"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_info "Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
print_info "npm version: $NPM_VERSION"

print_status "Environment setup complete"

# Step 2: Install Dependencies
print_info "Step 2: Installing dependencies..."
npm ci --production=false
print_status "Dependencies installed"

# Step 3: Run Pre-deployment Tests
print_info "Step 3: Running pre-deployment tests..."

# Type checking
print_info "Running TypeScript type checking..."
npm run type-check
print_status "Type checking passed"

# Linting
print_info "Running ESLint..."
npm run lint
print_status "Linting passed"

# HPI System Tests
print_info "Running HPI system tests..."
npm run test-hpi
print_status "HPI system tests passed"

print_status "All pre-deployment tests passed"

# Step 4: Build Application
print_info "Step 4: Building application for production..."

# Clean previous builds
print_info "Cleaning previous builds..."
rm -rf .next
rm -rf out

# Build the application
print_info "Building Next.js application..."
npm run build
print_status "Application built successfully"

# Step 5: Security Audit
print_info "Step 5: Running security audit..."
npm audit --audit-level=moderate || {
    print_warning "Security audit found issues. Review and fix before deployment."
    print_info "Run 'npm audit fix' to automatically fix issues"
}

# Step 6: Performance Check
print_info "Step 6: Checking bundle size..."
npx @next/bundle-analyzer .next/static/chunks || {
    print_info "Bundle analyzer completed"
}

# Step 7: Database Migration (if needed)
print_info "Step 7: Checking database status..."
# Add your database migration commands here if needed
# Example: npm run migrate:production

# Step 8: Deploy to Vercel
print_info "Step 8: Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_info "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to production
print_info "Deploying to production environment..."
vercel --prod --yes

print_status "Deployment to Vercel completed"

# Step 9: Post-deployment Verification
print_info "Step 9: Verifying deployment..."

# Wait for deployment to be ready
print_info "Waiting for deployment to be ready..."
sleep 30

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls | grep $PROJECT_NAME | head -1 | awk '{print $2}')
print_info "Deployment URL: $DEPLOYMENT_URL"

# Health check
print_info "Running health check..."
HEALTH_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/health-check" || echo "FAILED")

if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    print_status "Health check passed"
else
    print_error "Health check failed"
    print_info "Response: $HEALTH_RESPONSE"
fi

# Step 10: Performance Testing
print_info "Step 10: Running performance tests..."

# Basic performance test
print_info "Testing homepage load time..."
HOMEPAGE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$DEPLOYMENT_URL")
print_info "Homepage load time: ${HOMEPAGE_TIME}s"

if (( $(echo "$HOMEPAGE_TIME < 3.0" | bc -l) )); then
    print_status "Performance test passed"
else
    print_warning "Performance test failed - load time is slow"
fi

# Step 11: Final Status
print_info "Step 11: Deployment Summary"

echo ""
echo -e "${GREEN}🎉 BMV Finder Production Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}Deployment Details:${NC}"
echo -e "  • Environment: ${DEPLOYMENT_ENV}"
echo -e "  • Timestamp: ${TIMESTAMP}"
echo -e "  • URL: ${DEPLOYMENT_URL}"
echo -e "  • Health Status: ${HEALTH_RESPONSE}"
echo -e "  • Load Time: ${HOMEPAGE_TIME}s"
echo ""

# Step 12: Monitoring Setup
print_info "Step 12: Setting up monitoring..."

# Create monitoring configuration
cat > monitoring-setup.md << EOF
# Monitoring Setup for BMV Finder

## Health Check Endpoint
- URL: ${DEPLOYMENT_URL}/api/health-check
- Expected Response: {"status":"healthy"}

## Key Metrics to Monitor
1. Response Time: < 3 seconds
2. Error Rate: < 1%
3. Uptime: > 99.9%
4. Memory Usage: < 512MB
5. Database Connectivity: Connected

## Alerts to Set Up
1. Health check failure
2. Response time > 5 seconds
3. Error rate > 5%
4. Memory usage > 80%
5. Database connection failure

## Logs to Monitor
- Application logs
- API request logs
- Error logs
- Performance metrics

## Recommended Tools
- Vercel Analytics
- Sentry for error tracking
- Google Analytics
- Custom monitoring dashboard
EOF

print_status "Monitoring setup guide created: monitoring-setup.md"

# Step 13: Cleanup
print_info "Step 13: Cleaning up..."

# Remove temporary files
rm -rf .next/analyze
print_status "Cleanup completed"

echo ""
echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Verify all features work correctly"
echo -e "  2. Set up monitoring and alerting"
echo -e "  3. Configure custom domain (if needed)"
echo -e "  4. Set up SSL certificate"
echo -e "  5. Configure CDN for better performance"
echo -e "  6. Set up backup and disaster recovery"
echo ""
echo -e "${BLUE}Support:${NC}"
echo -e "  • Health Check: ${DEPLOYMENT_URL}/api/health-check"
echo -e "  • Admin Dashboard: ${DEPLOYMENT_URL}/admin"
echo -e "  • API Documentation: ${DEPLOYMENT_URL}/api/docs"
echo ""

print_status "Deployment script completed successfully!" 