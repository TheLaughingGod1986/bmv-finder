# BMV Finder Developer Documentation

## Overview

BMV Finder is a Next.js-based property investment platform built with modern web technologies. This documentation provides comprehensive information for developers working on the platform.

## Architecture

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL (Supabase), Elasticsearch
- **Cache**: Redis, Advanced Cache System
- **Authentication**: JWT, Role-based Access Control
- **Styling**: Tailwind CSS, Framer Motion
- **Testing**: Custom Test Framework, Jest
- **Deployment**: Vercel, Docker, Kubernetes

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Services      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Microservices)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load Balancer │    │   Database      │
│   (Vercel)      │    │   (Nginx)       │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Elasticsearch │
                       │   (Search)      │
                       └─────────────────┘
```

## Project Structure

```
bmv-finder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── components/        # React Components
│   │   ├── globals.css        # Global Styles
│   │   ├── layout.tsx         # Root Layout
│   │   └── page.tsx           # Home Page
│   ├── lib/                   # Utility Libraries
│   │   ├── security/          # Security Services
│   │   ├── testing/           # Testing Framework
│   │   ├── performance/       # Performance Monitoring
│   │   └── analytics/         # Analytics Engine
│   └── tests/                 # Test Suites
│       ├── unit/              # Unit Tests
│       ├── integration/       # Integration Tests
│       ├── e2e/               # End-to-End Tests
│       ├── performance/       # Performance Tests
│       └── security/          # Security Tests
├── docs/                      # Documentation
├── scripts/                   # Build and Deployment Scripts
├── public/                    # Static Assets
├── package.json               # Dependencies
├── next.config.js             # Next.js Configuration
├── tailwind.config.js         # Tailwind Configuration
├── tsconfig.json              # TypeScript Configuration
└── README.md                  # Project Overview
```

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 14+
- Elasticsearch 8+
- Redis 6+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/bmvfinder/bmv-finder.git
cd bmv-finder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Configure environment variables**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bmvfinder
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-password

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# External APIs
ZEPHYR_API_KEY=your-zephyr-api-key
LAND_REGISTRY_API_KEY=your-land-registry-api-key

# Stripe
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-vercel-analytics-id
```

5. **Set up databases**
```bash
# Start PostgreSQL
brew services start postgresql

# Start Elasticsearch
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:8.19.0

# Start Redis
brew services start redis
```

6. **Run database migrations**
```bash
npm run db:migrate
```

7. **Populate Elasticsearch**
```bash
npm run populate-es
```

8. **Start development server**
```bash
npm run dev
```

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:e2e         # Run end-to-end tests only
npm run test:performance # Run performance tests only
npm run test:security    # Run security tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database

# Elasticsearch
npm run populate-es      # Populate Elasticsearch with data
npm run es:reset         # Reset Elasticsearch indices

# Deployment
npm run deploy:staging   # Deploy to staging
npm run deploy:production # Deploy to production
npm run deploy:verify    # Verify deployment
```

## API Development

### Creating API Routes

API routes are located in `src/app/api/` and follow Next.js App Router conventions.

```typescript
// src/app/api/properties/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const searchSchema = z.object({
  postcode: z.string().min(1),
  radius: z.number().min(0.5).max(5),
  limit: z.number().min(1).max(100).default(20)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = searchSchema.parse(body);
    
    // Your API logic here
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}
```

### API Best Practices

1. **Input Validation**: Always validate input using Zod schemas
2. **Error Handling**: Use consistent error response format
3. **Authentication**: Check authentication for protected routes
4. **Rate Limiting**: Implement rate limiting for public endpoints
5. **Logging**: Log all API requests and responses
6. **Documentation**: Document all API endpoints

### Authentication Middleware

```typescript
// src/lib/middleware/auth.ts
import { NextRequest } from 'next/server';
import { authManager } from '@/lib/security/authManager';

export async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No authentication token provided');
  }
  
  const validation = await authManager.validateSession(token);
  
  if (!validation.valid) {
    throw new Error('Invalid authentication token');
  }
  
  return validation.user;
}
```

## Database Development

### Database Schema

The application uses PostgreSQL with the following main tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio properties table
CREATE TABLE portfolio_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  property_id VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  postcode VARCHAR(20) NOT NULL,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  purchase_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Database Migrations

Migrations are located in `scripts/migrations/` and use a custom migration system.

```typescript
// scripts/migrations/001_create_users_table.ts
export async function up(db: Database) {
  await db.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      is_email_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function down(db: Database) {
  await db.query('DROP TABLE users;');
}
```

### Elasticsearch Integration

Elasticsearch is used for property search and analytics.

```typescript
// src/lib/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME!,
    password: process.env.ELASTICSEARCH_PASSWORD!
  }
});

export async function searchProperties(query: any) {
  const response = await client.search({
    index: 'properties',
    body: {
      query: {
        bool: {
          must: [
            { match: { postcode: query.postcode } },
            { range: { price: { gte: query.minPrice, lte: query.maxPrice } } }
          ]
        }
      },
      sort: [{ price: { order: 'asc' } }],
      size: query.limit
    }
  });
  
  return response.body.hits.hits;
}
```

## Component Development

### React Components

Components are located in `src/app/components/` and follow React best practices.

```typescript
// src/app/components/PropertyCard.tsx
'use client';

import { useState } from 'react';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  onAddToPortfolio?: (property: Property) => void;
  onAddToWatchlist?: (property: Property) => void;
}

export default function PropertyCard({ 
  property, 
  onAddToPortfolio, 
  onAddToWatchlist 
}: PropertyCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToPortfolio = async () => {
    setIsLoading(true);
    try {
      await onAddToPortfolio?.(property);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-2">{property.address}</h3>
      <p className="text-gray-600 mb-4">{property.postcode}</p>
      
      <div className="flex justify-between items-center mb-4">
        <span className="text-2xl font-bold text-green-600">
          £{property.price.toLocaleString()}
        </span>
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
          BMV: {property.bmvScore}
        </span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleAddToPortfolio}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add to Portfolio'}
        </button>
        <button
          onClick={() => onAddToWatchlist?.(property)}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Watch
        </button>
      </div>
    </div>
  );
}
```

### Component Best Practices

1. **TypeScript**: Use TypeScript for all components
2. **Props Interface**: Define clear prop interfaces
3. **Error Boundaries**: Wrap components in error boundaries
4. **Loading States**: Handle loading and error states
5. **Accessibility**: Use proper ARIA labels and keyboard navigation
6. **Performance**: Use React.memo and useMemo for optimization

## Testing

### Unit Testing

Unit tests are located in `src/tests/unit/` and test individual functions and components.

```typescript
// src/tests/unit/authManager.test.ts
import { testFramework, assert } from '@/lib/testing/testFramework';
import { authManager } from '@/lib/security/authManager';

testFramework.describe('AuthManager', 'Authentication system tests');

testFramework.it('should register a new user successfully', async () => {
  const userData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'user'
  };

  const result = await authManager.registerUser(userData);

  assert.isTrue(result.success, 'User registration should succeed');
  assert.isDefined(result.user, 'User should be returned');
  assert.equal(result.user!.email, userData.email, 'Email should match');
});
```

### Integration Testing

Integration tests are located in `src/tests/integration/` and test API endpoints.

```typescript
// src/tests/integration/apiIntegration.test.ts
import { testFramework, assert } from '@/lib/testing/testFramework';

testFramework.describe('API Integration Tests', 'API endpoint tests');

testFramework.it('should test property search API', async () => {
  const searchParams = {
    postcode: 'SW1A 1AA',
    radius: 1,
    limit: 10
  };

  const response = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchParams)
  });

  assert.isTrue(response.ok, 'Property search API should respond successfully');
  
  const data = await response.json();
  assert.isDefined(data, 'Response data should be defined');
  assert.isArray(data.properties, 'Properties should be an array');
});
```

### End-to-End Testing

E2E tests are located in `src/tests/e2e/` and test complete user workflows.

```typescript
// src/tests/e2e/userJourney.test.ts
import { testFramework, assert } from '@/lib/testing/testFramework';

testFramework.describe('User Journey E2E Tests', 'Complete user workflow tests');

testFramework.it('should complete property search journey', async () => {
  // Step 1: Search for properties
  const searchResponse = await fetch('http://localhost:3000/api/properties/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postcode: 'SW1A 1AA',
      radius: 1,
      limit: 10
    })
  });

  assert.isTrue(searchResponse.ok, 'Property search should succeed');
  const searchData = await searchResponse.json();
  assert.isArray(searchData.properties, 'Should return properties array');

  // Step 2: Get property details
  if (searchData.properties.length > 0) {
    const propertyId = searchData.properties[0].id;
    const detailsResponse = await fetch(`http://localhost:3000/api/properties/${propertyId}`);
    assert.isTrue(detailsResponse.ok, 'Property details should be retrieved');
  }
});
```

## Performance Optimization

### Caching Strategy

The application uses a multi-layer caching strategy:

```typescript
// src/lib/advancedCache.ts
export class AdvancedCache {
  private cache: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  async get<T>(key: string): Promise<T | null> {
    const ttl = this.ttl.get(key);
    if (ttl && Date.now() > ttl) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }
}
```

### Database Optimization

```typescript
// src/lib/queryOptimizer.ts
export class QueryOptimizer {
  async optimizeQuery(query: string, params: any[]): Promise<string> {
    // Analyze query performance
    const analysis = await this.analyzeQuery(query);
    
    // Apply optimizations
    if (analysis.hasNestedLoops) {
      return this.addIndexHints(query);
    }
    
    if (analysis.hasFullTableScan) {
      return this.addWhereClause(query);
    }
    
    return query;
  }
}
```

### Image Optimization

```typescript
// src/lib/imageOptimization.ts
import Image from 'next/image';

export function OptimizedImage({ src, alt, ...props }: any) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      {...props}
    />
  );
}
```

## Security

### Authentication

```typescript
// src/lib/security/authManager.ts
export class AuthManager {
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    // Check for brute force attempts
    const bruteForceCheck = this.checkBruteForce(email);
    if (!bruteForceCheck.allowed) {
      return { success: false, error: 'Too many failed attempts' };
    }

    // Verify password
    const user = await this.findUser(email);
    if (!user || !this.verifyPassword(password, user.passwordHash, user.salt)) {
      this.recordFailedAttempt(email);
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session
    const session = await this.createSession(user.id);
    return { success: true, user, session };
  }
}
```

### Data Encryption

```typescript
// src/lib/security/encryptionManager.ts
export class EncryptionManager {
  async encryptData(data: any, classification: string): Promise<EncryptedData> {
    const key = this.getEncryptionKey(classification);
    const iv = randomBytes(16);
    const cipher = createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      algorithm: 'aes-256-gcm',
      timestamp: new Date().toISOString()
    };
  }
}
```

### API Security

```typescript
// src/lib/security/apiSecurity.ts
export class APISecurityManager {
  async secureRequest(req: any, res: any, next: any): Promise<void> {
    // Check IP filtering
    const ipCheck = this.checkIPFiltering(req.ip);
    if (!ipCheck.allowed) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check rate limiting
    const rateLimitCheck = await this.checkRateLimit(req);
    if (!rateLimitCheck.allowed) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    // Validate request
    const validationResult = this.validateRequest(req);
    if (!validationResult.valid) {
      res.status(400).json({ error: validationResult.reason });
      return;
    }

    next();
  }
}
```

## Deployment

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/bmvfinder
ELASTICSEARCH_URL=https://prod-elasticsearch:9200
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-jwt-secret
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Kubernetes Configuration

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bmv-finder
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bmv-finder
  template:
    metadata:
      labels:
        app: bmv-finder
    spec:
      containers:
      - name: bmv-finder
        image: bmv-finder:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bmv-finder-secrets
              key: database-url
        - name: ELASTICSEARCH_URL
          valueFrom:
            secretKeyRef:
              name: bmv-finder-secrets
              key: elasticsearch-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Monitoring and Logging

### Performance Monitoring

```typescript
// src/lib/performanceMonitor.ts
export class PerformanceMonitor {
  async trackAPICall(endpoint: string, duration: number, status: number): Promise<void> {
    await this.recordMetric('api.response_time', duration, {
      endpoint,
      status: status.toString()
    });
    
    await this.recordMetric('api.requests_total', 1, {
      endpoint,
      status: status.toString()
    });
  }
}
```

### Error Logging

```typescript
// src/lib/errorLogger.ts
export class ErrorLogger {
  async logError(error: Error, context: any): Promise<void> {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', errorData);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoringService(errorData);
    }
  }
}
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```
3. **Make your changes**
4. **Write tests** for your changes
5. **Run tests** to ensure everything passes
```bash
npm run test
```
6. **Commit your changes**
```bash
git commit -m "Add your feature"
```
7. **Push to your fork**
```bash
git push origin feature/your-feature-name
```
8. **Create a pull request**

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write comprehensive tests
- Document public APIs
- Follow conventional commit messages

### Pull Request Guidelines

- Provide a clear description of changes
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Request review from team members

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
npm run db:status

# Reset database
npm run db:reset

# Check connection
npm run db:test
```

#### Elasticsearch Issues
```bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Reset Elasticsearch
npm run es:reset

# Check indices
curl http://localhost:9200/_cat/indices
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=bmv-finder:* npm run dev
```

### Performance Debugging

Use the performance monitoring tools:

```bash
# Run performance tests
npm run test:performance

# Check performance metrics
npm run perf:analyze
```

## Support

### Getting Help

- **Documentation**: Check this documentation first
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Email**: developer-support@bmvfinder.com

### Team Communication

- **Slack**: #bmv-finder-dev
- **Weekly Standups**: Mondays at 10 AM
- **Code Reviews**: Required for all PRs
- **Retrospectives**: End of each sprint

---

*Last updated: January 2024*
*Version: 1.0.0*
