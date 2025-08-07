#!/bin/bash

echo "🚀 Starting BMV Finder Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    echo "   You can start Docker by running: open -a Docker"
    exit 1
fi

echo "✅ Docker is running"

# Start Elasticsearch
echo "🔍 Starting Elasticsearch..."
docker-compose -f docker-compose.elasticsearch.yml up -d

# Wait for Elasticsearch to be ready
echo "⏳ Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:9201/_cluster/health > /dev/null 2>&1; then
        echo "✅ Elasticsearch is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Check Elasticsearch health
echo "📊 Elasticsearch Status:"
curl -s http://localhost:9201/_cluster/health | jq '.status, .number_of_nodes, .active_shards' 2>/dev/null || echo "   Still starting up..."

# Check if indices exist
echo "📋 Available Indices:"
curl -s "http://localhost:9201/_cat/indices?v" 2>/dev/null || echo "   No indices found yet"

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the development server: npm run dev"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Try searching for a postcode like 'NE5 2PR'"
echo ""
echo "🔧 Useful commands:"
echo "   - View Elasticsearch logs: docker logs elasticsearch-enhanced"
echo "   - Stop services: docker-compose -f docker-compose.elasticsearch.yml down"
echo "   - Check Elasticsearch health: curl http://localhost:9201/_cluster/health" 