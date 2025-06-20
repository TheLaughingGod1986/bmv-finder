// @ts-ignore - Node.js types are included in @types/node
import 'server-only';
import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

interface TursoColumn {
  name: string;
  decltype: string;
}

interface TursoValue {
  type: string;
  value: string | number | null;
}

interface TursoExecuteResult {
  cols: TursoColumn[];
  rows: TursoValue[][];
  affected_row_count: number;
  last_insert_rowid: number | null;
  replication_index: string | null;
  rows_read: number;
  rows_written: number;
  query_duration_ms: number;
}

interface ExecuteResult {
  rows: Record<string, any>[];
  rowsAffected: number;
  columns: string[];
}

interface TursoResponse {
  baton: string | null;
  base_url: string | null;
  results?: Array<{
    type: string;
    response?: {
      type: string;
      result?: TursoExecuteResult;
      error?: any;
    };
    error?: any;
  }>;
  error?: any;
}

class DatabaseClient {
  private tursoClient: any;
  private localClient: any | null;
  private useLocal: boolean = false;
  private isLocalDev: boolean;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN environment variable is not set');
    }

    // Initialize Turso client
    this.tursoClient = {
      baseUrl: this.getTursoBaseUrl(databaseUrl),
      authToken: authToken
    };

    // Only allow local fallback in development (not on Vercel)
    this.isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL;
    if (this.isLocalDev) {
      const { createClient } = require('@libsql/client');
      this.localClient = createClient({
        url: 'file:land_registry.db'
      });
    } else {
      this.localClient = null;
    }

    console.log('Database Client initialized with Turso URL:', this.tursoClient.baseUrl);
  }

  private getTursoBaseUrl(url: string): string {
    // Convert libsql:// to https://
    if (url.startsWith('libsql://')) {
      return `https://${url.replace('libsql://', '')}`;
    }
    return url;
  }

  async executeQuery(query: string, params: any[] = []): Promise<ExecuteResult> {
    try {
      // Try Turso first
      if (!this.useLocal) {
        try {
          return await this.executeTursoQuery(query, params);
        } catch (error) {
          if (this.isLocalDev && this.localClient) {
            // Only fallback to local in development
            console.log('Turso connection failed, falling back to local database:', error instanceof Error ? error.message : error);
            this.useLocal = true;
          } else {
            // In production, throw error
            throw error;
          }
        }
      }

      // Use local database (only in dev)
      if (this.isLocalDev && this.localClient) {
        return await this.executeLocalQuery(query, params);
      } else {
        throw new Error('Database connection failed and no local fallback is available.');
      }
    } catch (error) {
      console.error('Error in executeQuery:', error);
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeTursoQuery(query: string, params: any[] = []): Promise<ExecuteResult> {
    console.log('Executing Turso query:', { query, params });
    
    const isReadOperation = query.trim().toUpperCase().startsWith('SELECT');
    const url = `${this.tursoClient.baseUrl}/v2/pipeline`;
    
    // Prepare the request body
    const requestBody = {
      requests: [{
        type: 'execute',
        stmt: {
          sql: query,
          ...(params.length > 0 && {
            args: params.map(p => ({
              type: typeof p === 'number' ? 'number' : 'text',
              value: p
            }))
          })
        }
      }]
    };

    console.log('Sending request to:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tursoClient.authToken}`,
        'User-Agent': 'bmv-finder/1.0',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${responseText}`);
    }
    
    const data: TursoResponse = JSON.parse(responseText);
    console.log('Parsed response data:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      throw new Error(`Database error: ${JSON.stringify(data.error)}`);
    }
    
    if (!data.results?.[0]?.response?.result) {
      console.error('Unexpected response format:', data);
      return { rows: [], rowsAffected: 0, columns: [] };
    }
    
    const result = data.results[0].response.result;
    const columns = result.cols.map(col => col.name);
    
    if (isReadOperation) {
      // For SELECT queries, format the rows with column names
      const formattedRows = result.rows.map(row => {
        const obj: Record<string, any> = {};
        row.forEach((value, index) => {
          const colName = columns[index];
          obj[colName] = value.value;
        });
        return obj;
      });
      
      return {
        rows: formattedRows,
        rowsAffected: result.affected_row_count,
        columns
      };
    } else {
      // For write operations, just return rowsAffected
      return {
        rows: [],
        rowsAffected: result.affected_row_count,
        columns: []
      };
    }
  }

  private async executeLocalQuery(query: string, params: any[] = []): Promise<ExecuteResult> {
    console.log('Executing local query:', { query, params });
    
    try {
      const result = await this.localClient.execute(query, params);
      
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        return {
          rows: result.rows,
          rowsAffected: result.rowsAffected || 0,
          columns: result.columns || []
        };
      } else {
        return {
          rows: [],
          rowsAffected: result.rowsAffected || 0,
          columns: []
        };
      }
    } catch (error) {
      console.error('Local database error:', error);
      throw error;
    }
  }

  async getRows(query: string, params: any[] = []): Promise<any[]> {
    const result = await this.executeQuery(query, params);
    return result.rows;
  }

  async execute(query: string, params: any[] = []): Promise<number> {
    const result = await this.executeQuery(query, params);
    return result.rowsAffected;
  }
}

// Create a singleton instance
const databaseClient = new DatabaseClient();

// Export the instance methods as module functions
export const executeQuery = databaseClient.executeQuery.bind(databaseClient);
export const getRows = databaseClient.getRows.bind(databaseClient);
export const execute = databaseClient.execute.bind(databaseClient);
