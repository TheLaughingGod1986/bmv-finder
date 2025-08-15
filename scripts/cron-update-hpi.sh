#!/bin/bash

# Comprehensive Data Auto-Update Cron Script
# This script can be added to crontab for automatic updates of all data types

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/data/logs"
LOCK_FILE="$PROJECT_DIR/data/update-lock"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Log file with timestamp
LOG_FILE="$LOG_DIR/data-update-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to cleanup on exit
cleanup() {
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
        log "Lock file removed"
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Check if already running
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if ps -p "$PID" > /dev/null 2>&1; then
        log "Update already running (PID: $PID), exiting"
        exit 1
    else
        log "Stale lock file found, removing"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"
log "Starting HPI auto-update process"

# Change to project directory
cd "$PROJECT_DIR" || {
    log "ERROR: Could not change to project directory"
    exit 1
}

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log "ERROR: Node.js not found in PATH"
    exit 1
fi

# Check if Elasticsearch is running
if ! curl -s "http://localhost:9201/_cluster/health" > /dev/null 2>&1; then
    log "WARNING: Elasticsearch not responding, attempting to start Docker container"
    
    # Try to start Docker container
    if command -v docker &> /dev/null; then
        if docker ps -q --filter "name=elasticsearch" | grep -q .; then
            log "Elasticsearch container found, starting..."
            docker start elasticsearch
            sleep 10
        else
            log "ERROR: Elasticsearch Docker container not found"
            exit 1
        fi
    else
        log "ERROR: Docker not available and Elasticsearch not running"
        exit 1
    fi
fi

# Wait for Elasticsearch to be ready
log "Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
    if curl -s "http://localhost:9201/_cluster/health" > /dev/null 2>&1; then
        log "Elasticsearch is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "ERROR: Elasticsearch not ready after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Run the smart data checker first
log "Running smart data checker..."
if node scripts/smart-data-checker.js check >> "$LOG_FILE" 2>&1; then
    log "Smart data checker completed"
else
    log "WARNING: Smart data checker had issues, continuing anyway"
fi

# Run the auto-updater
log "Running HPI auto-updater..."
if node scripts/auto-update-hpi.js update >> "$LOG_FILE" 2>&1; then
    log "HPI auto-update completed successfully"
    
    # Check if we need to restart the web application
    if [ -f "$PROJECT_DIR/package.json" ]; then
        log "Checking if web app needs restart..."
        # You could add logic here to restart the web app if needed
        # For example, if using PM2: pm2 restart bmv-finder
    fi
else
    log "ERROR: HPI auto-update failed"
    exit 1
fi

# Clean up old logs (keep last 30 days)
log "Cleaning up old log files..."
find "$LOG_DIR" -name "hpi-update-*.log" -mtime +30 -delete 2>/dev/null

# Clean up old backup files (keep last 7 days)
if [ -d "$PROJECT_DIR/data/backups" ]; then
    log "Cleaning up old backup files..."
    find "$PROJECT_DIR/data/backups" -name "backup-*" -mtime +7 -delete 2>/dev/null
fi

log "HPI auto-update process completed successfully"
exit 0
