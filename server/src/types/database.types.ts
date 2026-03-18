import { QueryResult as PgQueryResult, QueryResultRow, Pool } from 'pg';

/**
 * Database configuration interface
 */
export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

/**
 * Re-export pg QueryResult with custom type
 */
export type QueryResult<T extends QueryResultRow = any> = PgQueryResult<T>;

/**
 * Database error interface extending native Error
 */
export interface DbError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

/**
 * Database connection status
 */
export interface DbConnectionStatus {
  connected: boolean;
  host?: string;
  port?: number;
  database?: string;
  timestamp: Date;
  error?: string;
}

/**
 * Query logging metadata
 */
export interface QueryLogMetadata {
  query: string;
  params?: any[];
  executionTime: number;
  timestamp: Date;
  error?: string;
}

/**
 * Health check result
 */
export interface DbHealthCheckResult {
  status: 'ok' | 'error';
  message: string;
  timestamp: Date;
  details?: {
    host: string;
    port: number;
    database: string;
    version?: string;
  };
  error?: string;
}

/**
 * Extended Express Request with database pool
 */
declare global {
  namespace Express {
    interface Request {
      db?: Pool;
    }
  }
}
