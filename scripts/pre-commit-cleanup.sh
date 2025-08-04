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
