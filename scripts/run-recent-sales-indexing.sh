#!/bin/bash

# Wrapper script for recent sales indexing
# This script is called by cron and handles logging and error reporting

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/recent-sales-cron.log"
ERROR_LOG="$LOG_DIR/recent-sales-errors.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$CRON_LOG"
}

# Function to log errors
log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$ERROR_LOG" -a "$CRON_LOG"
}

# Start execution
log_message "Starting recent sales indexing job"

# Change to project directory
cd "$PROJECT_DIR"

# Check if Elasticsearch is running
if ! curl -s http://localhost:9200 >/dev/null 2>&1; then
    log_error "Elasticsearch is not running on localhost:9200"
    exit 1
fi

# Run the indexing script
if node "$SCRIPT_DIR/populate-recent-sales.js"; then
    log_message "Recent sales indexing completed successfully"
else
    log_error "Recent sales indexing failed"
    exit 1
fi

log_message "Recent sales indexing job finished"
