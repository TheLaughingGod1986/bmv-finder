#!/bin/bash

# Monitoring script for recent sales indexing
# Check the status of recent sales indexing jobs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/recent-sales-cron.log"
ERROR_LOG="$LOG_DIR/recent-sales-errors.log"

echo "Recent Sales Indexing Monitor"
echo "============================="

# Check if logs exist
if [ -f "$CRON_LOG" ]; then
    echo "✓ Cron log file exists: $CRON_LOG"
    echo "Last 10 log entries:"
    tail -10 "$CRON_LOG" | sed 's/^/  /'
else
    echo "✗ Cron log file not found: $CRON_LOG"
fi

if [ -f "$ERROR_LOG" ]; then
    echo ""
    echo "Recent errors:"
    tail -5 "$ERROR_LOG" | sed 's/^/  /'
else
    echo ""
    echo "✓ No error log file found (good!)"
fi

# Check Elasticsearch index
echo ""
echo "Elasticsearch Index Status:"
if curl -s http://localhost:9200/recent_sales >/dev/null 2>&1; then
    echo "✓ recent_sales index exists"
    
    # Get document count
    COUNT=$(curl -s http://localhost:9200/recent_sales/_count | jq -r '.count' 2>/dev/null || echo "unknown")
    echo "  Document count: $COUNT"
    
    # Get last indexed date
    LAST_INDEXED=$(curl -s http://localhost:9200/recent_sales/_search -H 'Content-Type: application/json' -d '{
        "size": 1,
        "sort": [{"indexedAt": {"order": "desc"}}],
        "_source": ["indexedAt"]
    }' | jq -r '.hits.hits[0]._source.indexedAt' 2>/dev/null || echo "unknown")
    echo "  Last indexed: $LAST_INDEXED"
else
    echo "✗ recent_sales index does not exist"
fi

# Check cron jobs
echo ""
echo "Cron Jobs Status:"
if crontab -l 2>/dev/null | grep -q "run-recent-sales-indexing.sh"; then
    echo "✓ Recent sales indexing cron jobs are installed"
    echo "Scheduled jobs:"
    crontab -l | grep "run-recent-sales-indexing.sh" | sed 's/^/  /'
else
    echo "✗ Recent sales indexing cron jobs not found"
fi
