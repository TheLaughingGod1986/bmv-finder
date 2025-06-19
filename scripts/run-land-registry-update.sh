#!/bin/bash

# Navigate to the project directory
cd /Users/benjaminoats/my-vibe-project/bmv-finder

# Load environment variables
source .env

# Run the update script and log the output
LOG_FILE="land-registry-update-$(date +%Y%m%d).log"
{
    echo "=== Starting update at $(date) ==="
    npx tsx scripts/update-land-registry.ts
    echo "=== Update completed at $(date) ==="
} 2>&1 | tee -a "logs/$LOG_FILE"

# Clean up old log files (keep last 3 months)
find logs/ -name "land-registry-update-*.log" -type f -mtime +90 -delete
