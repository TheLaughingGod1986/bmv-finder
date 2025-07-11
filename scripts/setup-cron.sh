#!/bin/bash

# Setup cron job for Land Registry import script
# This script will run the import every day at 2 AM

# Get the current directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Create the cron job command
CRON_JOB="0 2 * * * cd $PROJECT_DIR && /usr/bin/node -r dotenv/config scripts/import-land-registry-sales.js >> logs/cron.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "import-land-registry-sales.js"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "import-land-registry-sales.js" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 The script will run daily at 2:00 AM"
echo "📁 Logs will be saved to: $PROJECT_DIR/logs/cron.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove this cron job: crontab -e (then delete the line)"
echo "To view cron logs: tail -f $PROJECT_DIR/logs/cron.log" 