import { RedisOptions } from 'ioredis';
import config from './env';
import logger from '../utils/logger';

/**
 * Upstash Redis Configuration with TLS encryption
 * 
 * Features:
 * - TLS/SSL encryption for secure connections
 * - Automatic reconnection with exponential backoff
 * - Connection timeout and retry strategy
 * - Graceful degradation on connection failures
 */

/**
 * Retry strategy with exponential backoff
 * Attempts: 3 retries with increasing delays (1s, 2s, 4s)
 */
const retryStrategy = (times: number): number | null => {
  const maxRetries = config.redis.maxRetries;
  
  if (times > maxRetries) {
    logger.error(`Redis connection failed after ${maxRetries} attempts. Switching to database fallback.`);
    return null; // Stop retrying
  }
  
  // Exponential backoff: 2^(times-1) seconds
  const delay = Math.min(Math.pow(2, times - 1) * 1000, 5000);
  logger.warn(`Redis connection attempt ${times}/${maxRetries}. Retrying in ${delay}ms...`);
  
  return delay;
};

/**
 * ioredis configuration for Upstash Redis
 */
export const redisConfig: RedisOptions = {
  // Upstash connection URL (includes host, port, and authentication)
  lazyConnect: true, // Don't connect immediately, wait for explicit connect()
  
  // TLS/SSL configuration for secure connection
  tls: config.redis.tls ? {
    // Upstash requires TLS, reject unauthorized certificates
    rejectUnauthorized: true,
  } : undefined,
  
  // Authentication (if token is provided separately from URL)
  password: config.redis.token,
  
  // Connection timeout (10 seconds)
  connectTimeout: 10000,
  
  // Command timeout (5 seconds)
  commandTimeout: 5000,
  
  // Retry strategy
  retryStrategy,
  
  // Maximum command queue size
  maxRetriesPerRequest: 3,
  
  // Enable offline queue (queue commands when disconnected)
  enableOfflineQueue: false, // Fail fast instead of queuing
  
  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    const shouldReconnect = targetErrors.some(targetError => 
      err.message.includes(targetError)
    );
    
    if (shouldReconnect) {
      logger.warn(`Redis reconnecting due to error: ${err.message}`);
      return true;
    }
    
    return false;
  },
  
  // Keep-alive
  keepAlive: 30000, // 30 seconds
  
  // Connection name for debugging in Redis CLI
  connectionName: 'clinical-appointment-api',
  
  // Performance: Enable automatic pipeline
  enableAutoPipelining: true,
  
  // Logging (only in development)
  showFriendlyErrorStack: config.nodeEnv === 'development',
};

export default redisConfig;
