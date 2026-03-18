# Database Integration Guide

## Overview

This document describes the PostgreSQL database integration for the Clinical Appointment Platform backend API. The integration uses `node-postgres` (pg) library with connection pooling, automatic retry logic, and comprehensive error handling.

## Table of Contents

- [Architecture](#architecture)
- [Configuration](#configuration)
- [Connection Pool](#connection-pool)
- [Health Checks](#health-checks)
- [Query Execution](#query-execution)
- [Transactions](#transactions)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Troubleshooting](#troubleshooting)

## Architecture

### Components

1. **database.ts** - Connection pool configuration and management
2. **dbHealthCheck.ts** - Connection validation with retry logic
3. **database.types.ts** - TypeScript type definitions
4. **queryLogger.ts** - Development query logging utilities
5. **server.ts** - Database connection initialization on startup
6. **app.ts** - Health check endpoint with database status

### Connection Flow

```
Application Startup
  ↓
Environment Variable Validation (env.ts)
  ↓
Database Health Check (3 retries with exponential backoff)
  ↓
Connection Pool Initialization (max 20 connections)
  ↓
HTTP Server Start
  ↓
Health Check Endpoint Available (/api/health)
```

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upaci
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_URL=postgresql://postgres:your_password_here@localhost:5432/upaci
DB_SSL=false
DB_MAX_CONNECTIONS=20
```

**Variable Descriptions:**

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL server hostname | `localhost` |
| `DB_PORT` | PostgreSQL server port | `5432` |
| `DB_NAME` | Database name | `upaci` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | *Required* |
| `DB_URL` | Full connection URL | *Required* |
| `DB_SSL` | Enable SSL connection | `false` |
| `DB_MAX_CONNECTIONS` | Maximum pool connections | `20` |

### Pool Settings

The connection pool is configured with the following parameters:

- **Max Connections**: 20 (configurable via `DB_MAX_CONNECTIONS`)
- **Connection Timeout**: 5 seconds
- **Idle Timeout**: 10 seconds
- **SSL Mode**: Configurable (self-signed certificates allowed in dev)

## Connection Pool

### Importing the Pool

```typescript
import { pool, query, queryOne, getClient } from '@/config/database';
```

### Pool Statistics

Get real-time pool statistics:

```typescript
import { getPoolStats } from '@/config/database';

const stats = getPoolStats();
console.log(stats);
// {
//   totalCount: 5,    // Total clients in pool
//   idleCount: 3,     // Idle clients available
//   waitingCount: 0   // Queued requests waiting for client
// }
```

### Pool Events

The pool automatically logs the following events:

- **connect** - New client connected
- **acquire** - Client checked out from pool
- **release** - Client returned to pool
- **remove** - Client removed from pool
- **error** - Unexpected idle client error

## Health Checks

### Startup Health Check

The application performs a database health check on startup with:

- **3 retry attempts**
- **Exponential backoff**: 1s, 2s, 4s delays
- **Automatic process exit** if all retries fail

```typescript
import { performHealthCheck } from '@/utils/dbHealthCheck';

// Called automatically in server.ts
await performHealthCheck();
```

### Runtime Health Check

Check database status without retries:

```typescript
import { getConnectionStatus } from '@/utils/dbHealthCheck';

const status = await getConnectionStatus();
// {
//   status: 'ok' | 'error',
//   message: string,
//   timestamp: Date,
//   details?: {
//     host: string,
//     port: number,
//     database: string,
//     version: string
//   },
//   error?: string
// }
```

### Health Check Endpoint

**Endpoint**: `GET /api/health`

**Response** (200 OK):
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-03-18T10:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "database": {
    "connected": true,
    "host": "localhost",
    "port": 5432,
    "database": "upaci",
    "version": "PostgreSQL 15.8"
  },
  "pool": {
    "total": 5,
    "idle": 3,
    "waiting": 0
  }
}
```

**Response** (503 Service Unavailable):
```json
{
  "success": false,
  "status": "error",
  "timestamp": "2026-03-18T10:00:00.000Z",
  "uptime": 120.3,
  "environment": "development",
  "error": "Health check failed"
}
```

## Query Execution

### Simple Query

Execute a query and get all rows:

```typescript
import { query } from '@/config/database';

// With parameters
const users = await query<User>(
  'SELECT * FROM app.users WHERE role = $1',
  ['patient']
);

// Without parameters
const allUsers = await query<User>('SELECT * FROM app.users');
```

### Query One

Get the first row or null:

```typescript
import { queryOne } from '@/config/database';

const user = await queryOne<User>(
  'SELECT * FROM app.users WHERE id = $1',
  [userId]
);

if (user) {
  console.log(user.email);
}
```

### Direct Pool Query

Use the pool directly for more control:

```typescript
import { pool } from '@/config/database';

const result = await pool.query(
  'SELECT * FROM app.appointments WHERE patient_id = $1',
  [patientId]
);

console.log(result.rows);
console.log(result.rowCount);
```

## Transactions

### Basic Transaction

```typescript
import { getClient } from '@/config/database';

const client = await getClient();

try {
  await client.beginTransaction();

  await client.query('UPDATE app.users SET email = $1 WHERE id = $2', [newEmail, userId]);
  await client.query('INSERT INTO app.audit_logs (user_id, action) VALUES ($1, $2)', [userId, 'email_update']);

  await client.commit();
  console.log('Transaction committed successfully');
} catch (error) {
  await client.rollback();
  console.error('Transaction rolled back:', error);
  throw error;
} finally {
  client.release();
}
```

### Nested Transactions (Savepoints)

```typescript
const client = await getClient();

try {
  await client.beginTransaction();

  // First operation
  await client.query('INSERT INTO app.patients (...) VALUES (...)');

  // Savepoint
  await client.query('SAVEPOINT my_savepoint');

  try {
    // Risky operation
    await client.query('UPDATE app.appointments SET ...');
  } catch (error) {
    // Rollback to savepoint only
    await client.query('ROLLBACK TO SAVEPOINT my_savepoint');
    console.warn('Rolled back to savepoint');
  }

  // Commit entire transaction
  await client.commit();
} catch (error) {
  await client.rollback();
  throw error;
} finally {
  client.release();
}
```

## Error Handling

### Database Errors

All database errors extend the `DbError` interface:

```typescript
import { DbError } from '@/types/database.types';

try {
  await query('SELECT * FROM app.users WHERE id = $1', [userId]);
} catch (error) {
  const err = error as DbError;
  
  console.error('Database error:', {
    message: err.message,
    code: err.code,       // PostgreSQL error code (e.g., '23505')
    detail: err.detail,   // Additional error details
    hint: err.hint,       // PostgreSQL hint
    constraint: err.constraint  // Violated constraint name
  });
  
  // Handle specific error codes
  if (err.code === '23505') {
    // Unique constraint violation
    throw new Error('Record already exists');
  } else if (err.code === '23503') {
    // Foreign key violation
    throw new Error('Referenced record not found');
  }
}
```

### Common PostgreSQL Error Codes

| Code | Description | Example |
|------|-------------|---------|
| `23505` | Unique violation | Duplicate email address |
| `23503` | Foreign key violation | Invalid patient_id reference |
| `23502` | NOT NULL violation | Missing required field |
| `42P01` | Undefined table | Table doesn't exist |
| `42703` | Undefined column | Column doesn't exist |
| `ECONNREFUSED` | Connection refused | PostgreSQL not running |
| `28P01` | Invalid password | Wrong credentials |

## Logging

### Query Logging (Development Only)

In development mode, all queries are automatically logged with:

- SQL query text (truncated to 200 chars)
- Query parameters (sanitized)
- Execution time in milliseconds
- Timestamp

**Slow Query Detection**:
Queries taking > 1000ms are logged as warnings.

**Log Example**:
```
[2026-03-18 10:00:00] DEBUG: Query executed: {
  query: "SELECT * FROM app.users WHERE role = $1",
  params: ["patient"],
  duration: "45ms",
  rows: 10
}
```

### Sensitive Data Sanitization

Query parameters containing sensitive keywords are automatically redacted:

- `password` → `***REDACTED***`
- `token` → `***REDACTED***`
- `secret` → `***REDACTED***`
- `key` → `***REDACTED***`

### Manual Query Logging

```typescript
import { logQuery } from '@/utils/queryLogger';

const start = Date.now();
const result = await pool.query('SELECT * FROM app.users');
const executionTime = Date.now() - start;

logQuery({
  query: 'SELECT * FROM app.users',
  params: [],
  executionTime,
  timestamp: new Date()
});
```

## Graceful Shutdown

The application automatically closes database connections on shutdown:

```typescript
// Handled automatically in server.ts
process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});
```

**Shutdown Sequence**:
1. Receive SIGTERM or SIGINT signal
2. Stop accepting new HTTP requests
3. Close HTTP server
4. Close all database connections
5. Exit process

**Force Shutdown**: If graceful shutdown takes > 10 seconds, the process will force exit.

## Troubleshooting

### Connection Issues

**Error**: `ECONNREFUSED`

**Solutions**:
- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Windows Services
- Check host and port: `psql -h localhost -p 5432 -U postgres`
- Verify firewall rules allow port 5432

**Error**: `password authentication failed`

**Solutions**:
- Check `DB_USER` and `DB_PASSWORD` in `.env`
- Verify PostgreSQL `pg_hba.conf` allows password authentication
- Try connecting manually: `psql -h localhost -U postgres -d upaci`

**Error**: `database "upaci" does not exist`

**Solutions**:
- Create the database: `createdb -U postgres upaci`
- Run migrations: `cd database/scripts && ./run_migrations.sh`

### Pool Issues

**Error**: `TimeoutError: Query read timeout`

**Solutions**:
- Increase `connectionTimeoutMillis` in `database.ts`
- Check for slow queries with `EXPLAIN ANALYZE`
- Add indexes to frequently queried columns

**Error**: `sorry, too many clients already`

**Solutions**:
- Reduce `DB_MAX_CONNECTIONS` in `.env`
- Increase PostgreSQL `max_connections` in `postgresql.conf`
- Check for connection leaks (always `release()` clients)

### Query Issues

**Slow Queries** (>1000ms):

1. **Enable query logging** in development:
   ```typescript
   const result = await query('SELECT * FROM app.users');
   // Check logs for execution time
   ```

2. **Analyze query plan**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM app.users WHERE email = 'test@example.com';
   ```

3. **Add missing indexes**:
   ```sql
   CREATE INDEX idx_users_email ON app.users(email);
   ```

4. **Use partial indexes** for filtered queries:
   ```sql
   CREATE INDEX idx_active_users ON app.users(email) WHERE is_active = true;
   ```

### Debugging

**Enable debug logging**:

1. Set `LOG_LEVEL=debug` in `.env`
2. Restart server
3. Check logs in `logs/app.log`

**Check pool statistics**:

```typescript
import { getPoolStats } from '@/config/database';

setInterval(() => {
  const stats = getPoolStats();
  console.log('Pool stats:', stats);
}, 5000);
```

**Monitor active connections**:

```sql
SELECT 
  datname,
  count(*) as connections,
  max(state) as state
FROM pg_stat_activity
WHERE datname = 'upaci'
GROUP BY datname;
```

## Best Practices

1. **Always use parameterized queries** to prevent SQL injection
2. **Release clients** immediately after use in transactions
3. **Use transactions** for multi-step operations
4. **Monitor pool statistics** in production
5. **Set appropriate timeouts** based on query complexity
6. **Use indexes** on frequently queried columns
7. **Log slow queries** and optimize them
8. **Test connection retry** logic in staging
9. **Enable SSL** in production (`DB_SSL=true`)
10. **Rotate database passwords** regularly

## Examples

### User Management

```typescript
// Create user
const createUser = async (email: string, role: string) => {
  const result = await query<User>(
    'INSERT INTO app.users (email, role) VALUES ($1, $2) RETURNING *',
    [email, role]
  );
  return result[0];
};

// Get user by email
const getUserByEmail = async (email: string) => {
  return await queryOne<User>(
    'SELECT * FROM app.users WHERE email = $1',
    [email]
  );
};

// Update user
const updateUser = async (userId: number, data: Partial<User>) => {
  const result = await query<User>(
    'UPDATE app.users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [data.email, userId]
  );
  return result[0];
};

// Delete user
const deleteUser = async (userId: number) => {
  await query('DELETE FROM app.users WHERE id = $1', [userId]);
};
```

### Appointment Booking with Transaction

```typescript
const bookAppointment = async (patientId: number, doctorId: number, datetime: Date) => {
  const client = await getClient();

  try {
    await client.beginTransaction();

    // Check time slot availability
    const slot = await client.query(
      'SELECT * FROM app.time_slots WHERE doctor_id = $1 AND slot_date = $2 AND is_available = true FOR UPDATE',
      [doctorId, datetime]
    );

    if (slot.rowCount === 0) {
      throw new Error('Time slot not available');
    }

    // Create appointment
    const appointment = await client.query(
      'INSERT INTO app.appointments (patient_id, doctor_id, appointment_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [patientId, doctorId, datetime, 'confirmed']
    );

    // Mark slot as unavailable
    await client.query(
      'UPDATE app.time_slots SET is_available = false WHERE id = $1',
      [slot.rows[0].id]
    );

    // Create notification
    await client.query(
      'INSERT INTO app.notifications (user_id, type, message) VALUES ($1, $2, $3)',
      [patientId, 'appointment_confirmed', 'Your appointment has been confirmed']
    );

    await client.commit();
    return appointment.rows[0];
  } catch (error) {
    await client.rollback();
    throw error;
  } finally {
    client.release();
  }
};
```

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-15-main.log`
- Check application logs: `tail -f logs/app.log`
- Contact the development team

## Version History

- **v1.0.0** (2026-03-18) - Initial database integration with connection pooling
