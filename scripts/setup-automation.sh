#!/bin/bash

# BMV Finder Data Pipeline Automation Setup
# This script sets up cron jobs and monitoring for automated data updates

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_LOG="/var/log/bmv-finder-cron.log"
BACKUP_RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root (needed for cron setup)
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Create log directory
setup_logging() {
    log "Setting up logging..."
    
    sudo mkdir -p /var/log
    sudo touch "$CRON_LOG"
    sudo chown "$USER:$USER" "$CRON_LOG"
    
    success "Logging setup complete"
}

# Create cron jobs
setup_cron_jobs() {
    log "Setting up cron jobs..."
    
    # Create temporary cron file
    TEMP_CRON=$(mktemp)
    
    # Add existing cron jobs (excluding our new ones)
    crontab -l 2>/dev/null | grep -v "bmv-finder" > "$TEMP_CRON" || true
    
    # Add our cron jobs
    cat >> "$TEMP_CRON" << EOF

# BMV Finder Data Pipeline - Monthly full update (1st of month at 2 AM)
0 2 1 * * cd $PROJECT_DIR && node scripts/full-data-pipeline.js >> $CRON_LOG 2>&1

# BMV Finder Data Pipeline - Weekly HPI update (Sundays at 3 AM)
0 3 * * 0 cd $PROJECT_DIR && node scripts/update-data-sources.js && node scripts/populate-hpi-index.js >> $CRON_LOG 2>&1

# BMV Finder Data Pipeline - Daily recent sales update (daily at 4 AM)
0 4 * * * cd $PROJECT_DIR && node scripts/populate-recent-sales-simple.js >> $CRON_LOG 2>&1

# BMV Finder - Clean old backups (weekly on Saturdays at 1 AM)
0 1 * * 6 cd $PROJECT_DIR && find data/backups -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} \; >> $CRON_LOG 2>&1

# BMV Finder - Log rotation (monthly)
0 5 1 * * cd $PROJECT_DIR && find logs -name "*.log" -mtime +30 -delete >> $CRON_LOG 2>&1
EOF

    # Install the new cron jobs
    crontab "$TEMP_CRON"
    rm "$TEMP_CRON"
    
    success "Cron jobs installed successfully"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating monitoring script..."
    
    cat > "$PROJECT_DIR/scripts/monitor-pipeline.sh" << 'EOF'
#!/bin/bash

# BMV Finder Pipeline Monitoring Script
# Checks the health of the data pipeline and sends alerts if needed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/pipeline-monitor.log"

# Configuration
ALERT_EMAIL="${ALERT_EMAIL:-}"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Send alert
send_alert() {
    local message="$1"
    local level="${2:-WARNING}"
    
    log "[$level] $message"
    
    # Email alert
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "$message" | mail -s "BMV Finder Pipeline Alert: $level" "$ALERT_EMAIL"
    fi
    
    # Discord alert
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        curl -H "Content-Type: application/json" \
             -d "{\"content\":\"[$level] BMV Finder Pipeline: $message\"}" \
             "$DISCORD_WEBHOOK" >/dev/null 2>&1
    fi
    
    # Slack alert
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
             --data "{\"text\":\"[$level] BMV Finder Pipeline: $message\"}" \
             "$SLACK_WEBHOOK" >/dev/null 2>&1
    fi
}

# Check Elasticsearch health
check_elasticsearch() {
    local es_url="${ELASTICSEARCH_URL:-http://localhost:9201}"
    
    if ! curl -s "$es_url/_cluster/health" >/dev/null 2>&1; then
        send_alert "Elasticsearch is not responding" "ERROR"
        return 1
    fi
    
    local health=$(curl -s "$es_url/_cluster/health" | jq -r '.status')
    if [[ "$health" != "green" ]]; then
        send_alert "Elasticsearch cluster status: $health" "WARNING"
    fi
    
    return 0
}

# Check data freshness
check_data_freshness() {
    local data_dir="$PROJECT_DIR/data"
    local max_age_hours=168  # 1 week
    
    for file in "pp-complete-cleaned.csv" "hpi-full.csv" "hpi-regions.csv"; do
        local file_path="$data_dir/$file"
        
        if [[ ! -f "$file_path" ]]; then
            send_alert "Data file missing: $file" "ERROR"
            continue
        fi
        
        local age_hours=$(( ( $(date +%s) - $(stat -f %m "$file_path") ) / 3600 ))
        
        if [[ $age_hours -gt $max_age_hours ]]; then
            send_alert "Data file is old: $file ($age_hours hours)" "WARNING"
        fi
    done
}

# Check index document counts
check_index_counts() {
    local es_url="${ELASTICSEARCH_URL:-http://localhost:9201}"
    
    local properties_count=$(curl -s "$es_url/properties/_count" | jq -r '.count')
    local hpi_count=$(curl -s "$es_url/house_price_index/_count" | jq -r '.count')
    local recent_sales_count=$(curl -s "$es_url/recent_sales/_count" | jq -r '.count')
    
    if [[ $properties_count -lt 1000000 ]]; then
        send_alert "Properties index has low document count: $properties_count" "WARNING"
    fi
    
    if [[ $hpi_count -lt 100000 ]]; then
        send_alert "HPI index has low document count: $hpi_count" "WARNING"
    fi
    
    if [[ $recent_sales_count -lt 1000 ]]; then
        send_alert "Recent sales index has low document count: $recent_sales_count" "WARNING"
    fi
}

# Main monitoring function
main() {
    log "Starting pipeline monitoring..."
    
    check_elasticsearch
    check_data_freshness
    check_index_counts
    
    log "Pipeline monitoring completed"
}

main "$@"
EOF

    chmod +x "$PROJECT_DIR/scripts/monitor-pipeline.sh"
    
    success "Monitoring script created"
}

# Create log rotation configuration
setup_log_rotation() {
    log "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/bmv-finder > /dev/null << EOF
$CRON_LOG {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

    success "Log rotation configured"
}

# Test the setup
test_setup() {
    log "Testing the setup..."
    
    # Test if scripts exist
    if [[ ! -f "$PROJECT_DIR/scripts/full-data-pipeline.js" ]]; then
        error "full-data-pipeline.js not found"
        return 1
    fi
    
    if [[ ! -f "$PROJECT_DIR/scripts/update-data-sources.js" ]]; then
        error "update-data-sources.js not found"
        return 1
    fi
    
    # Test if cron jobs are installed
    if ! crontab -l | grep -q "bmv-finder"; then
        error "Cron jobs not found"
        return 1
    fi
    
    success "Setup test passed"
}

# Display status
show_status() {
    log "Current cron jobs:"
    crontab -l | grep "bmv-finder" || echo "No BMV Finder cron jobs found"
    
    log "Log file location: $CRON_LOG"
    log "Project directory: $PROJECT_DIR"
    log "Backup retention: $BACKUP_RETENTION_DAYS days"
}

# Main function
main() {
    log "Setting up BMV Finder Data Pipeline Automation..."
    
    check_root
    setup_logging
    setup_cron_jobs
    create_monitoring_script
    setup_log_rotation
    test_setup
    
    success "BMV Finder Data Pipeline Automation setup completed!"
    
    echo
    show_status
    echo
    log "Next steps:"
    echo "1. Configure alert notifications in your environment variables:"
    echo "   - ALERT_EMAIL=your-email@example.com"
    echo "   - DISCORD_WEBHOOK=your-discord-webhook-url"
    echo "   - SLACK_WEBHOOK=your-slack-webhook-url"
    echo "2. Test the pipeline manually: node scripts/full-data-pipeline.js"
    echo "3. Monitor logs: tail -f $CRON_LOG"
}

main "$@" 