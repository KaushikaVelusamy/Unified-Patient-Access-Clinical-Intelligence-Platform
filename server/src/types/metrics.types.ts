/**
 * Metrics Configuration Types
 */

/**
 * Metrics configuration interface
 */
export interface MetricsConfig {
  // Whether metrics collection is enabled
  enabled: boolean;
  
  // Authentication configuration for /metrics endpoint
  auth: {
    // Enable basic authentication
    enabled: boolean;
    // Basic auth username
    username: string | undefined;
    // Basic auth password
    password: string | undefined;
  };
  
  // IP whitelist for /metrics endpoint access
  ipWhitelist: string[];
  
  // Histogram bucket configuration for request duration
  histogramBuckets: number[];
  
  // Label names allowed for metrics (prevent high cardinality)
  allowedLabels: string[];
}

/**
 * Metric labels interface
 * Enforces low-cardinality labels to prevent metric explosion
 */
export interface MetricLabels {
  // HTTP method (GET, POST, PUT, DELETE, PATCH)
  method: string;
  
  // Normalized route path (e.g., /api/users/{id})
  route: string;
  
  // HTTP status code (200, 404, 500, etc.)
  status_code: number;
  
  // User role (patient, doctor, admin, anonymous)
  // Optional to support unauthenticated requests
  user_role?: string;
}

/**
 * Request timing information
 */
export interface RequestTiming {
  // Request start timestamp
  startTime: number;
  
  // Request end timestamp
  endTime: number;
  
  // Duration in seconds
  duration: number;
}

/**
 * Metrics endpoint authentication result
 */
export interface MetricsAuthResult {
  // Whether authentication succeeded
  authenticated: boolean;
  
  // Reason for authentication failure (if applicable)
  reason?: string;
}

/**
 * Route normalization options
 */
export interface RouteNormalizationOptions {
  // Replace numeric segments with {id}
  normalizeIds: boolean;
  
  // Replace UUID segments with {uuid}
  normalizeUuids: boolean;
  
  // Custom replacement patterns
  customPatterns?: Array<{
    pattern: RegExp;
    replacement: string;
  }>;
}
