import logger from './logger';
import config from '../config/env';
import { QueryLogMetadata } from '../types/database.types';

/**
 * Log query execution details (development only)
 * @param metadata - Query execution metadata
 */
export const logQuery = (metadata: QueryLogMetadata): void => {
  // Only log queries in development mode
  if (config.nodeEnv !== 'development') {
    return;
  }

  const { query, params, executionTime, timestamp, error } = metadata;

  if (error) {
    logger.error('Query execution failed:', {
      query: truncateQuery(query),
      params: params ? sanitizeParams(params) : undefined,
      executionTime: `${executionTime}ms`,
      timestamp: timestamp.toISOString(),
      error,
    });
  } else {
    // Log slow queries with warning level (>1000ms)
    if (executionTime > 1000) {
      logger.warn('Slow query detected:', {
        query: truncateQuery(query),
        params: params ? sanitizeParams(params) : undefined,
        executionTime: `${executionTime}ms`,
        timestamp: timestamp.toISOString(),
      });
    } else {
      logger.debug('Query executed:', {
        query: truncateQuery(query),
        params: params ? sanitizeParams(params) : undefined,
        executionTime: `${executionTime}ms`,
        timestamp: timestamp.toISOString(),
      });
    }
  }
};

/**
 * Truncate long queries for readable logs
 * @param query - SQL query string
 * @param maxLength - Maximum query length in logs (default: 200)
 * @returns Truncated query string
 */
const truncateQuery = (query: string, maxLength: number = 200): string => {
  // Remove extra whitespace and newlines
  const cleanQuery = query.replace(/\s+/g, ' ').trim();

  if (cleanQuery.length <= maxLength) {
    return cleanQuery;
  }

  return `${cleanQuery.substring(0, maxLength)}...`;
};

/**
 * Sanitize query parameters to avoid logging sensitive data
 * @param params - Query parameters array
 * @returns Sanitized parameters
 */
const sanitizeParams = (params: any[]): any[] => {
  return params.map((param) => {
    // Mask sensitive values (passwords, tokens, etc.)
    if (typeof param === 'string') {
      const lowerParam = param.toLowerCase();

      // Check if parameter might contain sensitive data
      if (
        lowerParam.includes('password') ||
        lowerParam.includes('token') ||
        lowerParam.includes('secret') ||
        lowerParam.includes('key')
      ) {
        return '***REDACTED***';
      }

      // Truncate very long strings
      if (param.length > 100) {
        return `${param.substring(0, 100)}... (${param.length} chars)`;
      }
    }

    return param;
  });
};

/**
 * Measure query execution time
 * @param queryFunc - Async function that executes a query
 * @returns Query result and execution time
 */
export const measureQueryTime = async <T>(
  queryFunc: () => Promise<T>,
): Promise<{ result: T; executionTime: number }> => {
  const start = Date.now();

  try {
    const result = await queryFunc();
    const executionTime = Date.now() - start;

    return {
      result,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - start;
    const err = error as Error;

    throw Object.assign(err, { executionTime });
  }
};

/**
 * Log query statistics summary
 * @param queries - Array of query metadata
 */
export const logQueryStatistics = (queries: QueryLogMetadata[]): void => {
  if (queries.length === 0) {
    return;
  }

  const totalTime = queries.reduce((sum, q) => sum + q.executionTime, 0);
  const avgTime = totalTime / queries.length;
  const slowQueries = queries.filter((q) => q.executionTime > 1000);
  const failedQueries = queries.filter((q) => q.error !== undefined);

  logger.info('Query statistics:', {
    totalQueries: queries.length,
    totalTime: `${totalTime}ms`,
    averageTime: `${avgTime.toFixed(2)}ms`,
    slowQueries: slowQueries.length,
    failedQueries: failedQueries.length,
  });

  if (slowQueries.length > 0) {
    logger.warn(`Detected ${slowQueries.length} slow queries (>1000ms):`);
    slowQueries.forEach((q, index) => {
      logger.warn(`  ${index + 1}. ${truncateQuery(q.query)} - ${q.executionTime}ms`);
    });
  }
};

export default logQuery;
