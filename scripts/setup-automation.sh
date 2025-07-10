#!/bin/bash

# BMV Finder - Complete Data Automation Setup
# This script sets up automated data updates for both Land Registry and HPI data

echo "🚀 Setting up BMV Finder Data Automation..."
echo "=========================================="

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo "📁 Project directory: $PROJECT_DIR"
echo "📁 Logs directory: $PROJECT_DIR/logs"

# Check if Elasticsearch is running
echo "🔍 Checking Elasticsearch connection..."
if curl -s -k -u "elastic:TIRv--dMe*rHmuRMm-b4" "https://localhost:9200/_cluster/health" > /dev/null 2>&1; then
    echo "✅ Elasticsearch is running"
else
    echo "⚠️  Warning: Elasticsearch may not be running"
    echo "   Make sure Elasticsearch is started before cron jobs run"
fi

# Create the cron job entries
echo "📅 Creating cron jobs..."

# Weekly full Land Registry update (Sundays at 2 AM)
CRON_JOB_WEEKLY_LR="0 2 * * 0 cd $PROJECT_DIR && npm run update-es >> logs/cron-landregistry-weekly.log 2>&1"

# Daily incremental Land Registry update (Daily at 3 AM)
CRON_JOB_DAILY_LR="0 3 * * * cd $PROJECT_DIR && npm run update-es-incremental >> logs/cron-landregistry-daily.log 2>&1"

# Monthly HPI update (1st of each month at 4 AM)
CRON_JOB_MONTHLY_HPI="0 4 1 * * cd $PROJECT_DIR && node src/updateHpiFromOns.js >> logs/cron-hpi-monthly.log 2>&1"

# Weekly data health check (Saturdays at 6 AM)
CRON_JOB_HEALTH_CHECK="0 6 * * 6 cd $PROJECT_DIR && node scripts/check-hpi-data.js >> logs/cron-health-check.log 2>&1"

# Add cron jobs
echo "Adding weekly Land Registry update..."
(crontab -l 2>/dev/null; echo "$CRON_JOB_WEEKLY_LR") | crontab -

echo "Adding daily incremental Land Registry update..."
(crontab -l 2>/dev/null; echo "$CRON_JOB_DAILY_LR") | crontab -

echo "Adding monthly HPI update..."
(crontab -l 2>/dev/null; echo "$CRON_JOB_MONTHLY_HPI") | crontab -

echo "Adding weekly health check..."
(crontab -l 2>/dev/null; echo "$CRON_JOB_HEALTH_CHECK") | crontab -

echo ""
echo "✅ Automation setup completed successfully!"
echo ""
echo "📅 Scheduled jobs:"
echo "   - Weekly Land Registry update: Sundays at 2:00 AM"
echo "   - Daily incremental Land Registry update: Daily at 3:00 AM"
echo "   - Monthly HPI update: 1st of each month at 4:00 AM"
echo "   - Weekly health check: Saturdays at 6:00 AM"
echo ""
echo "📁 Log files:"
echo "   - cron-landregistry-weekly.log (full Land Registry updates)"
echo "   - cron-landregistry-daily.log (incremental Land Registry updates)"
echo "   - cron-hpi-monthly.log (HPI data updates)"
echo "   - cron-health-check.log (data health checks)"
echo ""
echo "🔧 Management commands:"
echo "   View current cron jobs: crontab -l"
echo "   Remove all cron jobs: crontab -r"
echo "   Edit cron jobs: crontab -e"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f logs/cron-landregistry-daily.log"
echo "   tail -f logs/cron-hpi-monthly.log"
echo ""
echo "⚠️  Important notes:"
echo "   - Make sure Elasticsearch is running before cron jobs execute"
echo "   - Check logs regularly for any errors"
echo "   - Ensure sufficient disk space for data updates"
echo "   - Monitor API rate limits for external data sources"
echo ""
echo "🎉 Your BMV Finder data pipeline is now fully automated!" 