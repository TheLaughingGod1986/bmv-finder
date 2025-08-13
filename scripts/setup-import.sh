#!/bin/bash

# CSV to Elasticsearch Import Setup Script
# This script helps you quickly set up and run CSV imports

echo "🚀 CSV to Elasticsearch Import Setup"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install csv-parser @elastic/elasticsearch
fi

# Check if Elasticsearch is running
echo "🔍 Checking Elasticsearch connection..."
if curl -s "http://localhost:9201/_cluster/health" > /dev/null; then
    echo "✅ Elasticsearch is running on localhost:9201"
else
    echo "❌ Elasticsearch is not running on localhost:9201"
    echo "   Please start Elasticsearch first"
    exit 1
fi

echo ""
echo "📋 Next steps:"
echo "1. Copy csv-to-elasticsearch-template.js to a new file for your import"
echo "2. Modify the CONFIG section with your settings:"
echo "   - INDEX_NAME: Your index name"
echo "   - CSV_FILE_PATH: Path to your CSV file"
echo "   - BATCH_SIZE: Adjust based on your data size"
echo "3. Customize the processRow() function for your data structure"
echo "4. Run: node --max-old-space-size=8192 your-import-script.js"
echo ""
echo "💡 Tip: Use --max-old-space-size=8192 for large imports to avoid memory issues"
