# Redis Setup Guide - Upstash Redis Integration

This guide walks through setting up Upstash Redis for the Clinical Appointment and Intelligence Platform backend.

## Overview

The application uses **Upstash Redis** as a managed Redis service with:
- **TLS/SSL encryption** for secure connections
- **Automatic reconnection** with exponential backoff
- **Graceful fallback** to database queries when Redis is unavailable
- **Connection pooling** and keep-alive for optimal performance
- **Health monitoring** endpoints for operational visibility

## Why Upstash Redis?

- ✅ **Serverless**: Pay-per-request pricing, perfect for development and production
- ✅ **TLS by default**: Enterprise-grade security out of the box
- ✅ **Global replication**: Low-latency access from anywhere
- ✅ **Free tier**: 10,000 commands/day, sufficient for development
- ✅ **Redis 6+ compatible**: Latest Redis features and commands
- ✅ **No infrastructure management**: Fully managed service

## Prerequisites

- Node.js 20.x LTS or later
- npm or yarn package manager
- Upstash account (free tier available)

## Step 1: Create Upstash Account

1. Visit [Upstash Console](https://console.upstash.com/)
2. Sign up with GitHub, Google, or email
3. Verify your email address
4. Log in to the Upstash Console

## Step 2: Create Redis Database

1. In the Upstash Console, click **"Create Database"**
2. Configure your database:
   - **Name**: `clinical-appointment-dev` (or your preferred name)
   - **Type**: Select **Regional** for lower latency or **Global** for multi-region replication
   - **Region**: Choose the region closest to your application servers
   - **TLS**: Enabled by default (required)
   - **Eviction**: Select `allkeys-lru` (removes least recently used keys when memory is full)
3. Click **"Create"**

## Step 3: Get Connection Credentials

After creating your database:

1. Click on your database name to view details
2. In the **REST API** section, you'll find:
   - **Endpoint**: `https://your-endpoint.upstash.io`
   - **Port**: `6379`
   - **Password**: Your authentication token
3. Copy the **Redis Connection String** (format: `rediss://default:TOKEN@endpoint.upstash.io:6379`)

### Connection String Format

```
rediss://default:YOUR_TOKEN@your-endpoint.upstash.io:6379
```

Components:
- `rediss://`: Secure Redis protocol (TLS enabled)
- `default`: Default username
- `YOUR_TOKEN`: Your authentication token (password)
- `your-endpoint.upstash.io`: Your Upstash endpoint
- `6379`: Redis port

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env` in the `server/` directory:
   ```bash
   cp .env.example .env
   ```

2. Update the Redis configuration in `.env`:
   ```env
   # Redis Configuration (Upstash Redis with TLS)
   REDIS_URL=rediss://default:YOUR_TOKEN@your-endpoint.upstash.io:6379
   REDIS_TOKEN=YOUR_TOKEN
   REDIS_TLS=true
   REDIS_MAX_RETRIES=3
   ```

3. Replace `YOUR_TOKEN` and `your-endpoint.upstash.io` with your actual credentials

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Full connection string with TLS | `rediss://default:token@endpoint.upstash.io:6379` |
| `REDIS_TOKEN` | Authentication token (optional, included in URL) | `AYAbAA...` |
| `REDIS_TLS` | Enable TLS encryption (always true for Upstash) | `true` |
| `REDIS_MAX_RETRIES` | Maximum reconnection attempts | `3` |

## Step 5: Install Dependencies

The `ioredis` package is already installed in the project. If needed:

```bash
cd server
npm install ioredis@5.x
```

## Step 6: Test Connection

### Start the Server

```bash
cd server
npm run dev
```

### Expected Output

```
✓ Environment variables validated successfully
Validating environment variables...
Connecting to database...
✓ Database connected successfully
Connecting to Redis...
Initializing Redis connection to Upstash...
✓ Redis connected to Upstash
✓ Redis ready for commands
✓ Redis connection established
✓ Server running on port 3001
✓ Environment: development
✓ API available at: http://localhost:3001/api
✓ Health check: http://localhost:3001/api/health
```

### Test Health Endpoints

#### General Health Check (includes Redis)
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "uptime": 12.456,
  "environment": "development",
  "database": {
    "connected": true,
    "host": "localhost",
    "port": 5432,
    "database": "upaci",
    "version": "16.2"
  },
  "pool": {
    "total": 2,
    "idle": 1,
    "waiting": 0
  },
  "redis": {
    "connected": true,
    "latency": 45
  }
}
```

#### Redis-Specific Health Check
```bash
curl http://localhost:3001/api/health/redis
```

Expected response:
```json
{
  "success": true,
  "status": "connected",
  "timestamp": "2026-03-18T10:30:45.123Z",
  "redis": {
    "connected": true,
    "latency": 42,
    "uptime": 123
  }
}
```

## Step 7: Test Redis CLI (Optional)

### Using redis-cli with TLS

```bash
redis-cli -u rediss://default:YOUR_TOKEN@your-endpoint.upstash.io:6379 --tls

# Test connection
> PING
PONG

# Set a key
> SET test:key "Hello, Redis!"
OK

# Get a key
> GET test:key
"Hello, Redis!"

# Check TTL
> TTL test:key
(integer) -1

# Set with expiration
> SETEX test:expiring 60 "Expires in 60 seconds"
OK

# Delete a key
> DEL test:key
(integer) 1
```

### Using Upstash CLI

Install Upstash CLI:
```bash
npm install -g @upstash/cli
```

Connect to your database:
```bash
upstash redis connect your-database-id
```

## Architecture

### Connection Lifecycle

1. **Initialization**: Server starts → Redis client created with configuration
2. **Connection**: Client attempts to connect with TLS to Upstash
3. **Authentication**: Token-based authentication
4. **Ready**: Connection established, accepts commands
5. **Monitoring**: Health checks every request (lightweight)
6. **Graceful Degradation**: On failure, fallback to database queries
7. **Reconnection**: Automatic retry with exponential backoff (3 attempts)
8. **Shutdown**: Graceful disconnect on server shutdown

### Retry Strategy

| Attempt | Delay | Action |
|---------|-------|--------|
| 1 | 1 second | First reconnection attempt |
| 2 | 2 seconds | Second attempt |
| 3 | 4 seconds | Final attempt |
| Failed | N/A | Switch to database fallback |

### Fallback Mechanism

When Redis is unavailable:
- ✅ Application continues functioning normally
- ✅ All requests go directly to database
- ✅ Increased latency (no caching)
- ✅ Warning logged: "Redis unavailable - falling back to database queries"
- ✅ Health endpoint shows `redis.connected: false`

## Usage in Code

### Basic Cache Operations

```typescript
import redisClient from '../utils/redisClient';

// Check availability before using
if (redisClient.isAvailable) {
  // Set cache with TTL
  await redisClient.set('user:123', JSON.stringify(userData), { ttl: 3600 });
  
  // Get from cache
  const cached = await redisClient.get('user:123');
  if (cached) {
    return JSON.parse(cached);
  }
}

// Fallback to database if Redis unavailable
return await getUserFromDatabase(userId);
```

### Using Cache Middleware

```typescript
import { redisAvailable } from '../middleware/redisAvailable';

router.get('/appointments', redisAvailable, async (req, res) => {
  // req.redis is available if Redis is connected
  // req.redisAvailable is true if connected
  
  if (req.redisAvailable && req.redis) {
    const cached = await req.redis.get('appointments:all');
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  }
  
  // Fetch from database
  const appointments = await getAppointmentsFromDB();
  
  // Cache result if Redis available
  if (req.redisAvailable && req.redis) {
    await req.redis.set('appointments:all', JSON.stringify(appointments), { ttl: 300 });
  }
  
  res.json(appointments);
});
```

### Requiring Redis (Fail if Unavailable)

```typescript
import { requireRedis } from '../middleware/redisAvailable';

// This route returns 503 if Redis is down
router.get('/real-time/queue', requireRedis, async (req, res) => {
  // Redis is guaranteed to be available here
  const queueData = await req.redis!.get('queue:current');
  res.json(JSON.parse(queueData || '[]'));
});
```

## Monitoring and Operations

### Upstash Console Metrics

Monitor your Redis instance in the Upstash Console:
- **Commands/sec**: Request rate
- **Latency**: Average response time
- **Memory Usage**: Current memory consumption
- **Hit Rate**: Cache effectiveness
- **Active Connections**: Current connections

### Application Logs

Redis connection events are logged:
- `✓ Redis connected to Upstash`: Connection established
- `Redis reconnecting in Xms...`: Attempting reconnection
- `Redis connection error: ...`: Connection failed
- `⚠ Redis unavailable - falling back to database queries`: Fallback mode active
- `Redis disconnected successfully`: Clean shutdown

## Troubleshooting

### Issue: Connection Timeout

**Symptoms**: `Error: Connection timeout`

**Solutions**:
1. Check firewall/network allows outbound port 6379
2. Verify REDIS_URL is correct
3. Ensure TLS is enabled (`rediss://` not `redis://`)
4. Check Upstash database status in console

### Issue: Authentication Failed

**Symptoms**: `Error: NOAUTH Authentication required`

**Solutions**:
1. Verify REDIS_TOKEN is correct
2. Check token is included in REDIS_URL
3. Regenerate token in Upstash Console if needed

### Issue: Redis Unavailable but Application Works

**Behavior**: This is expected! The application gracefully degrades to database queries.

**Actions**:
1. Check `/api/health/redis` endpoint
2. Review server logs for connection errors
3. Verify Upstash database is running
4. Check environment variables

### Issue: High Latency

**Symptoms**: Slow cache operations

**Solutions**:
1. Choose a region closer to your application
2. Use Upstash Global for multi-region replication
3. Check Upstash Console metrics for database performance
4. Review network connectivity

## Production Considerations

### Security
- ✅ Always use TLS (`rediss://`)
- ✅ Store credentials in secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)
- ✅ Rotate tokens periodically
- ✅ Use environment-specific databases (dev, staging, prod)

### Performance
- ✅ Set appropriate TTL values to avoid stale data
- ✅ Use pipelining for bulk operations (enabled by default)
- ✅ Monitor hit rate and adjust caching strategy
- ✅ Choose closest region for lowest latency

### Monitoring
- ✅ Set up alerts for connection failures
- ✅ Monitor memory usage to avoid eviction
- ✅ Track cache hit/miss ratio
- ✅ Log fallback events for debugging

### Scaling
- ✅ Upgrade Upstash plan for higher throughput
- ✅ Use Upstash Global for multi-region distribution
- ✅ Implement cache warming for frequently accessed data
- ✅ Use Redis clustering for large datasets (Enterprise plan)

## Cost Optimization

### Free Tier
- 10,000 commands/day
- 256 MB storage
- TLS encryption included
- Perfect for development and small applications

### Pay-As-You-Go
- $0.20 per 100,000 commands
- Additional storage: $0.25/GB/month
- No minimum fees
- Automatic scaling

### Tips
- Set appropriate TTL to reduce storage costs
- Use cache warming during off-peak hours
- Monitor command usage in Upstash Console
- Clean up unused keys periodically

## References

- [Upstash Documentation](https://docs.upstash.com/redis)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [Redis Commands Reference](https://redis.io/commands/)
- [Upstash Pricing](https://upstash.com/pricing)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

## Support

- **Upstash Support**: [support@upstash.com](mailto:support@upstash.com)
- **Community Discord**: [Upstash Discord](https://discord.gg/upstash)
- **Documentation**: [docs.upstash.com](https://docs.upstash.com)

---

**Last Updated**: March 18, 2026  
**Version**: 1.0.0  
**Maintained by**: Clinical Appointment Platform Team
