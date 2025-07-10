#!/bin/bash

# Setup script for recent sales indexing automation
# This script creates cron jobs to automatically index recent sales from Land Registry

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/recent-sales-cron.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

echo -e "${BLUE}Setting up Recent Sales Indexing Automation${NC}"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

if ! command_exists crontab; then
    echo -e "${RED}Error: crontab is not available${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Install dependencies if needed
echo -e "${YELLOW}Checking dependencies...${NC}"
cd "$PROJECT_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Check if required packages are installed
if ! npm list @elastic/elasticsearch >/dev/null 2>&1; then
    echo "Installing missing dependencies..."
    npm install @elastic/elasticsearch axios
fi

echo -e "${GREEN}✓ Dependencies check passed${NC}"

# Create the indexing script executable
echo -e "${YELLOW}Making indexing script executable...${NC}"
chmod +x "$SCRIPT_DIR/populate-recent-sales.js"

# Create a wrapper script for cron execution
cat > "$SCRIPT_DIR/run-recent-sales-indexing.sh" << 'EOF'
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
EOF

# Make the wrapper script executable
chmod +x "$SCRIPT_DIR/run-recent-sales-indexing.sh"

echo -e "${GREEN}✓ Wrapper script created${NC}"

# Create cron job entries
echo -e "${YELLOW}Setting up cron jobs...${NC}"

# Get current user's crontab
CURRENT_CRON=$(crontab -l 2>/dev/null || echo "")

# Check if cron jobs already exist
if echo "$CURRENT_CRON" | grep -q "run-recent-sales-indexing.sh"; then
    echo -e "${YELLOW}Recent sales indexing cron jobs already exist. Updating...${NC}"
    
    # Remove existing cron jobs
    CURRENT_CRON=$(echo "$CURRENT_CRON" | grep -v "run-recent-sales-indexing.sh")
fi

# Add new cron jobs
NEW_CRON_JOBS="
# Recent Sales Indexing - Daily at 2 AM
0 2 * * * $SCRIPT_DIR/run-recent-sales-indexing.sh >> $CRON_LOG 2>&1

# Recent Sales Indexing - Weekly full refresh on Sundays at 3 AM
0 3 * * 0 $SCRIPT_DIR/run-recent-sales-indexing.sh --full-refresh >> $CRON_LOG 2>&1

# Recent Sales Indexing - Monthly cleanup on 1st at 4 AM
0 4 1 * * $SCRIPT_DIR/run-recent-sales-indexing.sh --cleanup >> $CRON_LOG 2>&1
"

# Combine current cron with new jobs
UPDATED_CRON=$(echo -e "$CURRENT_CRON\n$NEW_CRON_JOBS")

# Install the updated crontab
echo "$UPDATED_CRON" | crontab -

echo -e "${GREEN}✓ Cron jobs installed successfully${NC}"

# Create a sample postcodes file
echo -e "${YELLOW}Creating sample postcodes file...${NC}"
cat > "$SCRIPT_DIR/postcodes-to-index.txt" << 'EOF'
# Sample postcodes for recent sales indexing
# Add one postcode per line
# Lines starting with # are comments and will be ignored

# Example postcodes (replace with your actual postcodes)
# SW1A 1AA
# W1A 1AA
# M1 1AA
# B1 1AA
# L1 1AA

# You can also specify postcodes as command line arguments when running the script
# node scripts/populate-recent-sales.js SW1A1AA W1A1AA M11AA
EOF

echo -e "${GREEN}✓ Sample postcodes file created${NC}"

# Create monitoring script
cat > "$SCRIPT_DIR/monitor-recent-sales.sh" << 'EOF'
#!/bin/bash

# Monitoring script for recent sales indexing
# Check the status of recent sales indexing jobs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/recent-sales-cron.log"
ERROR_LOG="$LOG_DIR/recent-sales-errors.log"

echo "Recent Sales Indexing Monitor"
echo "============================="

# Check if logs exist
if [ -f "$CRON_LOG" ]; then
    echo "✓ Cron log file exists: $CRON_LOG"
    echo "Last 10 log entries:"
    tail -10 "$CRON_LOG" | sed 's/^/  /'
else
    echo "✗ Cron log file not found: $CRON_LOG"
fi

if [ -f "$ERROR_LOG" ]; then
    echo ""
    echo "Recent errors:"
    tail -5 "$ERROR_LOG" | sed 's/^/  /'
else
    echo ""
    echo "✓ No error log file found (good!)"
fi

# Check Elasticsearch index
echo ""
echo "Elasticsearch Index Status:"
if curl -s http://localhost:9200/recent_sales >/dev/null 2>&1; then
    echo "✓ recent_sales index exists"
    
    # Get document count
    COUNT=$(curl -s http://localhost:9200/recent_sales/_count | jq -r '.count' 2>/dev/null || echo "unknown")
    echo "  Document count: $COUNT"
    
    # Get last indexed date
    LAST_INDEXED=$(curl -s http://localhost:9200/recent_sales/_search -H 'Content-Type: application/json' -d '{
        "size": 1,
        "sort": [{"indexedAt": {"order": "desc"}}],
        "_source": ["indexedAt"]
    }' | jq -r '.hits.hits[0]._source.indexedAt' 2>/dev/null || echo "unknown")
    echo "  Last indexed: $LAST_INDEXED"
else
    echo "✗ recent_sales index does not exist"
fi

# Check cron jobs
echo ""
echo "Cron Jobs Status:"
if crontab -l 2>/dev/null | grep -q "run-recent-sales-indexing.sh"; then
    echo "✓ Recent sales indexing cron jobs are installed"
    echo "Scheduled jobs:"
    crontab -l | grep "run-recent-sales-indexing.sh" | sed 's/^/  /'
else
    echo "✗ Recent sales indexing cron jobs not found"
fi
EOF

chmod +x "$SCRIPT_DIR/monitor-recent-sales.sh"

echo -e "${GREEN}✓ Monitoring script created${NC}"

# Create manual execution script
cat > "$SCRIPT_DIR/manual-index-recent-sales.sh" << 'EOF'
#!/bin/bash

# Manual execution script for recent sales indexing
# Use this to run the indexing process manually

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Manual Recent Sales Indexing"
echo "============================"

# Change to project directory
cd "$PROJECT_DIR"

# Check if Elasticsearch is running
if ! curl -s http://localhost:9200 >/dev/null 2>&1; then
    echo "Error: Elasticsearch is not running on localhost:9200"
    echo "Please start Elasticsearch first"
    exit 1
fi

# Show usage
echo "Usage options:"
echo "1. Index all postcodes from existing property data:"
echo "   node scripts/populate-recent-sales.js"
echo ""
echo "2. Index specific postcodes:"
echo "   node scripts/populate-recent-sales.js SW1A1AA W1A1AA M11AA"
echo ""
echo "3. Index postcodes from file:"
echo "   # Edit scripts/postcodes-to-index.txt first, then run:"
echo "   node scripts/populate-recent-sales.js"
echo ""

# Ask user what they want to do
read -p "Do you want to proceed with indexing all postcodes from existing data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting indexing process..."
    node "$SCRIPT_DIR/populate-recent-sales.js"
else
    echo "Please run the script manually with your desired options"
    echo "Example: node scripts/populate-recent-sales.js SW1A1AA W1A1AA"
fi
EOF

chmod +x "$SCRIPT_DIR/manual-index-recent-sales.sh"

echo -e "${GREEN}✓ Manual execution script created${NC}"

# Display summary
echo ""
echo -e "${GREEN}Recent Sales Indexing Automation Setup Complete!${NC}"
echo "========================================================"
echo ""
echo "What was set up:"
echo "✓ Cron jobs for automated indexing:"
echo "  - Daily at 2 AM"
echo "  - Weekly full refresh on Sundays at 3 AM"
echo "  - Monthly cleanup on 1st at 4 AM"
echo ""
echo "✓ Logging and monitoring:"
echo "  - Logs directory: $LOG_DIR"
echo "  - Cron log: $CRON_LOG"
echo "  - Error log: $LOG_DIR/recent-sales-errors.log"
echo ""
echo "✓ Scripts created:"
echo "  - populate-recent-sales.js (main indexing script)"
echo "  - run-recent-sales-indexing.sh (cron wrapper)"
echo "  - monitor-recent-sales.sh (monitoring script)"
echo "  - manual-index-recent-sales.sh (manual execution)"
echo ""
echo "Next steps:"
echo "1. Edit scripts/postcodes-to-index.txt to add your target postcodes"
echo "2. Test the setup: ./scripts/manual-index-recent-sales.sh"
echo "3. Monitor the process: ./scripts/monitor-recent-sales.sh"
echo "4. Check logs: tail -f $LOG_DIR/recent-sales-cron.log"
echo ""
echo "To remove cron jobs: crontab -e (then delete the recent sales lines)"
echo ""
echo -e "${BLUE}Setup completed successfully!${NC}" 