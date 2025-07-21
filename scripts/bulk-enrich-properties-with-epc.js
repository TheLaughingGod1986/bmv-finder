// Bulk enrichment script for scalable, accurate property enrichment
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const PropertyEnrichmentService = require('../property-enrichment-service/services/PropertyEnrichmentService');
const ElasticsearchService = require('../property-enrichment-service/services/ElasticsearchService');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bulk-enrichment' },
  transports: [
    new winston.transports.File({ filename: 'bulk-enrichment-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'bulk-enrichment-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const propertyService = new PropertyEnrichmentService(logger);
const esService = propertyService.elasticsearchService;

const PROPERTIES_PATH = path.resolve(__dirname, '../properties.json');
const BATCH_SIZE = 50;
const ENRICHED_INDEX = 'properties-enhanced';

async function main() {
  const lines = fs.readFileSync(PROPERTIES_PATH, 'utf8').split('\n').filter(Boolean);
  let enrichedCount = 0;
  let missingCount = 0;
  let batch = [];
  let batchLineNumbers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let property;
    try {
      property = JSON.parse(line)._source;
    } catch (e) {
      logger.error('Failed to parse property JSON', { line: i + 1, error: e.message });
      continue;
    }
    const postcode = property.postcode;
    const number = property.paon || property.house_number || property.number;
    if (!postcode || !number) {
      logger.warn('Missing postcode or number', { line: i + 1, property });
      missingCount++;
      continue;
    }
    try {
      const enriched = await propertyService.enrichPropertyData(postcode, number);
      if (enriched) {
        // Normalize postcode before upsert
        const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
        // Upsert into enhanced index with normalized postcode
        batch.push({
          index: { _index: ENRICHED_INDEX, _id: `${normalizedPostcode}_${number.toString().toLowerCase()}` }
        });
        batch.push({ ...enriched, postcode: normalizedPostcode });
        batchLineNumbers.push(i + 1);
        enrichedCount++;
      } else {
        logger.warn('No enrichment found', { line: i + 1, postcode, number });
        missingCount++;
      }
    } catch (e) {
      logger.error('Enrichment error', { line: i + 1, postcode, number, error: e.message });
      missingCount++;
    }
    // Bulk index in batches
    if (batch.length >= BATCH_SIZE * 2) {
      await bulkIndex(batch, batchLineNumbers);
      batch = [];
      batchLineNumbers = [];
    }
  }
  // Final batch
  if (batch.length > 0) {
    await bulkIndex(batch, batchLineNumbers);
  }
  logger.info('Bulk enrichment complete', { enrichedCount, missingCount });
}

async function bulkIndex(batch, batchLineNumbers) {
  try {
    const { body } = await esService.client.bulk({ refresh: true, body: batch });
    if (body.errors) {
      logger.error('Bulk index errors', { batchLineNumbers, errors: body.items.filter(item => item.index && item.index.error) });
    } else {
      logger.info('Bulk index success', { count: batch.length / 2 });
    }
  } catch (e) {
    logger.error('Bulk index exception', { error: e.message, batchLineNumbers });
  }
}

main().catch(e => {
  logger.error('Fatal error in bulk enrichment', { error: e.message });
  process.exit(1);
}); 