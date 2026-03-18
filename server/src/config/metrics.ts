import { MetricsConfig } from '../types/metrics.types';

/**
 * Prometheus Metrics Configuration
 * 
 * Configures histogram buckets, authentication, and label restrictions
 * to ensure optimal metric collection without performance degradation
 */

/**
 * Histogram buckets for request duration in seconds
 * Covers typical API response times from 10ms to 5 seconds
 * 
 * Buckets:
 * - 0.01s (10ms): Very fast responses (cache hits, health checks)
 * - 0.05s (50ms): Fast responses (simple queries)
 * - 0.1s (100ms): Normal responses (typical database queries)
 * - 0.5s (500ms): Slower responses (complex queries)
 * - 1s: Slow responses (heavy computations)
 * - 2s: Very slow responses (batch operations)
 * - 5s: Timeout threshold responses
 */
export const HISTOGRAM_BUCKETS = [0.01, 0.05, 0.1, 0.5, 1, 2, 5];

/**
 * Allowed metric labels (low-cardinality only)
 * 
 * Prevents high-cardinality issues by restricting labels to:
 * - method: Limited to HTTP methods (GET, POST, etc.)
 * - route: Normalized paths (/api/users/{id})
 * - status_code: HTTP status codes (200, 404, etc.)
 * - user_role: Limited set of roles (patient, doctor, admin)
 * 
 * FORBIDDEN labels that would cause high cardinality:
 * - user_id: Unique per user (millions of values)
 * - request_id: Unique per request (unlimited values)
 * - session_id: Unique per session (thousands of values)
 * - timestamp: Unique per request (unlimited values)
 */
export const ALLOWED_LABELS = ['method', 'route', 'status_code', 'user_role'];

/**
 * Default IP whitelist for metrics endpoint
 * Allows access from localhost and loopback addresses
 */
export const DEFAULT_IP_WHITELIST = ['127.0.0.1', '::1', 'localhost'];

/**
 * Metrics configuration object
 */
export const metricsConfig: MetricsConfig = {
  // Enable metrics collection (can be disabled in non-production environments)
  enabled: process.env.METRICS_ENABLED !== 'false',
  
  // Authentication configuration
  auth: {
    enabled: process.env.METRICS_AUTH_ENABLED === 'true',
    username: process.env.METRICS_AUTH_USER,
    password: process.env.METRICS_AUTH_PASS,
  },
  
  // IP whitelist (comma-separated in env var)
  ipWhitelist: process.env.METRICS_IP_WHITELIST
    ? process.env.METRICS_IP_WHITELIST.split(',').map(ip => ip.trim())
    : DEFAULT_IP_WHITELIST,
  
  // Histogram buckets for request duration
  histogramBuckets: HISTOGRAM_BUCKETS,
  
  // Allowed label names
  allowedLabels: ALLOWED_LABELS,
};

/**
 * Validate metrics configuration
 * Ensures required fields are present if authentication is enabled
 */
export function validateMetricsConfig(): void {
  if (metricsConfig.auth.enabled) {
    if (!metricsConfig.auth.username || !metricsConfig.auth.password) {
      throw new Error(
        'Metrics authentication is enabled but METRICS_AUTH_USER or METRICS_AUTH_PASS is not set'
      );
    }
  }
  
  if (metricsConfig.ipWhitelist.length === 0) {
    console.warn(
      'Warning: No IP whitelist configured for metrics endpoint. Using default localhost-only access.'
    );
    metricsConfig.ipWhitelist = DEFAULT_IP_WHITELIST;
  }
}

export default metricsConfig;
