#!/bin/bash
set -e

LOGFILE="logs/cron-full-data-update.log"
SUMMARY_FILE="public/last-data-update.json"

# 1. Download latest Land Registry CSVs
echo "[$(date)] Starting Land Registry download..." | tee -a "$LOGFILE"
node scripts/download-land-registry-csvs-proper.js >> "$LOGFILE" 2>&1

# 2. Combine and update properties index
echo "[$(date)] Combining and updating properties index..." | tee -a "$LOGFILE"
node scripts/combine-and-update-properties.js >> "$LOGFILE" 2>&1

# 3. Update recent sales
echo "[$(date)] Populating recent sales..." | tee -a "$LOGFILE"
node scripts/populate-recent-sales-simple.js >> "$LOGFILE" 2>&1

# 4. Update summary with current counts
echo "[$(date)] Updating summary with current counts..." | tee -a "$LOGFILE"
node scripts/update-summary.js >> "$LOGFILE" 2>&1

echo "[$(date)] Data update complete. Stats written to $SUMMARY_FILE" | tee -a "$LOGFILE" 