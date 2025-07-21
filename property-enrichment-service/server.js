const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

// Load environment variables
dotenv.config();

// Import services
const PropertyEnrichmentService = require('./services/PropertyEnrichmentService');
const ValidationService = require('./services/ValidationService');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'property-enrichment' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Initialize services
const propertyService = new PropertyEnrichmentService(logger);
const validationService = new ValidationService();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const esAvailable = await propertyService.elasticsearchService.isAvailable();
    const cacheStats = await propertyService.elasticsearchService.getCacheStats();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'property-enrichment-service',
      elasticsearch: {
        available: esAvailable,
        cache: cacheStats
      }
    });
  } catch (error) {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'property-enrichment-service',
      elasticsearch: {
        available: false,
        error: error.message
      }
    });
  }
});

// Main property enrichment endpoint
app.get('/api/property-info', async (req, res) => {
  try {
    const { postcode, number } = req.query;

    // Validate input parameters
    const validationResult = validationService.validatePropertyRequest(postcode, number);
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid input parameters',
        details: validationResult.errors
      });
    }

    logger.info('Property enrichment request', {
      postcode,
      number,
      ip: req.ip
    });

    // Enrich property data
    const propertyData = await propertyService.enrichPropertyData(postcode, number);

    if (!propertyData) {
      logger.warn({
        event: 'enrichment_failure',
        number,
        postcode,
        reason: 'No property data returned',
        timestamp: new Date().toISOString(),
      });
      return res.status(404).json({
        error: 'Property not found',
        message: 'No property data found for the provided address'
      });
    } else {
      // Log missing fields
      const missingFields = [];
      if (!propertyData.floor_area_m2) missingFields.push('floor_area_m2');
      if (!propertyData.epc_rating) missingFields.push('epc_rating');
      if (!propertyData.bedrooms) missingFields.push('bedrooms');
      if (missingFields.length > 0) {
        logger.info({
          event: 'missing_enrichment_data',
          number,
          postcode,
          missingFields,
          timestamp: new Date().toISOString(),
        });
      }
    }

    logger.info('Property enrichment successful', {
      postcode,
      number,
      found: true
    });

    // After enrichment, ensure response fields are consistent
    if (propertyData) {
      if (propertyData.size && !propertyData.floor_area_m2) {
        propertyData.floor_area_m2 = propertyData.size;
        delete propertyData.size;
      }
      // Optionally, ensure top-level response fields
      res.json({
        ...propertyData,
        floor_area_m2: propertyData.floor_area_m2,
        epc_rating: propertyData.epc_rating,
        bedrooms: propertyData.bedrooms,
      });
      return;
    }

    res.json(propertyData);

  } catch (error) {
    logger.error('Property enrichment error', {
      error: error.message,
      stack: error.stack,
      postcode: req.query.postcode,
      number: req.query.number
    });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    });
  }
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await propertyService.elasticsearchService.getCacheStats();
    res.json({
      cache_stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting cache stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

app.post('/api/cache/clean', async (req, res) => {
  try {
    const deletedCount = await propertyService.elasticsearchService.cleanExpiredCache();
    res.json({
      message: 'Cache cleaned successfully',
      deleted_count: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error cleaning cache', { error: error.message });
    res.status(500).json({
      error: 'Failed to clean cache',
      message: error.message
    });
  }
});

// Bulk search by postcode
app.get('/api/properties/search', async (req, res) => {
  try {
    const { postcode, size = 50 } = req.query;

    if (!postcode) {
      return res.status(400).json({
        error: 'Postcode is required'
      });
    }

    // Validate postcode
    if (!validationService.isValidUKPostcode(postcode)) {
      return res.status(400).json({
        error: 'Invalid UK postcode format'
      });
    }

    const properties = await propertyService.elasticsearchService.searchPropertiesByPostcode(postcode, parseInt(size));
    
    res.json({
      postcode: postcode,
      count: properties.length,
      properties: properties,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in bulk property search', {
      error: error.message,
      postcode: req.query.postcode
    });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Property enrichment service started on port ${PORT}`);
  console.log(`🚀 Property Enrichment Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Property info: http://localhost:${PORT}/api/property-info?postcode=SW1A1AA&number=10`);
});

module.exports = app; 