# Recent Sales Indexing Automation

This document describes the automated system for indexing recent sale prices from the Land Registry into Elasticsearch for faster repeated queries.

## Overview

The recent sales automation system provides:
- **Automated indexing** of recent sales data from Land Registry SPARQL endpoint
- **Caching in Elasticsearch** for faster subsequent queries
- **Scheduled updates** via cron jobs
- **Monitoring and logging** for system health
- **Manual execution** capabilities for testing and maintenance

## Architecture

```
Land Registry SPARQL → Indexing Script → Elasticsearch Cache → API Route → UI
```

### Components

1. **`scripts/populate-recent-sales.js`** - Main indexing script
2. **`scripts/run-recent-sales-indexing.sh`** - Cron wrapper script
3. **`scripts/monitor-recent-sales.sh`** - Monitoring script
4. **`scripts/manual-index-recent-sales.sh`** - Manual execution script
5. **`src/app/api/recent-sales/route.ts`** - Updated API route with caching
6. **`logs/`** - Log files for monitoring

## Setup

### Prerequisites

- Node.js and npm installed
- Elasticsearch running on localhost:9200
- Cron available on the system

### Installation

Run the setup script to install all components:

```bash
./scripts/setup-recent-sales-cron.sh
```

This will:
- Install required dependencies
- Create cron jobs for automation
- Set up logging directories
- Create monitoring scripts

## Configuration

### Postcodes to Index

Edit `scripts/postcodes-to-index.txt` to specify which postcodes to index:

```
# Add one postcode per line
# Lines starting with # are comments
SW1A 1AA
W1A 1AA
M1 1AA
```

### Environment Variables

Set these environment variables if needed:

```bash
export ES_HOST=http://localhost:9200
export ES_USERNAME=elastic
export ES_PASSWORD=changeme
```

## Usage

### Manual Execution

Run the indexing process manually:

```bash
# Index all postcodes from existing property data
./scripts/manual-index-recent-sales.sh

# Or run the script directly with specific postcodes
node scripts/populate-recent-sales.js SW1A1AA W1A1AA M11AA
```

### API Usage

The updated `/api/recent-sales` endpoint now supports caching:

```bash
# Get recent sales (uses cache if available)
GET /api/recent-sales?postcode=SW1A1AA

# Force refresh from Land Registry
GET /api/recent-sales?postcode=SW1A1AA&refresh=true

# Skip cache and fetch directly from SPARQL
GET /api/recent-sales?postcode=SW1A1AA&skipCache=true

# Limit results
GET /api/recent-sales?postcode=SW1A1AA&limit=20
```

### API Response Format

```json
{
  "postcode": "SW1A1AA",
  "source": "elasticsearch_cache",
  "totalSales": 15,
  "summary": {
    "totalValue": 15000000,
    "averagePrice": 1000000,
    "priceRange": {
      "min": 500000,
      "max": 2000000
    },
    "propertyTypeStats": {
      "Detached": {
        "count": 5,
        "totalValue": 8000000,
        "averagePrice": 1600000
      }
    }
  },
  "sales": [
    {
      "transactionId": "http://landregistry.data.gov.uk/data/ppi/transaction/123",
      "pricePaid": 1000000,
      "dateOfTransfer": "2023-01-15",
      "propertyType": "Detached",
      "newBuild": false,
      "estateType": "Freehold",
      "address": {
        "paon": "1",
        "street": "Downing Street",
        "town": "London",
        "district": "Westminster",
        "county": "Greater London"
      },
      "source": "elasticsearch_cache"
    }
  ]
}
```

## Automation Schedule

The system runs automatically via cron jobs:

- **Daily at 2 AM**: Incremental indexing of new sales
- **Weekly on Sundays at 3 AM**: Full refresh of all postcodes
- **Monthly on 1st at 4 AM**: Cleanup and maintenance

### Viewing Cron Jobs

```bash
crontab -l
```

### Removing Cron Jobs

```bash
crontab -e
# Delete the lines containing "run-recent-sales-indexing.sh"
```

## Monitoring

### Check System Status

```bash
./scripts/monitor-recent-sales.sh
```

This shows:
- Recent log entries
- Error messages
- Elasticsearch index status
- Document counts
- Cron job status

### View Logs

```bash
# View cron execution logs
tail -f logs/recent-sales-cron.log

# View error logs
tail -f logs/recent-sales-errors.log

# View indexing script logs
tail -f recent-sales-indexing.log
```

## Elasticsearch Index

### Index Structure

The `recent_sales` index contains:

```json
{
  "mappings": {
    "properties": {
      "transactionId": { "type": "keyword" },
      "postcode": { "type": "keyword" },
      "pricePaid": { "type": "float" },
      "dateOfTransfer": { "type": "date" },
      "propertyType": { "type": "keyword" },
      "newBuild": { "type": "boolean" },
      "estateType": { "type": "keyword" },
      "paon": { "type": "text" },
      "saon": { "type": "text" },
      "street": { "type": "text" },
      "locality": { "type": "text" },
      "town": { "type": "text" },
      "district": { "type": "keyword" },
      "county": { "type": "keyword" },
      "transactionCategory": { "type": "keyword" },
      "recordStatus": { "type": "keyword" },
      "indexedAt": { "type": "date" },
      "source": { "type": "keyword" }
    }
  }
}
```

### Index Management

```bash
# Check index status
curl http://localhost:9200/recent_sales

# Get document count
curl http://localhost:9200/recent_sales/_count

# Delete index (if needed)
curl -X DELETE http://localhost:9200/recent_sales
```

## Performance Benefits

### Before Automation
- Every API call required SPARQL query to Land Registry
- Response times: 2-5 seconds
- Rate limiting concerns
- No caching

### After Automation
- First request: 2-5 seconds (SPARQL + cache)
- Subsequent requests: <100ms (Elasticsearch cache)
- Reduced load on Land Registry API
- Automatic updates via cron

## Troubleshooting

### Common Issues

1. **Elasticsearch not running**
   ```bash
   # Check if Elasticsearch is running
   curl http://localhost:9200
   ```

2. **Cron jobs not executing**
   ```bash
   # Check cron service
   sudo systemctl status cron
   
   # Check cron logs
   sudo tail -f /var/log/cron
   ```

3. **Permission issues**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.sh
   chmod +x scripts/*.js
   ```

4. **Index creation failed**
   ```bash
   # Check Elasticsearch logs
   tail -f /var/log/elasticsearch/elasticsearch.log
   ```

### Debug Mode

Run the indexing script with verbose logging:

```bash
DEBUG=true node scripts/populate-recent-sales.js
```

### Manual Index Creation

If the index doesn't exist, create it manually:

```bash
curl -X PUT http://localhost:9200/recent_sales -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "transactionId": { "type": "keyword" },
      "postcode": { "type": "keyword" },
      "pricePaid": { "type": "float" },
      "dateOfTransfer": { "type": "date" },
      "propertyType": { "type": "keyword" },
      "newBuild": { "type": "boolean" },
      "estateType": { "type": "keyword" },
      "paon": { "type": "text" },
      "saon": { "type": "text" },
      "street": { "type": "text" },
      "locality": { "type": "text" },
      "town": { "type": "text" },
      "district": { "type": "keyword" },
      "county": { "type": "keyword" },
      "transactionCategory": { "type": "keyword" },
      "recordStatus": { "type": "keyword" },
      "indexedAt": { "type": "date" },
      "source": { "type": "keyword" }
    }
  },
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

## Maintenance

### Regular Tasks

1. **Monitor logs weekly**
   ```bash
   ./scripts/monitor-recent-sales.sh
   ```

2. **Check disk space**
   ```bash
   df -h
   ```

3. **Review cron job execution**
   ```bash
   crontab -l
   ```

### Data Cleanup

The system automatically skips postcodes that were recently indexed (within 7 days). For manual cleanup:

```bash
# Delete old records (older than 30 days)
curl -X POST http://localhost:9200/recent_sales/_delete_by_query -H 'Content-Type: application/json' -d '{
  "query": {
    "range": {
      "indexedAt": {
        "lt": "now-30d"
      }
    }
  }
}'
```

## Security Considerations

1. **API Rate Limiting**: The script includes delays between requests to respect Land Registry API limits
2. **Error Handling**: Failed requests don't stop the entire process
3. **Logging**: All operations are logged for audit purposes
4. **Authentication**: Elasticsearch credentials should be properly secured

## Future Enhancements

1. **Incremental Updates**: Only fetch new transactions since last update
2. **Geographic Batching**: Process postcodes by region
3. **Webhook Notifications**: Alert on indexing failures
4. **Dashboard**: Web interface for monitoring and management
5. **Data Validation**: Verify data integrity and completeness

## Support

For issues or questions:
1. Check the logs first: `./scripts/monitor-recent-sales.sh`
2. Review this documentation
3. Check Elasticsearch and cron service status
4. Test manual execution: `./scripts/manual-index-recent-sales.sh` 