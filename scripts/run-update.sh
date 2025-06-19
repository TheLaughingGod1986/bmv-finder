#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the update script and log the output
LOG_FILE="logs/update-$(date +%Y-%m-%d).log"
mkdir -p logs

echo "[$(date)] Starting Land Registry update" >> "$LOG_FILE" 2>&1
npm run update:land-registry >> "$LOG_FILE" 2>&1

# Check if the update was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Update completed successfully" >> "$LOG_FILE" 2>&1
else
    echo "[$(date)] Update failed" >> "$LOG_FILE" 2>&1
    # You could add email notification here if desired
    # mail -s "Land Registry Update Failed" your-email@example.com < "$LOG_FILE"
fi
