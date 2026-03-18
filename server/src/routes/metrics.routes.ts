import { Router, Request, Response } from 'express';
import { getMetrics, getContentType } from '../utils/metricsRegistry';
import logger from '../utils/logger';

/**
 * Metrics Routes
 * 
 * Provides Prometheus-formatted metrics endpoint
 * Protected by metricsAuth middleware (applied in routes/index.ts)
 */

const router = Router();

/**
 * GET /metrics
 * 
 * Returns all collected metrics in Prometheus exposition format
 * 
 * Response format:
 * ```
 * # HELP http_request_duration_seconds Duration of HTTP requests in seconds
 * # TYPE http_request_duration_seconds histogram
 * http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.01"} 45
 * http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.05"} 98
 * http_request_duration_seconds_sum{method="GET",route="/api/users",status_code="200",user_role="patient"} 3.456
 * http_request_duration_seconds_count{method="GET",route="/api/users",status_code="200",user_role="patient"} 100
 * 
 * # HELP http_requests_total Total number of HTTP requests
 * # TYPE http_requests_total counter
 * http_requests_total{method="GET",route="/api/users",status_code="200",user_role="patient"} 100
 * 
 * # HELP active_connections Number of active HTTP connections
 * # TYPE active_connections gauge
 * active_connections 12
 * ```
 * 
 * @returns Prometheus-formatted metrics
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Set content type for Prometheus
    res.set('Content-Type', getContentType());
    
    // Get metrics from registry
    const metrics = await getMetrics();
    
    // Send metrics response
    res.end(metrics);
    
    logger.debug('Metrics endpoint accessed successfully');
  } catch (error) {
    logger.error('Error retrieving metrics:', error);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve metrics',
    });
  }
});

/**
 * GET /metrics/health
 * 
 * Health check endpoint to verify metrics collection is working
 * Returns summary statistics about collected metrics
 * 
 * @returns Metrics health status
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const metrics = await getMetrics();
    
    // Count number of metric families
    const metricFamilies = metrics.split('# HELP').length - 1;
    
    // Count number of metric samples
    const metricSamples = metrics.split('\n').filter(line => {
      return line && !line.startsWith('#') && line.trim().length > 0;
    }).length;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        families: metricFamilies,
        samples: metricSamples,
      },
    });
    
    logger.debug('Metrics health check successful');
  } catch (error) {
    logger.error('Metrics health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Metrics collection is not functioning properly',
    });
  }
});

export default router;
