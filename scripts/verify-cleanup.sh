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
