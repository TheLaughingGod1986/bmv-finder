import { createClient, Client } from '@libsql/client';
import sqlite3 from 'sqlite3';
import path from 'path';

interface DatabaseConnection {
  execute: (sql: string, params?: any[]) => Promise<any>;
  query: (sql: string, params?: any[]) => Promise<any[]>;
  close: () => Promise<void> | void;
}

class TursoConnection implements DatabaseConnection {
  private client: Client;

  constructor() {
    this.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    const result = await this.client.execute({
      sql,
      args: params,
    });
    return result;
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.client.execute({
      sql,
      args: params,
    });
    return result.rows as any[];
  }

  async close(): Promise<void> {
    this.client.close();
  }
}

class SqliteConnection implements DatabaseConnection {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'land_registry.db');
    this.db = new sqlite3.Database(dbPath);
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    });
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

export function createDatabaseConnection(): DatabaseConnection {
  const databaseType = process.env.DATABASE_TYPE || 'local';
  
  if (databaseType === 'turso' && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return new TursoConnection();
  } else {
    return new SqliteConnection();
  }
}

// Helper function for single-row queries
export async function queryRow(sql: string, params: any[] = []): Promise<any | null> {
  const db = createDatabaseConnection();
  try {
    const rows = await db.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    await db.close();
  }
}

// Helper function for multi-row queries
export async function queryRows(sql: string, params: any[] = []): Promise<any[]> {
  const db = createDatabaseConnection();
  try {
    return await db.query(sql, params);
  } finally {
    await db.close();
  }
}

// Helper function for insert/update/delete operations
export async function executeQuery(sql: string, params: any[] = []): Promise<any> {
  const db = createDatabaseConnection();
  try {
    return await db.execute(sql, params);
  } finally {
    await db.close();
  }
}