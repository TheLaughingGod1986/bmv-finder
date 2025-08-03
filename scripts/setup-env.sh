#!/bin/bash

# BMV Finder Environment Setup Script
# This script helps you set up your local development environment

set -e

echo "🚀 BMV Finder Environment Setup"
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp production.env.example .env.local
    echo "✅ Created .env.local"
else
    echo "📝 .env.local already exists"
fi

# Function to update environment variable
update_env_var() {
    local key=$1
    local value=$2
    local description=$3
    
    echo ""
    echo "🔧 $description"
    echo "Current value: $(grep "^$key=" .env.local | cut -d'=' -f2- | tr -d '"' || echo 'not set')"
    read -p "Enter new value (or press Enter to keep current): " new_value
    
    if [ ! -z "$new_value" ]; then
        # Use sed to update the value
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^$key=.*|$key=\"$new_value\"|" .env.local
        else
            # Linux
            sed -i "s|^$key=.*|$key=\"$new_value\"|" .env.local
        fi
        echo "✅ Updated $key"
    else
        echo "⏭️  Keeping current value"
    fi
}

# Update key environment variables
update_env_var "ELASTICSEARCH_URL" "http://localhost:9201" "Elasticsearch URL (local development)"
update_env_var "NEXT_PUBLIC_APP_URL" "http://localhost:3000" "App URL (local development)"
update_env_var "NEXTAUTH_URL" "http://localhost:3000" "NextAuth URL (local development)"
update_env_var "NEXT_PUBLIC_SUPPORT_EMAIL" "support@bmvfinder.com" "Support email address"

echo ""
echo "🔍 Checking Docker status..."
if docker info >/dev/null 2>&1; then
    echo "✅ Docker is running"
    
    echo ""
    echo "🐳 Starting Elasticsearch..."
    if docker-compose -f docker-compose.elasticsearch.yml up -d; then
        echo "✅ Elasticsearch started successfully"
        echo "📊 Elasticsearch will be available at: http://localhost:9201"
        echo "⏳ Waiting for Elasticsearch to be ready..."
        
        # Wait for Elasticsearch to be ready
        max_attempts=30
        attempt=1
        while [ $attempt -le $max_attempts ]; do
            if curl -s http://localhost:9201 >/dev/null 2>&1; then
                echo "✅ Elasticsearch is ready!"
                break
            fi
            echo "⏳ Attempt $attempt/$max_attempts - Waiting for Elasticsearch..."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo "⚠️  Elasticsearch may still be starting up. You can check manually:"
            echo "   curl http://localhost:9201"
        fi
    else
        echo "❌ Failed to start Elasticsearch"
    fi
else
    echo "⚠️  Docker is not running"
    echo "   Please start Docker Desktop and run this script again"
    echo "   Or manually start Elasticsearch with:"
    echo "   docker-compose -f docker-compose.elasticsearch.yml up -d"
fi

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo "📝 Next steps:"
echo "1. Review and update .env.local with your actual values"
echo "2. Install dependencies: npm install"
echo "3. Start the development server: npm run dev"
echo "4. Test the health check: npm run health:check"
echo ""
echo "📚 Documentation:"
echo "- HARDCODED_VALUES_FIX.md - Details about the fixes made"
echo "- ENV_ORGANIZATION_GUIDE.md - Environment variable organization"
echo "- src/lib/config.ts - Centralized configuration" 