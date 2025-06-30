#!/bin/bash

# Setup cron jobs for Elasticsearch data updates
# This script will create cron jobs to automatically update the property data

echo "Setting up cron jobs for Elasticsearch data updates..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create the cron job entries
CRON_JOB_WEEKLY="0 2 * * 0 cd $PROJECT_DIR && npm run update-es >> logs/cron-update.log 2>&1"
CRON_JOB_DAILY="0 3 * * * cd $PROJECT_DIR && npm run update-es-incremental >> logs/cron-incremental.log 2>&1"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo "Creating cron jobs..."

# Add weekly full update (Sundays at 2 AM)
(crontab -l 2>/dev/null; echo "$CRON_JOB_WEEKLY") | crontab -

# Add daily incremental update (Daily at 3 AM)
(crontab -l 2>/dev/null; echo "$CRON_JOB_DAILY") | crontab -

echo "✅ Cron jobs created successfully!"
echo ""
echo "📅 Scheduled jobs:"
echo "   - Weekly full update: Sundays at 2:00 AM"
echo "   - Daily incremental update: Daily at 3:00 AM"
echo ""
echo "📁 Log files will be created in: $PROJECT_DIR/logs/"
echo "   - cron-update.log (full updates)"
echo "   - cron-incremental.log (incremental updates)"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove cron jobs: crontab -r"
echo ""
echo "Note: Make sure Elasticsearch is running before the cron jobs execute." 