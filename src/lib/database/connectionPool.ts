import { Pool, PoolClient, PoolConfig } from 'pg';
import { createClient } from '@supabase/supabase-js';

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Connection pool configuration
export interface PoolConfigExtended extends PoolConfig {
  max?: number;
  min?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}

// Database connection manager
export class DatabaseConnectionManager {
  private pool: Pool | null = null;
  private supabaseClient: any = null;
  private config: DatabaseConfig;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  // Initialize connection pool
  async initialize(): Promise<void> {
    try {
      const poolConfig: PoolConfigExtended = {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: this.config.maxConnections || 20,
        min: 5,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 10000
      };

      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      this.connectionAttempts = 0;

      console.log('✅ Database connection pool initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database connection pool:', error);
      await this.handleConnectionError(error);
    }
  }

  // Initialize Supabase client
  async initializeSupabase(): Promise<void> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key are required');
      }

      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  // Get connection from pool
  async getConnection(): Promise<PoolClient> {
    if (!this.pool || !this.isConnected) {
      await this.initialize();
    }

    if (!this.pool) {
      throw new Error('Database connection pool not initialized');
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      console.error('❌ Failed to get database connection:', error);
      await this.handleConnectionError(error);
      throw error;
    }
  }

  // Execute query with automatic connection management
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.getConnection();
    
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, text.substring(0, 100));
      }

      return result.rows;
    } catch (error) {
      console.error('❌ Query execution failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute transaction
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getConnection();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get pool statistics
  getPoolStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    isConnected: boolean;
  } {
    if (!this.pool) {
      return {
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
        isConnected: false
      };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    poolStats: any;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      await this.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        poolStats: this.getPoolStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        poolStats: this.getPoolStats(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Handle connection errors with retry logic
  private async handleConnectionError(error: any): Promise<void> {
    this.connectionAttempts++;
    this.isConnected = false;

    if (this.connectionAttempts < this.maxRetries) {
      console.log(`🔄 Retrying database connection (attempt ${this.connectionAttempts}/${this.maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.connectionAttempts));
      await this.initialize();
    } else {
      console.error('❌ Max database connection retries exceeded');
      throw new Error('Database connection failed after maximum retries');
    }
  }

  // Close all connections
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ Database connection pool closed');
    }
  }

  // Get Supabase client
  getSupabaseClient() {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabaseClient;
  }
}

// Query optimization utilities
export class QueryOptimizer {
  private static queryCache = new Map<string, { result: any; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Optimize SELECT queries
  static optimizeSelectQuery(query: string, params?: any[]): {
    optimizedQuery: string;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let optimizedQuery = query;

    // Check for missing LIMIT
    if (!query.toLowerCase().includes('limit') && !query.toLowerCase().includes('count(')) {
      suggestions.push('Consider adding LIMIT clause for better performance');
    }

    // Check for SELECT *
    if (query.toLowerCase().includes('select *')) {
      suggestions.push('Avoid SELECT * - specify only needed columns');
    }

    // Check for missing WHERE clause on large tables
    if (!query.toLowerCase().includes('where') && !query.toLowerCase().includes('join')) {
      suggestions.push('Consider adding WHERE clause to filter results');
    }

    // Check for potential N+1 queries
    if (query.toLowerCase().includes('select') && query.toLowerCase().includes('from')) {
      const tableCount = (query.toLowerCase().match(/from\s+\w+/g) || []).length;
      if (tableCount === 1 && !query.toLowerCase().includes('join')) {
        suggestions.push('Consider using JOINs instead of multiple queries');
      }
    }

    return { optimizedQuery, suggestions };
  }

  // Cache query results
  static async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.result;
    }

    const result = await queryFn();
    this.queryCache.set(key, { result, timestamp: Date.now() });
    
    return result;
  }

  // Clear cache
  static clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Get cache statistics
  static getCacheStats(): {
    size: number;
    keys: string[];
    hitRate: number;
  } {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }
}

// Database migration utilities
export class DatabaseMigrator {
  private dbManager: DatabaseConnectionManager;

  constructor(dbManager: DatabaseConnectionManager) {
    this.dbManager = dbManager;
  }

  // Run migrations
  async runMigrations(migrations: Array<{
    version: string;
    up: string;
    down: string;
  }>): Promise<void> {
    const client = await this.dbManager.getConnection();
    
    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Get applied migrations
      const appliedMigrations = await client.query('SELECT version FROM migrations ORDER BY version');
      const appliedVersions = new Set(appliedMigrations.rows.map(row => row.version));

      // Apply new migrations
      for (const migration of migrations) {
        if (!appliedVersions.has(migration.version)) {
          console.log(`🔄 Applying migration ${migration.version}...`);
          
          await client.query('BEGIN');
          try {
            await client.query(migration.up);
            await client.query('INSERT INTO migrations (version) VALUES ($1)', [migration.version]);
            await client.query('COMMIT');
            
            console.log(`✅ Migration ${migration.version} applied successfully`);
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        }
      }
    } finally {
      client.release();
    }
  }

  // Rollback migration
  async rollbackMigration(version: string, migrations: Array<{
    version: string;
    up: string;
    down: string;
  }>): Promise<void> {
    const migration = migrations.find(m => m.version === version);
    if (!migration) {
      throw new Error(`Migration ${version} not found`);
    }

    const client = await this.dbManager.getConnection();
    
    try {
      await client.query('BEGIN');
      await client.query(migration.down);
      await client.query('DELETE FROM migrations WHERE version = $1', [version]);
      await client.query('COMMIT');
      
      console.log(`✅ Migration ${version} rolled back successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Singleton database manager instance
let dbManager: DatabaseConnectionManager | null = null;

export function getDatabaseManager(): DatabaseConnectionManager {
  if (!dbManager) {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'bmvfinder',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000')
    };

    dbManager = new DatabaseConnectionManager(config);
  }

  return dbManager;
}

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  const dbManager = getDatabaseManager();
  await dbManager.initialize();
  await dbManager.initializeSupabase();
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  if (dbManager) {
    await dbManager.close();
    dbManager = null;
  }
}

// Export convenience functions for health monitoring
export function getDatabasePerformanceMonitor() {
  return dbManager?.getPerformanceMonitor();
}

export function getDatabaseHealthChecker() {
  return dbManager?.getHealthChecker();
}
