import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as path from 'path';

// Add fetch to global scope if it doesn't exist
if (!globalThis.fetch) {
  globalThis.fetch = fetch as any;
}

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

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

class TursoClient {
  private baseUrl: string;
  private authToken: string;

  constructor() {
    dotenv.config({ path: require('path').join(__dirname, '.env') });
    const databaseUrl = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN environment variable is not set');
    }

    // Convert libsql:// URL to https:// if needed
    this.baseUrl = databaseUrl.replace(/^libsql:\/\//, 'https://');
    this.authToken = authToken;
  }

  async executeQuery(query: string, params: any[] = []): Promise<ExecuteResult> {
    try {
      console.log('Executing query:', { query, params });
      
      const isReadOperation = query.trim().toUpperCase().startsWith('SELECT');
      const url = `${this.baseUrl}/v2/pipeline`;
      
      // Prepare the request body with proper type handling for numbers
      const requestBody = {
        requests: [{
          type: 'execute',
          stmt: {
            sql: query,
            ...(params.length > 0 && {
              args: params.map(p => {
                // Convert to string for all values and let Turso handle the type inference
                // This avoids issues with the Turso API's strict type checking
                return {
                  type: 'text',
                  value: p === null || p === undefined ? null : String(p)
                };
              })
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
          'Authorization': `Bearer ${this.authToken}`,
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
      
      const data = JSON.parse(responseText);
      
      // Log the full response for debugging
      console.log('Full response:', JSON.stringify(data, null, 2));
      
      // Check for errors in the response
      if (data.results?.[0]?.error) {
        throw new Error(`Turso API error: ${JSON.stringify(data.results[0].error)}`);
      }
      
      const result = data.results?.[0]?.response?.result;
      
      if (!result) {
        console.error('Unexpected response format:', data);
        return { rows: [], rowsAffected: 0, columns: [] };
      }
      
      const columns = result.cols?.map((col: TursoColumn) => col.name) || [];
      
      try {
        if (isReadOperation && Array.isArray(result.rows)) {
          // For SELECT queries, format the rows with column names
          const formattedRows = result.rows.map((row: TursoValue[]) => {
            const obj: Record<string, any> = {};
            row.forEach((value, index) => {
              const colName = columns[index] || `col${index}`;
              obj[colName] = value?.value ?? null;
            });
            return obj;
          });
          
          return {
            rows: formattedRows,
            rowsAffected: result.affected_row_count || 0,
            columns
          };
        } else {
          // For write operations, just return rowsAffected
          return {
            rows: [],
            rowsAffected: result.affected_row_count || 0,
            columns: []
          };
        }
      } catch (error) {
        console.error('Error processing response:', error);
        console.error('Problematic data:', { result, columns });
        throw error;
      }
    } catch (error) {
      console.error('Error in executeQuery:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const tursoClient = new TursoClient();

// Export helper functions
export async function execute(sql: string, params: any[] = []): Promise<number> {
  const result = await tursoClient.executeQuery(sql, params);
  return result.rowsAffected;
}

export async function getRows(sql: string, params: any[] = []): Promise<Record<string, any>[]> {
  const result = await tursoClient.executeQuery(sql, params);
  return result.rows;
}
