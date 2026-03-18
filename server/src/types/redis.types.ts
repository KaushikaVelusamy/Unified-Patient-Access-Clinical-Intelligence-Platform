/**
 * Redis Configuration Types
 */
export interface RedisConfig {
  url: string;
  token?: string;
  tls: boolean;
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Cache key patterns for different data types
 */
export enum CacheKey {
  // Appointment caching
  APPOINTMENT = 'appointment',
  APPOINTMENTS_BY_PATIENT = 'appointments:patient',
  APPOINTMENTS_BY_PROVIDER = 'appointments:provider',
  APPOINTMENT_SLOTS = 'appointment:slots',
  
  // Patient caching
  PATIENT = 'patient',
  PATIENT_PROFILE = 'patient:profile',
  PATIENT_HISTORY = 'patient:history',
  
  // Provider caching
  PROVIDER = 'provider',
  PROVIDER_SCHEDULE = 'provider:schedule',
  PROVIDER_AVAILABILITY = 'provider:availability',
  
  // Queue management
  QUEUE_STATUS = 'queue:status',
  QUEUE_POSITION = 'queue:position',
  
  // Session management
  SESSION = 'session',
  USER_SESSION = 'user:session',
  
  // Rate limiting
  RATE_LIMIT = 'ratelimit',
}

/**
 * Cache options for set operations
 */
export interface CacheOptions {
  // Time to live in seconds
  ttl?: number;
  
  // Namespace prefix
  namespace?: string;
  
  // Whether to compress data
  compress?: boolean;
}

/**
 * Redis health status
 */
export interface RedisHealthStatus {
  connected: boolean;
  latency?: number;
  uptime?: number;
  lastError?: string;
  timestamp: Date;
}

/**
 * Redis connection status
 */
export type RedisConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

/**
 * Redis client wrapper interface
 */
export interface IRedisClient {
  isAvailable: boolean;
  status: RedisConnectionStatus;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: CacheOptions): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ping(): Promise<string>;
  disconnect(): Promise<void>;
}
