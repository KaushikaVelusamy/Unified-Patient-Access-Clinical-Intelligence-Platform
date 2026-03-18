import redisClient from './redisClient';
import logger from './logger';
import { RedisHealthStatus } from '../types/redis.types';

/**
 * Redis Health Check Utility
 * 
 * Performs health checks on Redis connection:
 * - Tests connectivity with PING command
 * - Measures latency
 * - Updates availability status
 * - Provides health status for monitoring
 */

/**
 * Perform comprehensive Redis health check
 * Tests connection and measures latency
 * 
 * @returns Redis health status with connection details
 */
export async function performHealthCheck(): Promise<RedisHealthStatus> {
  const startTime = Date.now();
  
  const healthStatus: RedisHealthStatus = {
    connected: false,
    timestamp: new Date(),
  };

  try {
    // Test Redis connection
    await redisClient.connect();
    
    // Check if Redis is available
    if (!redisClient.isAvailable) {
      logger.warn('Redis health check: Redis not available');
      healthStatus.connected = false;
      healthStatus.lastError = redisClient.lastError || 'Not connected';
      return healthStatus;
    }

    // Perform PING test to measure latency
    const pingStart = Date.now();
    const pingResult = await redisClient.ping();
    const latency = Date.now() - pingStart;

    if (pingResult === 'PONG') {
      healthStatus.connected = true;
      healthStatus.latency = latency;
      logger.info(`✓ Redis health check passed (latency: ${latency}ms)`);
    } else {
      healthStatus.connected = false;
      healthStatus.lastError = 'Unexpected PING response';
      logger.warn('Redis health check: Unexpected PING response');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    healthStatus.connected = false;
    healthStatus.lastError = errorMessage;
    logger.error('Redis health check failed:', errorMessage);
  }

  // Calculate total check time
  healthStatus.uptime = Date.now() - startTime;

  return healthStatus;
}

/**
 * Get current Redis connection status
 * Returns status without performing active health check
 * 
 * @returns Current Redis health status
 */
export function getRedisStatus(): RedisHealthStatus {
  return {
    connected: redisClient.isAvailable,
    lastError: redisClient.lastError || undefined,
    timestamp: new Date(),
  };
}

/**
 * Quick Redis availability check
 * Tests if Redis is available without full health check
 * 
 * @returns True if Redis is available, false otherwise
 */
export function isRedisAvailable(): boolean {
  return redisClient.isAvailable;
}

/**
 * Get Redis connection status string
 * 
 * @returns Connection status ('connected', 'reconnecting', 'disconnected', etc.)
 */
export function getConnectionStatus(): string {
  return redisClient.status;
}

export default {
  performHealthCheck,
  getRedisStatus,
  isRedisAvailable,
  getConnectionStatus,
};
