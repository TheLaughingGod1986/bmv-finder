# UK Property Enrichment Service

A Node.js service that enriches UK property data using the EPC (Energy Performance Certificate) Register API. The service provides property information including bedrooms, EPC rating, floor area, and property type based on house number and postcode.

## Features

- 🏠 **Property Data Enrichment**: Fetch detailed property information from EPC Register
- 📍 **Address Matching**: Intelligent address matching and normalization
- 🔒 **Security**: Rate limiting, input validation, and security headers
- 📊 **Logging**: Comprehensive logging with Winston
- 🚀 **Performance**: Optimized API calls with caching and timeouts
- ✅ **Validation**: UK postcode and address validation

## API Endpoints

### GET /api/property-info

Enriches property data for a given house number and postcode.

**Parameters:**
- `postcode` (required): UK postcode (e.g., "SW1A 1AA")
- `number` (required): House number or name (e.g., "10" or "The Cottage")

**Example Request:**
```bash
curl "http://localhost:3000/api/property-info?postcode=SW1A1AA&number=10"
```

**Example Response:**
```json
{
  "address": "10 Downing Street, SW1A1AA",
  "bedrooms": 3,
  "epc_rating": "C",
  "floor_area_m2": 82.5,
  "property_type": "Semi-detached",
  "construction_year": 1985,
  "current_energy_rating": "C",
  "potential_energy_rating": "B",
  "epc_date": "2023-01-15",
  "certificate_id": "123456789"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "property-enrichment-service"
}
```

## Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- EPC Register API token (register at https://epc.opendatacommunities.org/)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd property-enrichment-service
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp env.example .env
```

Edit `.env` file:
```env
# EPC Register API Configuration
EPC_API_BASE_URL=https://epc.opendatacommunities.org
EPC_API_TOKEN=your_epc_api_token_here
EPC_API_USERNAME=your_epc_api_username_here
EPC_API_PASSWORD=your_epc_api_password_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Start the service:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will be available at `http://localhost:3000`

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EPC_API_TOKEN` | EPC Register API Bearer token | - | Yes |
| `EPC_API_BASE_URL` | EPC API base URL | `https://epc.opendatacommunities.org` | No |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` (15 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Rate Limiting

The service includes rate limiting to prevent abuse:
- **Default**: 100 requests per 15 minutes per IP
- **Configurable**: Via environment variables
- **Headers**: Includes rate limit information in response headers

## Data Sources

### EPC Register API

The service primarily uses the EPC Register API to fetch property data:

- **Base URL**: https://epc.opendatacommunities.org/
- **Authentication:**
- The service will use **Basic Auth** (username/password) if both `EPC_API_USERNAME` and `EPC_API_PASSWORD` are set.
- If not, it will fallback to using the Bearer token (`EPC_API_TOKEN`).
- You can obtain your credentials from https://epc.opendatacommunities.org/account/api-keys
- **Data Fields**:
  - `number_of_bedrooms`: Number of bedrooms
  - `current-energy-efficiency`: Current EPC rating (A-G)
  - `total-floor-area`: Floor area in square meters
  - `property-type`: Property type (detached, semi, flat, etc.)

### Address Matching

The service implements intelligent address matching:

1. **Exact Match**: Perfect match on house number and postcode
2. **Partial Match**: Similar house numbers within the same postcode
3. **Postcode Match**: First property found in the postcode area

## Error Handling

The service provides comprehensive error handling:

- **400 Bad Request**: Invalid input parameters
- **404 Not Found**: Property not found in EPC data
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server or API errors

## Logging

The service uses Winston for logging:

- **File Logs**: `error.log` (errors only), `combined.log` (all logs)
- **Console Logs**: In development mode
- **Structured Logging**: JSON format with timestamps and metadata

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Input Validation**: Parameter sanitization
- **Error Sanitization**: No sensitive data in error responses

## Development

### Running Tests

```bash
npm test
```

### Code Structure

```
property-enrichment-service/
├── server.js                 # Main Express server
├── services/
│   ├── PropertyEnrichmentService.js  # Core enrichment logic
│   └── ValidationService.js          # Input validation
├── package.json
├── env.example
└── README.md
```

### Adding New Data Sources

To add additional data sources (like Ordnance Survey API):

1. Create a new service class in `services/`
2. Implement the data fetching logic
3. Integrate with `PropertyEnrichmentService.js`
4. Add configuration to environment variables

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
EPC_API_TOKEN=your_production_token
RATE_LIMIT_MAX_REQUESTS=50
```

## API Documentation

### Request Examples

```bash
# Basic property lookup
curl "http://localhost:3000/api/property-info?postcode=SW1A1AA&number=10"

# With house name
curl "http://localhost:3000/api/property-info?postcode=SW1A1AA&number=The%20Cottage"

# Health check
curl "http://localhost:3000/health"
```

### Response Format

All successful responses follow this format:

```json
{
  "address": "Formatted address",
  "bedrooms": 3,
  "epc_rating": "C",
  "floor_area_m2": 82.5,
  "property_type": "Semi-detached",
  "construction_year": 1985,
  "current_energy_rating": "C",
  "potential_energy_rating": "B",
  "epc_date": "2023-01-15",
  "certificate_id": "123456789"
}
```

## Troubleshooting

### Common Issues

1. **"EPC API token not configured"**
   - Ensure `EPC_API_TOKEN` is set in `.env`
   - Verify token is valid and active

2. **"Property not found"**
   - Check postcode format (remove spaces)
   - Verify house number format
   - Property may not have EPC data

3. **Rate limiting errors**
   - Reduce request frequency
   - Increase rate limit in configuration

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation 