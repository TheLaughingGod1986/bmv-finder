# 🚀 HPI Auto-Update System

This system automatically checks for new HPI (House Price Index) data, downloads it, cleans it, and updates your Elasticsearch database.

## 📋 Overview

The auto-update system consists of three main components:

1. **Smart Data Checker** - Intelligently detects new data by checking file sizes, dates, and content
2. **HPI Auto-Updater** - Downloads, cleans, and imports new data into Elasticsearch
3. **Cron Integration** - Automated scheduling for regular updates

## 🛠️ Components

### 1. Smart Data Checker (`scripts/smart-data-checker.js`)

Intelligently monitors multiple data sources for updates:

- **ONS (Office for National Statistics)** - Official UK HPI data
- **Land Registry** - Property transaction data
- **GOV.UK** - Government property statistics

**Features:**
- HTTP HEAD requests to check file metadata
- Compares file sizes, last-modified dates, and ETags
- Caches source information to detect changes
- Content-based change detection for CSV files

**Usage:**
```bash
# Check all data sources for updates
node scripts/smart-data-checker.js check

# Show current status and recommendations
node scripts/smart-data-checker.js status

# Clean up old cache entries
node scripts/smart-data-checker.js cleanup

# View cache contents
node scripts/smart-data-checker.js cache
```

### 2. HPI Auto-Updater (`scripts/auto-update-hpi.js`)

Handles the complete data pipeline:

- Downloads new data from detected sources
- Cleans and transforms data using existing cleaning scripts
- Creates backups before updates
- Imports cleaned data into Elasticsearch
- Manages update history and data hashing

**Usage:**
```bash
# Start the auto-updater (runs in background)
node scripts/auto-update-hpi.js start

# Run a one-time update
node scripts/auto-update-hpi.js update

# Check for updates
node scripts/auto-update-hpi.js check

# Show status
node scripts/auto-update-hpi.js status

# Stop the auto-updater
node scripts/auto-update-hpi.js stop
```

### 3. Cron Integration (`scripts/cron-update-hpi.sh`)

Shell script for automated scheduling:

- **Lock file protection** - Prevents multiple instances
- **Docker integration** - Automatically starts Elasticsearch if needed
- **Comprehensive logging** - Detailed logs with timestamps
- **Cleanup automation** - Removes old logs and backups
- **Error handling** - Graceful failure and recovery

## 🚀 Quick Start

### 1. Test the System

```bash
# Check current data source status
node scripts/smart-data-checker.js status

# Run a manual update
node scripts/auto-update-hpi.js update

# Check for new data
node scripts/smart-data-checker.js check
```

### 2. Set Up Automated Updates

#### Option A: Cron Job (Recommended)

Add to your crontab to run daily at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line:
0 2 * * * /path/to/your/project/scripts/cron-update-hpi.sh
```

#### Option B: Background Process

```bash
# Start the auto-updater in background
nohup node scripts/auto-update-hpi.js start > data/logs/auto-updater.log 2>&1 &

# Check if it's running
ps aux | grep auto-update-hpi
```

### 3. Monitor the System

```bash
# Check status
node scripts/auto-update-hpi.js status

# View recent logs
tail -f data/logs/hpi-update-*.log

# Check Elasticsearch data
curl "http://localhost:9201/house_price_index/_count"
```

## 📊 Data Sources

### ONS (Office for National Statistics)
- **URLs:** Multiple HPI dataset endpoints
- **Format:** Excel (.xlsx)
- **Update Frequency:** Monthly
- **Data Type:** Official UK House Price Indices

### Land Registry
- **URLs:** Price Paid Data, HPI Data
- **Format:** CSV
- **Update Frequency:** Monthly
- **Data Type:** Property transaction records

### GOV.UK
- **URLs:** Property data portals
- **Format:** HTML (scraping required)
- **Update Frequency:** Varies
- **Data Type:** Government property statistics

## 🔧 Configuration

### Environment Variables

```bash
# Elasticsearch connection
ELASTICSEARCH_URL=http://localhost:9201

# Update frequency (in milliseconds)
CHECK_INTERVAL=86400000  # 24 hours
```

### Customizing Data Sources

Edit `scripts/smart-data-checker.js` to add/modify data sources:

```javascript
const DATA_SOURCES = {
  yourSource: {
    name: 'Your Data Source',
    baseUrl: 'https://your-domain.com',
    endpoints: [
      {
        name: 'Your Dataset',
        path: '/path/to/data.csv',
        type: 'csv',
        checkMethod: 'headers' // or 'content'
      }
    ]
  }
};
```

## 📁 File Structure

```
scripts/
├── auto-update-hpi.js          # Main auto-updater
├── smart-data-checker.js       # Data source checker
├── cron-update-hpi.sh          # Cron integration script
├── clean-uk-hpi-data.js        # HPI data cleaning
├── clean-land-registry-data.js # Property sales cleaning
└── import-all-data.js          # Elasticsearch import

data/
├── cleaned-datasets/           # Processed CSV files
├── backups/                    # Data backups
├── logs/                       # Update logs
└── update-info.json           # Update history
```

## 🔍 Monitoring & Debugging

### Log Files

- **Update logs:** `data/logs/hpi-update-YYYYMMDD-HHMMSS.log`
- **Auto-updater logs:** `data/logs/auto-updater.log`
- **Check results:** `data/check-results-{timestamp}.json`

### Status Commands

```bash
# Check if auto-updater is running
node scripts/auto-update-hpi.js status

# View recent check results
ls -la data/check-results-*.json

# Check Elasticsearch health
curl "http://localhost:9201/_cluster/health"

# View data counts
curl "http://localhost:9201/house_price_index/_count"
```

### Common Issues

#### 1. Elasticsearch Not Running
```bash
# Check Docker containers
docker ps -a

# Start Elasticsearch
docker start elasticsearch

# Wait for it to be ready
curl "http://localhost:9201/_cluster/health"
```

#### 2. Permission Issues
```bash
# Make script executable
chmod +x scripts/cron-update-hpi.sh

# Check file permissions
ls -la scripts/
```

#### 3. Data Source Errors
```bash
# Test individual sources
node scripts/smart-data-checker.js check

# View detailed error logs
tail -f data/logs/hpi-update-*.log
```

## 🔄 Update Process Flow

1. **Check Sources** - Smart checker monitors all data sources
2. **Detect Changes** - Compares current vs. cached information
3. **Download Data** - Fetches new data from changed sources
4. **Create Backup** - Backs up current Elasticsearch data
5. **Clean Data** - Processes raw data using cleaning scripts
6. **Update Elasticsearch** - Imports new data into indices
7. **Update Cache** - Stores new metadata for future comparisons
8. **Cleanup** - Removes old logs and backups

## 📈 Performance & Optimization

### Update Frequency
- **Default:** Every 24 hours
- **Recommended:** Daily at low-traffic hours (2-4 AM)
- **Customizable:** Modify `CHECK_INTERVAL` in configuration

### Data Retention
- **Logs:** 30 days
- **Backups:** 7 days
- **Cache:** 30 days
- **Configurable:** Modify retention periods in scripts

### Resource Usage
- **Memory:** Minimal (Node.js process)
- **CPU:** Low (mainly during data processing)
- **Network:** Varies based on data source sizes
- **Storage:** Grows with data and backups

## 🚨 Security Considerations

- **HTTPS Only** - All external data sources use secure connections
- **User-Agent** - Identifies the script to data sources
- **Rate Limiting** - Built-in delays and timeouts
- **Error Handling** - Graceful failure without exposing internals
- **Log Sanitization** - No sensitive data in logs

## 🔮 Future Enhancements

- **Webhook Integration** - Notify external systems of updates
- **Data Validation** - Quality checks before import
- **Incremental Updates** - Only import changed records
- **Multi-Node Support** - Distributed Elasticsearch clusters
- **API Endpoints** - REST API for manual updates
- **Dashboard** - Web interface for monitoring

## 📞 Support

### Troubleshooting

1. **Check logs first** - Most issues are logged with details
2. **Verify Elasticsearch** - Ensure it's running and accessible
3. **Test manually** - Run commands individually to isolate issues
4. **Check permissions** - Ensure scripts are executable
5. **Verify network** - Test data source URLs manually

### Getting Help

- Check the logs in `data/logs/`
- Run status commands to see current state
- Test individual components manually
- Review this documentation for common solutions

---

**🎉 Your HPI data will now stay automatically updated with the latest information from official sources!**
