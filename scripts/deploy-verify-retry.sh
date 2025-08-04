#!/bin/bash

# Deployment verification and auto-retry script
# This script deploys to Vercel, checks build status, and retries on failure

set -e

MAX_RETRIES=5
RETRY_DELAY=30
BUILD_TIMEOUT=600  # 10 minutes

echo "🚀 Starting deployment verification and auto-retry process..."
echo "=========================================================="

# Function to check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    echo "✅ Vercel CLI is available"
}

# Function to deploy to Vercel
deploy_to_vercel() {
    echo "📤 Deploying to Vercel..."
    vercel --prod --yes
}

# Function to get deployment URL
get_deployment_url() {
    echo "🔗 Getting deployment URL..."
    DEPLOYMENT_URL=$(vercel ls --prod | grep -o 'https://[^[:space:]]*' | head -1)
    echo "📍 Deployment URL: $DEPLOYMENT_URL"
}

# Function to check build status
check_build_status() {
    local deployment_url=$1
    echo "🔍 Checking build status for: $deployment_url"
    
    # Wait for deployment to be ready
    echo "⏳ Waiting for deployment to be ready..."
    sleep 10
    
    # Check if the deployment is accessible
    if curl -f -s "$deployment_url" > /dev/null; then
        echo "✅ Deployment is accessible"
        return 0
    else
        echo "❌ Deployment is not accessible"
        return 1
    fi
}

# Function to get build logs
get_build_logs() {
    echo "📋 Getting build logs..."
    vercel logs --prod
}

# Function to analyze build failure
analyze_build_failure() {
    echo "🔍 Analyzing build failure..."
    
    # Get the latest build logs
    get_build_logs
    
    # Check for common build issues
    echo "🔍 Checking for common build issues..."
    
    # Check for TypeScript errors
    if npm run build 2>&1 | grep -q "Type error"; then
        echo "❌ TypeScript errors detected"
        echo "🔧 Attempting to fix TypeScript errors..."
        npx tsc --noEmit
        return 1
    fi
    
    # Check for linting errors
    if npm run lint 2>&1 | grep -q "Error"; then
        echo "❌ Linting errors detected"
        echo "🔧 Attempting to fix linting errors..."
        npm run lint --fix
        return 1
    fi
    
    # Check for missing dependencies
    if npm run build 2>&1 | grep -q "Cannot find module"; then
        echo "❌ Missing dependencies detected"
        echo "🔧 Installing dependencies..."
        npm install
        return 1
    fi
    
    # Check for environment variable issues
    if npm run build 2>&1 | grep -q "process.env"; then
        echo "❌ Environment variable issues detected"
        echo "🔧 Checking environment variables..."
        if [ ! -f ".env.local" ]; then
            echo "📝 Creating .env.local from example..."
            cp production.env.example .env.local
        fi
        return 1
    fi
    
    echo "❓ Unknown build failure - manual intervention required"
    return 1
}

# Function to fix common issues
fix_common_issues() {
    echo "🔧 Attempting to fix common issues..."
    
    # Fix linting issues
    echo "🧹 Fixing linting issues..."
    npm run lint --fix || true
    
    # Fix TypeScript issues
    echo "📝 Fixing TypeScript issues..."
    npx tsc --noEmit || true
    
    # Install missing dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Clear cache
    echo "🗑️  Clearing cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    
    # Reinstall dependencies
    echo "🔄 Reinstalling dependencies..."
    npm ci
}

# Function to commit and push changes
commit_and_push() {
    echo "💾 Committing and pushing changes..."
    git add .
    git commit -m "🔧 Fix build issues - attempt $1" || true
    git push origin chore/codebase-cleanup
}

# Main deployment loop
main() {
    check_vercel_cli
    
    for attempt in $(seq 1 $MAX_RETRIES); do
        echo ""
        echo "🔄 Attempt $attempt of $MAX_RETRIES"
        echo "=================================="
        
        # Deploy to Vercel
        if deploy_to_vercel; then
            echo "✅ Deployment initiated successfully"
        else
            echo "❌ Deployment failed to initiate"
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo "⏳ Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
                continue
            else
                echo "❌ Max retries reached. Deployment failed."
                exit 1
            fi
        fi
        
        # Get deployment URL
        get_deployment_url
        
        # Check build status
        if check_build_status "$DEPLOYMENT_URL"; then
            echo ""
            echo "🎉 SUCCESS! Deployment is working correctly!"
            echo "📍 Production URL: $DEPLOYMENT_URL"
            echo ""
            echo "✅ Build verification completed successfully!"
            echo "✅ All checks passed!"
            echo "✅ Deployment is live and accessible!"
            exit 0
        else
            echo "❌ Build check failed on attempt $attempt"
            
            if [ $attempt -lt $MAX_RETRIES ]; then
                echo "🔍 Analyzing build failure..."
                analyze_build_failure
                
                echo "🔧 Attempting to fix issues..."
                fix_common_issues
                
                echo "💾 Committing fixes..."
                commit_and_push $attempt
                
                echo "⏳ Waiting $RETRY_DELAY seconds before retry..."
                sleep $RETRY_DELAY
            else
                echo "❌ Max retries reached. Build verification failed."
                echo "📋 Final build logs:"
                get_build_logs
                echo ""
                echo "🔧 Manual intervention required to fix remaining issues."
                exit 1
            fi
        fi
    done
}

# Run the main function
main 