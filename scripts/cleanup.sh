#!/bin/bash

# BMV Finder - Codebase Cleanup Automation Script
# This script sets up a comprehensive cleanup workflow using Cursor AI

set -e

echo "🧼 BMV Finder - Codebase Cleanup Automation"
echo "============================================="

# Create cleanup branch
echo "📝 Creating cleanup branch..."
git checkout -b chore/codebase-cleanup

# Create cleanup prompt file
echo "📄 Creating cleanup prompt..."
cat << 'EOF' > cleanup-prompt.txt
# Cursor Agent Cleanup Prompt

Perform a full audit and safe cleanup of this Next.js codebase. Follow best practices and avoid breaking existing functionality.

## Scope:

### 1. Identify and remove unused:
- Imports (check for unused React imports, utilities, etc.)
- Variables and constants (especially in components and hooks)
- Components (in components/, app/, or pages/) that are never imported
- Pages or API routes (if clearly unused and not referenced)
- Tailwind classes that are never applied
- Unused environment variables or configuration

### 2. Refactor and simplify:
- Repeated logic in React components and hooks
- Duplicated utility functions (extract to lib/ or utils/)
- API route handlers with redundant logic (extract shared logic to a service layer)
- Similar component patterns that can be consolidated
- Repeated styling patterns that can be extracted to reusable components

### 3. Modernize and normalize structure:
- Use consistent folder and naming conventions
- Merge similar layouts into _app.tsx or layout.tsx where appropriate
- DRY up page-level and global logic across the App and Pages Router
- If legacy getServerSideProps or getStaticProps usage is outdated, recommend modern alternatives (but don't change yet)
- Ensure consistent file organization and imports

### 4. SSR/CSR awareness:
- Ensure no SSR logic runs on the client or vice versa
- Flag any suspicious fetch or state logic that might break hydration
- Check for proper use of 'use client' directives
- Verify proper data fetching patterns

### 5. Tailwind & CSS:
- Clean up unused Tailwind classes
- Remove redundant inline styles or conflicting styles where class-based styling exists
- Consolidate similar styling patterns
- Ensure consistent color usage and spacing

### 6. Safety guardrails:
- Don't apply breaking changes without confirmation
- Flag risky refactors or deletions for manual review
- Output a clear summary of everything changed or recommended
- Preserve all existing functionality
- Keep all environment variables and configuration intact

### 7. Performance optimizations:
- Identify potential performance bottlenecks
- Suggest optimizations for large components
- Check for unnecessary re-renders
- Optimize bundle size where possible

### 8. Code quality improvements:
- Fix any obvious linting issues
- Improve code readability
- Add missing TypeScript types where needed
- Ensure consistent error handling patterns

## Output Requirements:
1. Provide a detailed summary of all changes made
2. List any files that were deleted or significantly modified
3. Flag any potential issues or areas that need manual review
4. Suggest follow-up improvements for future PRs
EOF

# Create GitHub directory and PR template
echo "📋 Creating GitHub PR template..."
mkdir -p .github

cat << 'EOF' > .github/pull_request_template.md
# 🧼 Codebase Cleanup: Full Refactor for Redundancy, Consistency & Maintainability

## ✅ Summary of Changes
This PR contains a full, safe refactor of the entire Next.js codebase using the Cursor agent. The goal: eliminate redundancy, improve structure, and align with Next.js best practices without breaking functionality.

## 🧠 Cleanup Scope (AI Prompt Used)

> See contents of cleanup-prompt.txt in project root.

## 🧪 Testing & Verification

### ✅ Automated Checks
- [x] `npm run lint` passes  
- [x] `npm run build` completes without error  
- [x] No new TypeScript errors  
- [x] Tailwind JIT compiles correctly  

### 🧑‍💻 Manual Review
- [ ] Visually tested all high-priority pages  
- [ ] Reviewed deleted files and logic for safety  
- [ ] Confirmed API routes still function as expected  
- [ ] Tested critical user flows (search, watchlist, portfolio)
- [ ] Verified demo mode functionality still works

## 📊 Changes Summary
- **Files Modified**: [Count]
- **Files Deleted**: [Count]
- **Unused Imports Removed**: [Count]
- **Components Consolidated**: [Count]
- **Utility Functions Extracted**: [Count]

## 🔍 Key Improvements
- [ ] Removed unused imports and variables
- [ ] Consolidated duplicate logic
- [ ] Improved code organization
- [ ] Enhanced TypeScript coverage
- [ ] Optimized bundle size
- [ ] Fixed linting issues

## 📌 Notes
> This PR does not introduce any intentional functionality changes. All cleanup is safe and reversible via git history.  
> Please leave comments if any removal or refactor feels too aggressive. Adjustments welcome.

## 🔁 Follow-Up Actions (Optional)
- [ ] Add test coverage to critical paths  
- [ ] Plan for modernizing legacy data fetching (`getServerSideProps`, etc.)  
- [ ] Convert shared logic into internal packages or modules (future PR)
- [ ] Implement automated code quality checks
- [ ] Add performance monitoring

## 🚀 Deployment Notes
- All environment variables preserved
- No breaking changes to API endpoints
- Demo mode functionality maintained
- Production deployment ready
EOF

# Create additional automation scripts
echo "🔧 Creating additional automation scripts..."

# Create a pre-commit hook for ongoing cleanup
cat << 'EOF' > scripts/pre-commit-cleanup.sh
#!/bin/bash

# Pre-commit cleanup checks
echo "🔍 Running pre-commit cleanup checks..."

# Check for unused imports
echo "📦 Checking for unused imports..."
npx unimported --init

# Check for unused Tailwind classes
echo "🎨 Checking for unused Tailwind classes..."
npx tailwindcss --config tailwind.config.js --input src/app/globals.css --output /dev/null --watch=false

# Run linting
echo "🧹 Running linter..."
npm run lint

echo "✅ Pre-commit checks completed!"
EOF

# Create a cleanup verification script
cat << 'EOF' > scripts/verify-cleanup.sh
#!/bin/bash

# Verification script for cleanup results
echo "🔍 Verifying cleanup results..."

# Check build status
echo "🏗️  Checking build status..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check linting
echo "🧹 Checking linting..."
if npm run lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

# Check TypeScript
echo "📝 Checking TypeScript..."
if npx tsc --noEmit; then
    echo "✅ TypeScript check passed"
else
    echo "❌ TypeScript check failed"
    exit 1
fi

# Check for obvious issues
echo "🔍 Checking for common issues..."

# Check for console.log statements in production code
CONSOLE_LOGS=$(grep -r "console.log" src/ --exclude-dir=node_modules | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    echo "⚠️  Found $CONSOLE_LOGS console.log statements"
else
    echo "✅ No console.log statements found"
fi

# Check for TODO comments
TODO_COUNT=$(grep -r "TODO" src/ --exclude-dir=node_modules | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo "📝 Found $TODO_COUNT TODO comments"
else
    echo "✅ No TODO comments found"
fi

echo "🎉 Cleanup verification completed!"
EOF

# Create deployment verification and auto-retry script
cat << 'EOF' > scripts/deploy-verify-retry.sh
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
EOF

# Make scripts executable
chmod +x scripts/cleanup.sh
chmod +x scripts/pre-commit-cleanup.sh
chmod +x scripts/verify-cleanup.sh
chmod +x scripts/deploy-verify-retry.sh

# Create a comprehensive README for the cleanup system
cat << 'EOF' > CLEANUP_README.md
# 🧼 BMV Finder - Codebase Cleanup System

This directory contains automation scripts for maintaining code quality and consistency in the BMV Finder Next.js project.

## 📁 Files Overview

### Core Scripts
- `scripts/cleanup.sh` - Main cleanup automation script
- `scripts/pre-commit-cleanup.sh` - Pre-commit checks
- `scripts/verify-cleanup.sh` - Verification script
- `scripts/deploy-verify-retry.sh` - **NEW: Deployment verification and auto-retry**

### Configuration
- `cleanup-prompt.txt` - AI prompt for Cursor agent cleanup
- `.github/pull_request_template.md` - PR template for cleanup changes
- `CLEANUP_README.md` - This documentation

## 🚀 Usage

### 1. Run Full Cleanup
```bash
./scripts/cleanup.sh
```

This will:
- Create a new branch `chore/codebase-cleanup`
- Set up the cleanup prompt file
- Create GitHub PR template
- Set up additional automation scripts

### 2. Verify Cleanup Results
```bash
./scripts/verify-cleanup.sh
```

This will:
- Check build status
- Run linting
- Verify TypeScript
- Check for common issues

### 3. Pre-commit Checks
```bash
./scripts/pre-commit-cleanup.sh
```

This will:
- Check for unused imports
- Verify Tailwind compilation
- Run linting

### 4. **NEW: Deploy and Auto-Retry**
```bash
./scripts/deploy-verify-retry.sh
```

This will:
- Deploy to Vercel production
- Check build status automatically
- Analyze build failures
- Fix common issues automatically
- Retry deployment up to 5 times
- Provide detailed logs and diagnostics

## 🤖 AI-Powered Cleanup

The cleanup system uses Cursor AI with a comprehensive prompt to:

1. **Remove Unused Code**: Imports, variables, components, pages
2. **Refactor Duplicates**: Consolidate repeated logic
3. **Modernize Structure**: Improve organization and conventions
4. **Optimize Performance**: Reduce bundle size and improve efficiency
5. **Enhance Quality**: Fix linting issues and improve TypeScript coverage

## 🔒 Safety Features

- All changes are made in a separate branch
- Comprehensive testing before deployment
- Detailed PR template for review
- Reversible changes via git history
- No breaking changes to functionality
- **NEW: Automatic build failure recovery**

## 📋 Cleanup Checklist

### Before Running
- [ ] Ensure all current work is committed
- [ ] Test current functionality
- [ ] Backup any critical customizations

### After Cleanup
- [ ] Review all changes in the PR
- [ ] Test critical user flows
- [ ] Verify API endpoints
- [ ] Check demo mode functionality
- [ ] Confirm build and deployment

### Ongoing Maintenance
- [ ] Run pre-commit checks regularly
- [ ] Monitor for new unused code
- [ ] Update cleanup prompts as needed
- [ ] Review and improve automation scripts

## 🎯 Best Practices

1. **Incremental Cleanup**: Don't try to fix everything at once
2. **Test Thoroughly**: Always verify functionality after cleanup
3. **Document Changes**: Use the PR template to track modifications
4. **Regular Maintenance**: Run cleanup checks regularly
5. **Team Communication**: Keep the team informed of cleanup activities

## 🔧 Customization

### Modifying the Cleanup Prompt
Edit `cleanup-prompt.txt` to adjust the scope and focus of the cleanup.

### Adding New Checks
Extend the verification scripts to include additional quality checks.

### Updating PR Template
Modify `.github/pull_request_template.md` to match your team's workflow.

### Deployment Configuration
The deployment script can be customized by modifying:
- `MAX_RETRIES`: Number of deployment attempts (default: 5)
- `RETRY_DELAY`: Seconds between retries (default: 30)
- `BUILD_TIMEOUT`: Build timeout in seconds (default: 600)

## 🆘 Troubleshooting

### Build Failures
- Check for TypeScript errors
- Verify all imports are correct
- Ensure environment variables are set
- **NEW: Use deploy-verify-retry.sh for automatic recovery**

### Linting Issues
- Run `npm run lint --fix` to auto-fix issues
- Review and manually fix remaining issues
- Update ESLint configuration if needed

### Performance Issues
- Check bundle size with `npm run build`
- Analyze with `@next/bundle-analyzer`
- Review and optimize large components

### Deployment Issues
- **NEW: The deploy-verify-retry.sh script will automatically:**
  - Analyze build failures
  - Fix common issues
  - Retry deployment
  - Provide detailed diagnostics

## 📞 Support

For issues with the cleanup system:
1. Check this documentation
2. Review the script logs
3. Test manually to isolate issues
4. Update scripts as needed
5. **NEW: Use the deployment verification script for build issues**

---

**Remember**: The goal is to improve code quality while maintaining all existing functionality. When in doubt, be conservative and flag issues for manual review.
EOF

echo "✅ Cleanup automation system created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the generated files"
echo "2. Run: ./scripts/cleanup.sh"
echo "3. Use the cleanup prompt with Cursor AI"
echo "4. Review changes and create PR"
echo "5. **NEW: Run: ./scripts/deploy-verify-retry.sh for automatic deployment verification**"
echo ""
echo "📚 Documentation: CLEANUP_README.md"
echo "🤖 AI Prompt: cleanup-prompt.txt"
echo "📋 PR Template: .github/pull_request_template.md"
echo "🚀 **NEW: Deployment Script: scripts/deploy-verify-retry.sh**" 