import { pool, dbConfig } from '../config/database';
import logger from './logger';
import { DbError, DbHealthCheckResult } from '../types/database.types';

/**
 * Maximum number of connection retry attempts
 */
const MAX_RETRIES = 3;

/**
 * Sleep utility for retry delays (exponential backoff)
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Test database connection with a simple query
 * @returns Promise resolving to connection status
 */
const testConnection = async (): Promise<DbHealthCheckResult> => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as now, version() as version');
    const duration = Date.now() - start;

    if (result.rows && result.rows.length > 0) {
      const { version } = result.rows[0];

      logger.info('Database connection successful', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        duration: `${duration}ms`,
        version: version.split(',')[0], // Extract PostgreSQL version
      });

      return {
        status: 'ok',
        message: 'Database connection established successfully',
        timestamp: new Date(),
        details: {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          version: version.split(',')[0],
        },
      };
    }

    throw new Error('No result from database');
  } catch (error) {
    const err = error as DbError;

    return {
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date(),
      error: err.message,
    };
  }
};

/**
 * Perform database health check with retry logic
 * Attempts to connect to the database with exponential backoff
 * @returns Promise resolving when connection is successful
 * @throws Error if all retry attempts fail
 */
export const performHealthCheck = async (): Promise<void> => {
  logger.info('Starting database health check...');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${MAX_RETRIES}...`);

      const result = await testConnection();

      if (result.status === 'ok') {
        logger.info(`✓ Database connected successfully to ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);
        return; // Connection successful, exit function
      }

      // If we got an error result, throw it to trigger retry
      throw new Error(result.error || 'Unknown error');
    } catch (error) {
      const err = error as DbError;

      logger.error(`Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, {
        error: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
      });

      // If this was the last attempt, exit the process
      if (attempt === MAX_RETRIES) {
        logger.error('All database connection attempts failed. Exiting...');

        // Log helpful troubleshooting information
        logger.error('Troubleshooting tips:', {
          checkService: 'Verify PostgreSQL is running',
          checkCredentials: `Check DB_USER (${dbConfig.user}) and DB_PASSWORD`,
          checkHost: `Verify DB_HOST (${dbConfig.host}) is accessible`,
          checkPort: `Verify DB_PORT (${dbConfig.port}) is correct`,
          checkDatabase: `Verify database '${dbConfig.database}' exists`,
          checkFirewall: 'Check firewall rules and security groups',
        });

        process.exit(1); // Exit with error code
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      logger.info(`Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
};

/**
 * Get database connection status without retries
 * Useful for health check endpoints
 * @returns Promise resolving to health check result
 */
export const getConnectionStatus = async (): Promise<DbHealthCheckResult> => {
  try {
    const result = await testConnection();
    return result;
  } catch (error) {
    const err = error as DbError;

    logger.error('Database health check failed:', {
      error: err.message,
      code: err.code,
    });

    return {
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date(),
      error: err.message,
    };
  }
};

export default performHealthCheck;
