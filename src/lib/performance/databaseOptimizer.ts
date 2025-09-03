import { supabase } from '../supabaseClient';
import { auditLogger } from '../audit/auditLogger';

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  improvements: string[];
  estimatedPerformanceGain: number;
  executionPlan?: any;
}

export interface DatabaseMetrics {
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  indexUsage: Record<string, number>;
  tableStats: Record<string, { rows: number; size: string }>;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  query: string;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private queryMetrics = new Map<string, { count: number; totalTime: number; avgTime: number }>();
  private slowQueries: Array<{ query: string; time: number; timestamp: Date }> = [];
  private indexRecommendations: IndexRecommendation[] = [];

  private constructor() {
    this.startMetricsCollection();
    this.analyzeExistingQueries();
  }

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Optimize a SQL query
  async optimizeQuery(query: string, params: any[] = []): Promise<QueryOptimizationResult> {
    const improvements: string[] = [];
    let optimizedQuery = query;
    let estimatedGain = 0;

    // Check for common optimization opportunities
    const analysis = this.analyzeQuery(query);

    // 1. Add missing LIMIT clauses
    if (analysis.needsLimit && !query.toLowerCase().includes('limit')) {
      optimizedQuery += ' LIMIT 1000';
      improvements.push('Added LIMIT clause to prevent large result sets');
      estimatedGain += 20;
    }

    // 2. Replace SELECT * with specific columns
    if (analysis.hasSelectStar) {
      const tableName = analysis.tableName;
      if (tableName) {
        const columns = await this.getRecommendedColumns(tableName);
        if (columns.length > 0) {
          optimizedQuery = optimizedQuery.replace(/SELECT \*/i, `SELECT ${columns.join(', ')}`);
          improvements.push('Replaced SELECT * with specific columns');
          estimatedGain += 15;
        }
      }
    }

    // 3. Add missing WHERE clauses for large tables
    if (analysis.needsWhereClause && analysis.tableName) {
      const tableSize = await this.getTableSize(analysis.tableName);
      if (tableSize > 10000) {
        improvements.push('Consider adding WHERE clause to filter large table');
        estimatedGain += 10;
      }
    }

    // 4. Optimize JOINs
    if (analysis.hasJoins) {
      const joinOptimizations = this.optimizeJoins(query);
      if (joinOptimizations.length > 0) {
        improvements.push(...joinOptimizations);
        estimatedGain += 25;
      }
    }

    // 5. Add missing indexes
    const indexRecs = await this.analyzeIndexNeeds(query);
    if (indexRecs.length > 0) {
      improvements.push(`Consider adding ${indexRecs.length} indexes for better performance`);
      estimatedGain += 30;
      this.indexRecommendations.push(...indexRecs);
    }

    return {
      originalQuery: query,
      optimizedQuery,
      improvements,
      estimatedPerformanceGain: Math.min(estimatedGain, 100)
    };
  }

  // Execute optimized query with caching
  async executeOptimizedQuery<T>(
    query: string,
    params: any[] = [],
    options: {
      cacheKey?: string;
      ttl?: number;
      userId?: string;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const { cacheKey, ttl = 300000, userId, forceRefresh = false } = options;
    const startTime = Date.now();

    // Check cache first
    if (cacheKey && !forceRefresh) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached !== null) {
        this.recordQueryMetrics(query, Date.now() - startTime, true);
        return cached;
      }
    }

    try {
      // Optimize the query
      const optimization = await this.optimizeQuery(query, params);
      
      // Execute the optimized query
      let result: T;
      if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase.rpc('execute_sql', {
          query: optimization.optimizedQuery,
          params: params
        });
        
        if (error) throw error;
        result = data as T;
      } else {
        // Fallback for development
        result = [] as T;
      }

      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(query, executionTime, false);

      // Cache the result
      if (cacheKey) {
        this.setCache(cacheKey, result, ttl);
      }

      // Log slow queries
      if (executionTime > 1000) {
        this.slowQueries.push({
          query: optimization.optimizedQuery,
          time: executionTime,
          timestamp: new Date()
        });
        
        if (userId) {
          await auditLogger.logSystemEvent('slow_query_detected', {
            query: optimization.optimizedQuery,
            executionTime,
            improvements: optimization.improvements
          }, 'medium');
        }
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQueryMetrics(query, executionTime, false);
      throw error;
    }
  }

  // Get database performance metrics
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const metrics: DatabaseMetrics = {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: this.slowQueries.length,
      cacheHitRate: this.calculateCacheHitRate(),
      connectionPoolUtilization: 0,
      indexUsage: {},
      tableStats: {}
    };

    // Calculate query metrics
    for (const [query, stats] of this.queryMetrics) {
      metrics.queryCount += stats.count;
      metrics.averageQueryTime += stats.avgTime * stats.count;
    }

    if (metrics.queryCount > 0) {
      metrics.averageQueryTime /= metrics.queryCount;
    }

    // Get table statistics
    if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
      try {
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');

        for (const table of tables || []) {
          const { data: stats } = await supabase
            .rpc('get_table_stats', { table_name: table.table_name });
          
          if (stats) {
            metrics.tableStats[table.table_name] = {
              rows: stats.row_count || 0,
              size: this.formatBytes(stats.size_bytes || 0)
            };
          }
        }
      } catch (error) {
        console.warn('Could not fetch table statistics:', error);
      }
    }

    return metrics;
  }

  // Get index recommendations
  getIndexRecommendations(): IndexRecommendation[] {
    return this.indexRecommendations;
  }

  // Create recommended indexes
  async createRecommendedIndexes(): Promise<{ created: string[]; failed: string[] }> {
    const created: string[] = [];
    const failed: string[] = [];

    for (const rec of this.indexRecommendations) {
      try {
        const indexName = `idx_${rec.table}_${rec.columns.join('_')}`;
        const indexQuery = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${rec.table} USING ${rec.type} (${rec.columns.join(', ')})`;
        
        if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
          const { error } = await supabase.rpc('execute_sql', { query: indexQuery });
          if (error) throw error;
        }
        
        created.push(indexName);
      } catch (error) {
        failed.push(`${rec.table}(${rec.columns.join(', ')})`);
        console.error('Failed to create index:', error);
      }
    }

    return { created, failed };
  }

  // Private helper methods
  private analyzeQuery(query: string) {
    const lowerQuery = query.toLowerCase();
    return {
      needsLimit: !lowerQuery.includes('limit') && !lowerQuery.includes('count('),
      hasSelectStar: lowerQuery.includes('select *'),
      needsWhereClause: !lowerQuery.includes('where') && !lowerQuery.includes('join'),
      hasJoins: lowerQuery.includes('join'),
      tableName: this.extractTableName(query)
    };
  }

  private extractTableName(query: string): string | null {
    const match = query.match(/from\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private async getRecommendedColumns(tableName: string): Promise<string[]> {
    // Return commonly used columns for each table
    const commonColumns: Record<string, string[]> = {
      user_profiles: ['id', 'email', 'name', 'tier', 'created_at'],
      audit_logs: ['id', 'user_id', 'action', 'timestamp', 'severity'],
      portfolios: ['id', 'name', 'user_id', 'created_at'],
      properties: ['id', 'address', 'postcode', 'property_type', 'bedrooms']
    };

    return commonColumns[tableName] || ['id'];
  }

  private async getTableSize(tableName: string): Promise<number> {
    try {
      if (supabase && !supabase.supabaseUrl.includes('placeholder')) {
        const { data } = await supabase
          .rpc('get_table_row_count', { table_name: tableName });
        return data || 0;
      }
    } catch (error) {
      console.warn('Could not get table size:', error);
    }
    return 0;
  }

  private optimizeJoins(query: string): string[] {
    const improvements: string[] = [];
    
    // Check for cartesian products
    if ((query.match(/join/gi) || []).length > 3) {
      improvements.push('Consider breaking down complex JOINs into smaller queries');
    }

    // Check for missing JOIN conditions
    if (query.includes('JOIN') && !query.includes('ON')) {
      improvements.push('Add proper JOIN conditions to avoid cartesian products');
    }

    return improvements;
  }

  private async analyzeIndexNeeds(query: string): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];
    const lowerQuery = query.toLowerCase();

    // Analyze WHERE clauses for index needs
    const whereMatches = lowerQuery.match(/where\s+(\w+)\s*[=<>]/g);
    if (whereMatches) {
      for (const match of whereMatches) {
        const column = match.match(/where\s+(\w+)/)?.[1];
        const table = this.extractTableName(query);
        
        if (column && table) {
          recommendations.push({
            table,
            columns: [column],
            type: 'btree',
            reason: 'Frequent filtering on this column',
            estimatedImpact: 'high',
            query: `SELECT * FROM ${table} WHERE ${column} = ?`
          });
        }
      }
    }

    // Analyze ORDER BY clauses
    const orderMatches = lowerQuery.match(/order\s+by\s+(\w+)/g);
    if (orderMatches) {
      for (const match of orderMatches) {
        const column = match.match(/order\s+by\s+(\w+)/)?.[1];
        const table = this.extractTableName(query);
        
        if (column && table) {
          recommendations.push({
            table,
            columns: [column],
            type: 'btree',
            reason: 'Frequent sorting on this column',
            estimatedImpact: 'medium',
            query: `SELECT * FROM ${table} ORDER BY ${column}`
          });
        }
      }
    }

    return recommendations;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.result as T;
  }

  private setCache<T>(key: string, value: T, ttl: number): void {
    this.queryCache.set(key, {
      result: value,
      timestamp: Date.now(),
      ttl
    });
  }

  private recordQueryMetrics(query: string, time: number, fromCache: boolean): void {
    const key = this.normalizeQuery(query);
    const existing = this.queryMetrics.get(key) || { count: 0, totalTime: 0, avgTime: 0 };
    
    existing.count++;
    existing.totalTime += time;
    existing.avgTime = existing.totalTime / existing.count;
    
    this.queryMetrics.set(key, existing);
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\$\d+/g, '$?')
      .toLowerCase()
      .trim();
  }

  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const [_, stats] of this.queryMetrics) {
      totalRequests += stats.count;
      // This is a simplified calculation - in reality you'd track cache hits separately
    }

    return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private startMetricsCollection(): void {
    // Clean up old slow queries every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      this.slowQueries = this.slowQueries.filter(q => q.timestamp > oneHourAgo);
    }, 60 * 60 * 1000);

    // Clean up query cache every 30 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.queryCache) {
        if (now - cached.timestamp > cached.ttl) {
          this.queryCache.delete(key);
        }
      }
    }, 30 * 60 * 1000);
  }

  private analyzeExistingQueries(): void {
    // This would analyze existing queries in production
    // For now, we'll add some common optimization patterns
    this.indexRecommendations.push(
      {
        table: 'user_profiles',
        columns: ['email'],
        type: 'btree',
        reason: 'Frequent lookups by email',
        estimatedImpact: 'high',
        query: 'SELECT * FROM user_profiles WHERE email = ?'
      },
      {
        table: 'audit_logs',
        columns: ['user_id', 'timestamp'],
        type: 'btree',
        reason: 'Frequent filtering by user and time range',
        estimatedImpact: 'high',
        query: 'SELECT * FROM audit_logs WHERE user_id = ? AND timestamp > ?'
      }
    );
  }
}

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance();
