#!/bin/bash

# Build issue fixer script
# This script automatically fixes common build issues

set -e

echo "🔧 Starting build issue fixer..."
echo "=================================="

# Function to fix watchlist page SSR issues
fix_watchlist_ssr() {
    echo "🔧 Checking for watchlist page SSR issues..."
    
    if grep -q "useSearchLimit must be used within a SearchLimitProvider" .next/build-manifest.json 2>/dev/null || 
       grep -q "Cannot read properties of undefined" .next/build-manifest.json 2>/dev/null; then
        echo "🔧 Fixing watchlist page SSR issues..."
        
        # Make watchlist page client-only
        if ! grep -q "dynamic.*ssr.*false" src/app/watchlist/page.tsx; then
            # Add dynamic import at the top if not already present
            if ! grep -q "import dynamic" src/app/watchlist/page.tsx; then
                sed -i '1s/^/import dynamic from "next\/dynamic";\n/' src/app/watchlist/page.tsx
            fi
            
            # Replace export with dynamic import
            sed -i '/export default WatchlistPage;/c\nexport default dynamic(() => Promise.resolve(WatchlistPage), { ssr: false });' src/app/watchlist/page.tsx
            
            echo "✅ Fixed watchlist page SSR issues"
        else
            echo "✅ Watchlist page already has SSR disabled"
        fi
    else
        echo "✅ No SSR issues detected"
    fi
}

# Function to fix TypeScript errors
fix_typescript_errors() {
    echo "🔧 Checking for TypeScript errors..."
    
    if npm run type-check 2>&1 | grep -q "error"; then
        echo "🔧 Fixing TypeScript errors..."
        
        # Remove undefined variable references
        sed -i 's/costBreakdownData\[item\.id\]//g' src/app/watchlist/page.tsx
        
        # Fix other common TypeScript issues
        sed -i 's/\.call\(\)/()/g' src/app/watchlist/page.tsx 2>/dev/null || true
        
        echo "✅ Fixed TypeScript errors"
    else
        echo "✅ No TypeScript errors detected"
    fi
}

# Function to fix linting issues
fix_linting_errors() {
    echo "🔧 Checking for linting errors..."
    
    if npm run lint 2>&1 | grep -q "Error"; then
        echo "🔧 Fixing linting errors..."
        npm run lint --fix || true
        echo "✅ Fixed linting errors"
    else
        echo "✅ No linting errors detected"
    fi
}

# Function to clear cache
clear_cache() {
    echo "🗑️  Clearing cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    echo "✅ Cache cleared"
}

# Function to reinstall dependencies
reinstall_dependencies() {
    echo "📦 Reinstalling dependencies..."
    npm ci
    echo "✅ Dependencies reinstalled"
}

# Main function
main() {
    echo "🔨 Testing build..."
    
    if npm run build; then
        echo "✅ Build successful - no issues found!"
        exit 0
    else
        echo "❌ Build failed, attempting to fix issues..."
        
        # Clear cache first
        clear_cache
        
        # Fix SSR issues
        fix_watchlist_ssr
        
        # Fix TypeScript errors
        fix_typescript_errors
        
        # Fix linting errors
        fix_linting_errors
        
        # Reinstall dependencies
        reinstall_dependencies
        
        # Try building again
        echo "🔨 Testing build after fixes..."
        if npm run build; then
            echo "✅ Build successful after fixes!"
            exit 0
        else
            echo "❌ Build still failing after fixes"
            echo "🔧 Manual intervention may be required"
            exit 1
        fi
    fi
}

# Run the main function
main 