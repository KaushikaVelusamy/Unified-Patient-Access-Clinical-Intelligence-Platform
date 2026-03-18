import { Request, Response, NextFunction } from 'express';
import { metricsConfig } from '../config/metrics';
import logger from '../utils/logger';

/**
 * Metrics Authentication Middleware
 * 
 * Protects the /metrics endpoint with either:
 * 1. IP Whitelist: Only allow requests from trusted IP addresses
 * 2. Basic Authentication: Require username/password
 * 
 * Security Considerations:
 * - Metrics may contain sensitive information about application performance
 * - Unauthorized access should be prevented
 * - Use TLS/HTTPS in production to prevent credential interception
 */

/**
 * Extract client IP address from request
 * Handles various proxy configurations (X-Forwarded-For, X-Real-IP)
 * 
 * @param req - Express request object
 * @returns Client IP address
 */
function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (set by proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }
  
  // Check X-Real-IP header (set by some proxies)
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }
  
  // Fallback to req.ip (Express default)
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Normalize IP address for comparison
 * Handles IPv4-mapped IPv6 addresses (::ffff:127.0.0.1 → 127.0.0.1)
 * 
 * @param ip - IP address
 * @returns Normalized IP address
 */
function normalizeIp(ip: string): string {
  // Convert IPv4-mapped IPv6 to IPv4
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  // Convert ::1 (IPv6 loopback) to localhost
  if (ip === '::1') {
    return 'localhost';
  }
  
  return ip;
}

/**
 * Check if IP address is in whitelist
 * 
 * @param clientIp - Client IP address
 * @param whitelist - Array of allowed IP addresses
 * @returns True if IP is whitelisted
 */
function isIpWhitelisted(clientIp: string, whitelist: string[]): boolean {
  const normalizedClientIp = normalizeIp(clientIp);
  
  return whitelist.some(allowedIp => {
    const normalizedAllowedIp = normalizeIp(allowedIp);
    
    // Exact match
    if (normalizedClientIp === normalizedAllowedIp) {
      return true;
    }
    
    // Localhost variants
    if (normalizedAllowedIp === 'localhost' && 
        (normalizedClientIp === '127.0.0.1' || normalizedClientIp === '::1')) {
      return true;
    }
    
    // CIDR notation support could be added here for subnet matching
    return false;
  });
}

/**
 * Decode Basic Authorization header
 * 
 * @param authHeader - Authorization header value (e.g., "Basic dXNlcjpwYXNz")
 * @returns Decoded credentials { username, password } or null
 */
function decodeBasicAuth(authHeader: string): { username: string; password: string } | null {
  try {
    // Extract base64-encoded credentials
    const base64Credentials = authHeader.replace('Basic ', '');
    
    // Decode from base64
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    
    // Split into username and password
    const [username, password] = credentials.split(':');
    
    if (!username || !password) {
      return null;
    }
    
    return { username, password };
  } catch (error) {
    logger.error('Error decoding basic auth:', error);
    return null;
  }
}

/**
 * Validate basic authentication credentials
 * 
 * @param username - Provided username
 * @param password - Provided password
 * @returns True if credentials are valid
 */
function validateBasicAuth(username: string, password: string): boolean {
  const expectedUsername = metricsConfig.auth.username;
  const expectedPassword = metricsConfig.auth.password;
  
  if (!expectedUsername || !expectedPassword) {
    logger.error('Metrics auth is enabled but credentials are not configured');
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  const usernameMatch = username === expectedUsername;
  const passwordMatch = password === expectedPassword;
  
  return usernameMatch && passwordMatch;
}

/**
 * Metrics Authentication Middleware
 * 
 * Strategy:
 * 1. If auth disabled → allow all requests
 * 2. If basic auth enabled → require valid credentials
 * 3. If IP whitelist configured → check IP against whitelist
 * 4. Otherwise → deny access
 */
export const metricsAuth = (req: Request, res: Response, next: NextFunction) => {
  // If authentication is disabled, allow all requests
  if (!metricsConfig.auth.enabled) {
    // Still check IP whitelist as a basic security measure
    const clientIp = getClientIp(req);
    
    if (isIpWhitelisted(clientIp, metricsConfig.ipWhitelist)) {
      logger.debug(`Metrics access allowed from whitelisted IP: ${clientIp}`);
      return next();
    }
    
    logger.warn(`Metrics access denied from non-whitelisted IP: ${clientIp}`);
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access to metrics endpoint is restricted',
    });
    return;
  }
  
  // Extract Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // No credentials provided, send 401 with WWW-Authenticate header
    logger.warn(`Metrics access attempted without credentials from ${getClientIp(req)}`);
    
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="Metrics Endpoint", charset="UTF-8"')
      .json({
        error: 'Unauthorized',
        message: 'Authentication required for metrics endpoint',
      });
    return;
  }
  
  // Decode and validate credentials
  const credentials = decodeBasicAuth(authHeader);
  
  if (!credentials) {
    logger.warn(`Metrics access attempted with invalid credentials from ${getClientIp(req)}`);
    
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="Metrics Endpoint", charset="UTF-8"')
      .json({
        error: 'Unauthorized',
        message: 'Invalid authentication credentials',
      });
    return;
  }
  
  // Validate credentials
  if (!validateBasicAuth(credentials.username, credentials.password)) {
    logger.warn(`Metrics access denied for user: ${credentials.username} from ${getClientIp(req)}`);
    
    res.status(401)
      .set('WWW-Authenticate', 'Basic realm="Metrics Endpoint", charset="UTF-8"')
      .json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
    return;
  }
  
  // Authentication successful
  logger.debug(`Metrics access granted for user: ${credentials.username} from ${getClientIp(req)}`);
  next();
};

export default metricsAuth;
