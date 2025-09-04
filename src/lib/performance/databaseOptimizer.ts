import { performanceOptimizer } from './performanceOptimizer';
import { auditLogger } from '../audit/auditLogger';

export interface QueryPlan {
  id: string;
  query: string;
  executionTime: number;
  rowsExamined: number;
  rowsReturned: number;
  indexUsed: string | null;
  optimization: string | null;
  timestamp: string;
}

export interface IndexRecommendation {
  id: string;
  table: string;
  columns: string[];
  type: 'primary' | 'unique' | 'index' | 'fulltext';
  reason: string;
  estimatedImprovement: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'applied' | 'rejected';
  createdAt: string;
}

export interface ConnectionPoolMetrics {
  active: number;
  idle: number;
  total: number;
  waiting: number;
  maxConnections: number;
  utilization: number;
}

export interface DatabaseMetrics {
  connectionPool: ConnectionPoolMetrics;
  queryPerformance: {
    slowQueries: number;
    averageQueryTime: number;
    totalQueries: number;
    queriesPerSecond: number;
  };
  indexUsage: {
    used: number;
    unused: number;
    recommendations: IndexRecommendation[];
  };
  tableStats: {
    totalTables: number;
    largestTables: Array<{
      name: string;
      rows: number;
      size: string;
    }>;
  };
}

export interface QueryOptimization {
  id: string;
  originalQuery: string;
  optimizedQuery: string;
  improvement: number;
  optimization: string;
  applied: boolean;
  createdAt: string;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryPlans: QueryPlan[] = [];
  private indexRecommendations: IndexRecommendation[] = [];
  private queryOptimizations: QueryOptimization[] = [];
  private connectionPoolMetrics: ConnectionPoolMetrics = {
    active: 0,
    idle: 0,
    total: 0,
    waiting: 0,
    maxConnections: 100,
    utilization: 0,
  };

  // Performance thresholds
  private readonly THRESHOLDS = {
    slowQuery: 500, // 500ms
    connectionUtilization: 0.8, // 80%
    indexUsage: 0.7, // 70%
  };

  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Analyze query performance
  public async analyzeQuery(query: string, executionTime: number, rowsExamined: number, rowsReturned: number): Promise<QueryPlan> {
    const queryPlan: QueryPlan = {
      id: this.generateId(),
      query: this.sanitizeQuery(query),
      executionTime,
      rowsExamined,
      rowsReturned,
      indexUsed: this.detectIndexUsage(query),
      optimization: null,
      timestamp: new Date().toISOString(),
    };

    this.queryPlans.push(queryPlan);

    // Check for slow queries
    if (executionTime > this.THRESHOLDS.slowQuery) {
      await this.analyzeSlowQuery(queryPlan);
    }

    // Record performance metrics
    await performanceOptimizer.recordMetric({
      type: 'database',
      name: 'query_time',
      value: executionTime,
      unit: 'ms',
      metadata: {
        query: queryPlan.query,
        rowsExamined,
        rowsReturned,
      },
    });

    return queryPlan;
  }

  // Analyze slow query and generate recommendations
  private async analyzeSlowQuery(queryPlan: QueryPlan): Promise<void> {
    const optimizations = this.generateQueryOptimizations(queryPlan);
    
    for (const optimization of optimizations) {
      const queryOptimization: QueryOptimization = {
        id: this.generateId(),
        originalQuery: queryPlan.query,
        optimizedQuery: optimization.query,
        improvement: optimization.improvement,
        optimization: optimization.description,
        applied: false,
        createdAt: new Date().toISOString(),
      };

      this.queryOptimizations.push(queryOptimization);

      // Log slow query detection
      await auditLogger.logSystemEvent('slow_query_detected', {
        query: queryPlan.query,
        executionTime: queryPlan.executionTime,
        optimization: optimization.description,
      });
    }
  }

  // Generate query optimizations
  private generateQueryOptimizations(queryPlan: QueryPlan): Array<{ query: string; improvement: number; description: string }> {
    const optimizations: Array<{ query: string; improvement: number; description: string }> = [];
    const query = queryPlan.query.toLowerCase();

    // Check for missing indexes
    if (query.includes('where') && !queryPlan.indexUsed) {
      const columns = this.extractWhereColumns(query);
      if (columns.length > 0) {
        optimizations.push({
          query: queryPlan.query,
          improvement: 50,
          description: `Add index on columns: ${columns.join(', ')}`,
        });
      }
    }

    // Check for inefficient JOINs
    if (query.includes('join')) {
      optimizations.push({
        query: queryPlan.query,
        improvement: 30,
        description: 'Optimize JOIN order and add covering indexes',
      });
    }

    // Check for SELECT *
    if (query.includes('select *')) {
      optimizations.push({
        query: queryPlan.query,
        improvement: 20,
        description: 'Replace SELECT * with specific columns',
      });
    }

    return optimizations;
  }

  // Extract columns from WHERE clause
  private extractWhereColumns(query: string): string[] {
    const whereMatch = query.match(/where\s+(.+?)(?:\s+group\s+by|\s+order\s+by|\s+limit|$)/i);
    if (!whereMatch) return [];

    const whereClause = whereMatch[1];
    const columnMatches = whereClause.match(/(\w+)\s*[=<>!]/g);
    
    if (!columnMatches) return [];
    
    return columnMatches.map(match => match.split(/\s*[=<>!]/)[0].trim());
  }

  // Detect index usage from query
  private detectIndexUsage(query: string): string | null {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('where id =')) return 'primary_key';
    if (queryLower.includes('where user_id =')) return 'user_id_index';
    if (queryLower.includes('where email =')) return 'email_index';
    if (queryLower.includes('where created_at >')) return 'created_at_index';
    
    return null;
  }

  // Sanitize query for logging
  private sanitizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/'.*?'/g, "'***'")
      .replace(/\d+/g, 'N')
      .trim();
  }

  // Update connection pool metrics
  public async updateConnectionPoolMetrics(metrics: Partial<ConnectionPoolMetrics>): Promise<void> {
    this.connectionPoolMetrics = { ...this.connectionPoolMetrics, ...metrics };
    this.connectionPoolMetrics.utilization = this.connectionPoolMetrics.active / this.connectionPoolMetrics.maxConnections;

    // Check for connection pool issues
    if (this.connectionPoolMetrics.utilization > this.THRESHOLDS.connectionUtilization) {
      await this.createConnectionPoolRecommendation();
    }

    // Record performance metrics
    await performanceOptimizer.recordMetric({
      type: 'database',
      name: 'connection_utilization',
      value: this.connectionPoolMetrics.utilization,
      unit: 'ratio',
      metadata: {
        active: this.connectionPoolMetrics.active,
        total: this.connectionPoolMetrics.total,
        waiting: this.connectionPoolMetrics.waiting,
      },
    });
  }

  // Create connection pool recommendation
  private async createConnectionPoolRecommendation(): Promise<void> {
    const recommendation = await performanceOptimizer.createRecommendation({
      type: 'database',
      priority: 'high',
      title: 'Database Connection Pool Optimization',
      description: `Connection pool utilization (${(this.connectionPoolMetrics.utilization * 100).toFixed(1)}%) exceeds threshold (${(this.THRESHOLDS.connectionUtilization * 100).toFixed(1)}%)`,
      impact: 'Potential connection timeouts and performance degradation',
      effort: 'medium',
      estimatedImprovement: 30,
    });

    // Log connection pool issue
    await auditLogger.logSystemEvent('connection_pool_issue', {
      utilization: this.connectionPoolMetrics.utilization,
      active: this.connectionPoolMetrics.active,
      total: this.connectionPoolMetrics.total,
      waiting: this.connectionPoolMetrics.waiting,
    });
  }

  // Get database metrics
  public async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    const recentQueries = this.queryPlans.filter(
      plan => Date.now() - new Date(plan.timestamp).getTime() < 60 * 60 * 1000 // Last hour
    );

    const slowQueries = recentQueries.filter(plan => plan.executionTime > this.THRESHOLDS.slowQuery).length;
    const averageQueryTime = recentQueries.length > 0 
      ? recentQueries.reduce((sum, plan) => sum + plan.executionTime, 0) / recentQueries.length 
      : 0;

    return {
      connectionPool: { ...this.connectionPoolMetrics },
      queryPerformance: {
        slowQueries,
        averageQueryTime,
        totalQueries: recentQueries.length,
        queriesPerSecond: recentQueries.length / 3600,
      },
      indexUsage: {
        used: this.queryPlans.filter(plan => plan.indexUsed).length,
        unused: this.queryPlans.filter(plan => !plan.indexUsed).length,
        recommendations: this.indexRecommendations.filter(rec => rec.status === 'pending'),
      },
      tableStats: {
        totalTables: 15,
        largestTables: [
          { name: 'properties', rows: 1000000, size: '2.5GB' },
          { name: 'users', rows: 50000, size: '150MB' },
          { name: 'search_logs', rows: 200000, size: '800MB' },
        ],
      },
    };
  }

  // Get query optimizations
  public async getQueryOptimizations(): Promise<QueryOptimization[]> {
    return this.queryOptimizations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get index recommendations
  public async getIndexRecommendations(): Promise<IndexRecommendation[]> {
    return this.indexRecommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Apply index recommendation
  public async applyIndexRecommendation(id: string): Promise<boolean> {
    const recommendation = this.indexRecommendations.find(rec => rec.id === id);
    if (!recommendation) return false;

    recommendation.status = 'applied';

    // Log index application
    await auditLogger.logSystemEvent('index_recommendation_applied', {
      id,
      table: recommendation.table,
      columns: recommendation.columns,
      type: recommendation.type,
    });

    return true;
  }

  // Apply query optimization
  public async applyQueryOptimization(id: string): Promise<boolean> {
    const optimization = this.queryOptimizations.find(opt => opt.id === id);
    if (!optimization) return false;

    optimization.applied = true;

    // Log optimization application
    await auditLogger.logSystemEvent('query_optimization_applied', {
      id,
      optimization: optimization.optimization,
      improvement: optimization.improvement,
    });

    return true;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance();