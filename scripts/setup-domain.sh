#!/bin/bash

# Domain Setup Script for Property Intelligence Platform
# This script helps automate the domain configuration process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CURRENT_URL="https://bmv-finder-bpcueqrtv-bens-projects-11c93b15.vercel.app"
PROJECT_NAME="bmv-finder"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Please provide a domain name"
    echo "Usage: ./scripts/setup-domain.sh yourdomain.com"
    echo ""
    echo "Example: ./scripts/setup-domain.sh bmvfinder.com"
    exit 1
fi

DOMAIN=$1

print_header "Domain Setup for Property Intelligence Platform"
echo ""
print_status "Setting up domain: $DOMAIN"
print_status "Current URL: $CURRENT_URL"
echo ""

# Step 1: Check if Vercel CLI is installed
print_status "Step 1: Checking Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed"
    echo "Please install it with: npm i -g vercel"
    exit 1
fi
print_success "Vercel CLI is installed"

# Step 2: Check if user is logged in to Vercel
print_status "Step 2: Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    print_error "Not logged in to Vercel"
    echo "Please run: vercel login"
    exit 1
fi
print_success "Logged in to Vercel"

# Step 3: Add domain to Vercel
print_status "Step 3: Adding domain to Vercel..."
if vercel domains add $DOMAIN; then
    print_success "Domain added to Vercel"
else
    print_error "Failed to add domain to Vercel"
    echo "Please check if the domain is available and try again"
    exit 1
fi

# Step 4: Verify domain
print_status "Step 4: Verifying domain..."
if vercel domains verify $DOMAIN; then
    print_success "Domain verification initiated"
else
    print_warning "Domain verification failed or already verified"
fi

# Step 5: Update environment variables
print_status "Step 5: Updating environment variables..."
echo "Updating NEXT_PUBLIC_APP_URL to https://$DOMAIN"
if vercel env add NEXT_PUBLIC_APP_URL production; then
    print_success "NEXT_PUBLIC_APP_URL updated"
else
    print_warning "Failed to update NEXT_PUBLIC_APP_URL (may already exist)"
fi

echo "Updating NEXT_PUBLIC_BASE_URL to https://$DOMAIN"
if vercel env add NEXT_PUBLIC_BASE_URL production; then
    print_success "NEXT_PUBLIC_BASE_URL updated"
else
    print_warning "Failed to update NEXT_PUBLIC_BASE_URL (may already exist)"
fi

# Step 6: List current domains
print_status "Step 6: Current domain configuration..."
vercel domains ls

# Step 7: Provide next steps
print_header "Next Steps"
echo ""
print_status "1. Configure DNS records with your domain provider:"
echo "   - A record: @ → 76.76.19.36"
echo "   - CNAME record: www → cname.vercel-dns.com"
echo ""
print_status "2. Update OAuth settings:"
echo "   - Supabase: https://supabase.com/dashboard"
echo "   - Google Cloud Console: https://console.cloud.google.com/"
echo ""
print_status "3. Test the domain:"
echo "   - Visit: https://$DOMAIN"
echo "   - Check SSL certificate"
echo "   - Test OAuth login"
echo ""
print_status "4. Update SEO settings:"
echo "   - Google Search Console"
echo "   - Google Analytics"
echo "   - Submit sitemap: https://$DOMAIN/sitemap.xml"
echo ""

print_success "Domain setup script completed!"
print_status "Please follow the next steps above to complete the configuration."
echo ""
print_warning "Note: DNS propagation can take 24-48 hours"
print_warning "Note: SSL certificate provisioning can take up to 24 hours" 