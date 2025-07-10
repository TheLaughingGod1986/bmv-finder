#!/bin/bash

# Manual execution script for recent sales indexing
# Use this to run the indexing process manually

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Manual Recent Sales Indexing"
echo "============================"

# Change to project directory
cd "$PROJECT_DIR"

# Check if Elasticsearch is running
if ! curl -s http://localhost:9200 >/dev/null 2>&1; then
    echo "Error: Elasticsearch is not running on localhost:9200"
    echo "Please start Elasticsearch first"
    exit 1
fi

# Show usage
echo "Usage options:"
echo "1. Index all postcodes from existing property data:"
echo "   node scripts/populate-recent-sales.js"
echo ""
echo "2. Index specific postcodes:"
echo "   node scripts/populate-recent-sales.js SW1A1AA W1A1AA M11AA"
echo ""
echo "3. Index postcodes from file:"
echo "   # Edit scripts/postcodes-to-index.txt first, then run:"
echo "   node scripts/populate-recent-sales.js"
echo ""

# Ask user what they want to do
read -p "Do you want to proceed with indexing all postcodes from existing data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting indexing process..."
    node "$SCRIPT_DIR/populate-recent-sales.js"
else
    echo "Please run the script manually with your desired options"
    echo "Example: node scripts/populate-recent-sales.js SW1A1AA W1A1AA"
fi
