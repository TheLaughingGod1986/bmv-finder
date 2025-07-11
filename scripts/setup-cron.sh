#!/bin/bash

# Setup cron jobs for Elasticsearch update and HPI update scripts
# update-elasticsearch.js: daily at 2:30 AM
# update-hpi.js: daily at 3:00 AM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

CRON_JOB_UPDATE="30 2 * * * cd $PROJECT_DIR && /usr/local/bin/node -r dotenv/config scripts/update-elasticsearch.js >> logs/cron-update.log 2>&1"
CRON_JOB_HPI="0 3 * * * cd $PROJECT_DIR && /usr/local/bin/node -r dotenv/config scripts/update-hpi.js >> logs/cron-hpi.log 2>&1"

# Remove any existing cron jobs for these scripts
crontab -l 2>/dev/null | grep -v "update-elasticsearch.js" | grep -v "update-hpi.js" > tempcron || true

echo "$CRON_JOB_UPDATE" >> tempcron
echo "$CRON_JOB_HPI" >> tempcron
crontab tempcron
rm tempcron

echo "✅ Cron jobs added successfully!"
echo "📅 update-elasticsearch.js will run daily at 2:30 AM (logs/cron-update.log)"
echo "📅 update-hpi.js will run daily at 3:00 AM (logs/cron-hpi.log)"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove these cron jobs: crontab -e (then delete the lines)"
echo "To view logs: tail -f logs/cron-update.log or tail -f logs/cron-hpi.log" 