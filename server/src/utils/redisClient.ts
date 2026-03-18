import Redis from 'ioredis';
import config from '../config/env';
import redisConfig from '../config/redis';
import logger from './logger';
import { RedisConnectionStatus, CacheOptions } from '../types/redis.types';

/**
 * Redis Client Singleton
 * 
 * Provides a single Redis connection instance with:
 * - Automatic connection management
 * - Event-based status tracking
 * - Graceful fallback to database on failures
 * - Comprehensive error handling
 */

class RedisClientManager {
  private client: Redis | null = null;
  private _isAvailable: boolean = false;
  private _status: RedisConnectionStatus = 'disconnected';
  private _lastError: string | null = null;
  private connectionAttempted: boolean = false;

  /**
   * Get Redis availability status
   */
  get isAvailable(): boolean {
    return this._isAvailable;
  }

  /**
   * Get Redis connection status
   */
  get status(): RedisConnectionStatus {
    return this._status;
  }

  /**
   * Get last error message
   */
  get lastError(): string | null {
    return this._lastError;
  }

  /**
   * Initialize Redis client with Upstash configuration
   */
  async connect(): Promise<void> {
    if (this.connectionAttempted) {
      logger.warn('Redis connection already attempted. Skipping reconnection.');
      return;
    }

    this.connectionAttempted = true;

    try {
      logger.info('Initializing Redis connection to Upstash...');
      
      // Create Redis client with Upstash URL
      this.client = new Redis(config.redis.url, redisConfig);

      // Setup event handlers
      this.setupEventHandlers();

      // Attempt connection
      await this.client.connect();
      
      logger.info('Redis client initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to initialize Redis client:', errorMessage);
      this._lastError = errorMessage;
      this._isAvailable = false;
      this._status = 'error';
      
      // Don't throw - allow application to continue with database fallback
    }
  }

  /**
   * Setup Redis event handlers for connection lifecycle
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // Connection established
    this.client.on('connect', () => {
      logger.info('✓ Redis connected to Upstash');
      this._status = 'connecting';
    });

    // Connection ready (authenticated and ready for commands)
    this.client.on('ready', () => {
      logger.info('✓ Redis ready for commands');
      this._isAvailable = true;
      this._status = 'connected';
      this._lastError = null;
    });

    // Connection error
    this.client.on('error', (error: Error) => {
      logger.error('Redis connection error:', error.message);
      this._lastError = error.message;
      this._isAvailable = false;
      this._status = 'error';
      
      // Log fallback message
      logger.warn('⚠ Redis unavailable - falling back to database queries');
    });

    // Connection closed
    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this._isAvailable = false;
      this._status = 'disconnected';
    });

    // Reconnecting
    this.client.on('reconnecting', (delay: number) => {
      logger.info(`Redis reconnecting in ${delay}ms...`);
      this._status = 'reconnecting';
      this._isAvailable = false;
    });

    // Connection ended (no more reconnection attempts)
    this.client.on('end', () => {
      logger.warn('Redis connection ended permanently');
      this._isAvailable = false;
      this._status = 'disconnected';
    });
  }

  /**
   * Test Redis connection with PING command
   */
  async ping(): Promise<string> {
    if (!this.client || !this._isAvailable) {
      throw new Error('Redis client not available');
    }

    try {
      const result = await this.client.ping();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Redis PING failed:', errorMessage);
      this._isAvailable = false;
      throw error;
    }
  }

  /**
   * Get value from Redis cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.client || !this._isAvailable) {
      throw new Error('Redis client not available');
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET failed:', error);
      throw error;
    }
  }

  /**
   * Set value in Redis cache with optional TTL
   */
  async set(key: string, value: string, options?: CacheOptions): Promise<void> {
    if (!this.client || !this._isAvailable) {
      throw new Error('Redis client not available');
    }

    try {
      const finalKey = options?.namespace ? `${options.namespace}:${key}` : key;
      
      if (options?.ttl) {
        await this.client.setex(finalKey, options.ttl, value);
      } else {
        await this.client.set(finalKey, value);
      }
    } catch (error) {
      logger.error('Redis SET failed:', error);
      throw error;
    }
  }

  /**
   * Delete value from Redis cache
   */
  async del(key: string): Promise<void> {
    if (!this.client || !this._isAvailable) {
      throw new Error('Redis client not available');
    }

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL failed:', error);
      throw error;
    }
  }

  /**
   * Check if key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this._isAvailable) {
      throw new Error('Redis client not available');
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS failed:', error);
      throw error;
    }
  }

  /**
   * Get Redis client instance (for advanced operations)
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Gracefully disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      logger.info('Disconnecting from Redis...');
      await this.client.quit();
      this.client = null;
      this._isAvailable = false;
      this._status = 'disconnected';
      logger.info('Redis disconnected successfully');
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClientManager();

export default redisClient;
