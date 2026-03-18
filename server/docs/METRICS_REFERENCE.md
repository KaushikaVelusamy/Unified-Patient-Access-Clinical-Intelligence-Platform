# Metrics Reference Guide

Complete reference for all Prometheus metrics exported by the Clinical Appointment Platform backend API.

## Table of Contents

1. [HTTP Metrics](#http-metrics)
2. [Node.js Metrics](#nodejs-metrics)
3. [Custom Application Metrics](#custom-application-metrics)
4. [Label Definitions](#label-definitions)
5. [Example Queries](#example-queries)

---

## HTTP Metrics

### http_request_duration_seconds

**Type**: Histogram  
**Description**: Measures the duration of HTTP requests in seconds  
**Purpose**: Analyze request latency, calculate percentiles (p50, p95, p99), identify slow endpoints

**Labels**:
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- `route`: Normalized route path (e.g., `/api/users/{id}`)
- `status_code`: HTTP status code (200, 201, 400, 401, 403, 404, 500, etc.)
- `user_role`: User role making the request (`patient`, `doctor`, `admin`, `anonymous`)

**Buckets**: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] seconds

**Example Values**:
```prometheus
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="0.01"} 45
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="0.05"} 98
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="0.1"} 125
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="0.5"} 135
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="1"} 138
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="2"} 140
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="5"} 140
http_request_duration_seconds_bucket{method="GET",route="/api/appointments",status_code="200",user_role="patient",le="+Inf"} 140
http_request_duration_seconds_sum{method="GET",route="/api/appointments",status_code="200",user_role="patient"} 8.765
http_request_duration_seconds_count{method="GET",route="/api/appointments",status_code="200",user_role="patient"} 140
```

**Use Cases**:
- Calculate 95th percentile response time
- Identify slow endpoints
- Monitor SLA compliance (e.g., 99% of requests < 500ms)
- Compare performance across routes and user roles

---

### http_requests_total

**Type**: Counter  
**Description**: Total count of HTTP requests  
**Purpose**: Track request volume, calculate request rate, measure error rate

**Labels**:
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- `route`: Normalized route path (e.g., `/api/users/{id}`)
- `status_code`: HTTP status code (200, 201, 400, 401, 403, 404, 500, etc.)
- `user_role`: User role making the request (`patient`, `doctor`, `admin`, `anonymous`)

**Example Values**:
```prometheus
http_requests_total{method="GET",route="/api/appointments",status_code="200",user_role="patient"} 1450
http_requests_total{method="POST",route="/api/appointments",status_code="201",user_role="patient"} 320
http_requests_total{method="GET",route="/api/users/{id}",status_code="200",user_role="doctor"} 890
http_requests_total{method="GET",route="/api/appointments",status_code="401",user_role="anonymous"} 45
http_requests_total{method="POST",route="/api/appointments",status_code="400",user_role="patient"} 12
http_requests_total{method="GET",route="/api/appointments",status_code="500",user_role="patient"} 3
```

**Use Cases**:
- Calculate requests per second (RPS)
- Monitor traffic patterns by route
- Calculate error rate (5xx / total requests)
- Track unauthorized access attempts
- Measure API usage by user role

---

### active_connections

**Type**: Gauge  
**Description**: Current number of active HTTP connections being processed  
**Purpose**: Monitor server load, detect traffic spikes, assess capacity

**Labels**: None (global metric)

**Example Values**:
```prometheus
active_connections 12
```

**Use Cases**:
- Monitor real-time server load
- Detect traffic spikes
- Assess capacity and scaling needs
- Alert on high concurrent connections

---

## Node.js Metrics

### nodejs_heap_size_total_bytes

**Type**: Gauge  
**Description**: Total heap size allocated by V8 (in bytes)  
**Purpose**: Monitor memory allocation

**Example**: `nodejs_heap_size_total_bytes 125829120` (120 MB)

---

### nodejs_heap_size_used_bytes

**Type**: Gauge  
**Description**: Heap memory currently used by V8 (in bytes)  
**Purpose**: Monitor memory usage, detect memory leaks

**Example**: `nodejs_heap_size_used_bytes 89456640` (85 MB)

---

### nodejs_external_memory_bytes

**Type**: Gauge  
**Description**: Memory used by C++ objects bound to JavaScript objects (in bytes)  
**Purpose**: Monitor external memory usage (buffers, streams)

**Example**: `nodejs_external_memory_bytes 2457600` (2.4 MB)

---

### nodejs_heap_space_size_total_bytes

**Type**: Gauge  
**Description**: Total heap space size by space name  
**Labels**: `space` (new_space, old_space, code_space, map_space, large_object_space)

**Example**:
```prometheus
nodejs_heap_space_size_total_bytes{space="new_space"} 16777216
nodejs_heap_space_size_total_bytes{space="old_space"} 104857600
nodejs_heap_space_size_total_bytes{space="code_space"} 2097152
```

---

### nodejs_heap_space_size_used_bytes

**Type**: Gauge  
**Description**: Used heap space size by space name  
**Labels**: `space` (new_space, old_space, code_space, map_space, large_object_space)

---

### nodejs_heap_space_size_available_bytes

**Type**: Gauge  
**Description**: Available heap space by space name  
**Labels**: `space`

---

### nodejs_version_info

**Type**: Gauge  
**Description**: Node.js version information  
**Labels**: `version` (Node.js version), `major`, `minor`, `patch`

**Example**:
```prometheus
nodejs_version_info{version="v20.11.0",major="20",minor="11",patch="0"} 1
```

---

### nodejs_gc_duration_seconds

**Type**: Histogram  
**Description**: Garbage collection duration by GC type  
**Labels**: `kind` (major, minor, incremental, weakcb)

**Buckets**: [0.001, 0.01, 0.1, 1, 2, 5]

**Example**:
```prometheus
nodejs_gc_duration_seconds_bucket{kind="major",le="0.001"} 0
nodejs_gc_duration_seconds_bucket{kind="major",le="0.01"} 5
nodejs_gc_duration_seconds_bucket{kind="major",le="0.1"} 12
nodejs_gc_duration_seconds_sum{kind="major"} 0.234
nodejs_gc_duration_seconds_count{kind="major"} 12
```

---

### nodejs_eventloop_lag_seconds

**Type**: Gauge  
**Description**: Event loop lag in seconds  
**Purpose**: Detect event loop blocking, monitor Node.js responsiveness

**Example**: `nodejs_eventloop_lag_seconds 0.005` (5ms lag)

**Warning**: High values (>100ms) indicate event loop blocking, which degrades performance

---

### process_cpu_seconds_total

**Type**: Counter  
**Description**: Total CPU time consumed by the process (in seconds)  
**Purpose**: Monitor CPU usage

**Example**: `process_cpu_seconds_total 45.67`

---

### process_resident_memory_bytes

**Type**: Gauge  
**Description**: Resident memory size (RSS) in bytes  
**Purpose**: Monitor total memory footprint

**Example**: `process_resident_memory_bytes 134217728` (128 MB)

---

### process_start_time_seconds

**Type**: Gauge  
**Description**: Unix timestamp when the process started  
**Purpose**: Calculate uptime

**Example**: `process_start_time_seconds 1710763200`

---

## Custom Application Metrics

### db_query_duration_seconds

**Type**: Histogram  
**Description**: Duration of database queries in seconds  
**Purpose**: Monitor database performance, identify slow queries

**Labels**:
- `query_type`: Type of query (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- `table`: Database table name
- `operation`: Operation name (e.g., `getUserById`, `createAppointment`)

**Buckets**: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]

**Status**: Available for future use

---

### cache_hits_total

**Type**: Counter  
**Description**: Total number of cache hits  
**Purpose**: Monitor cache effectiveness

**Labels**:
- `cache_key_type`: Type of cache key (`user`, `appointment`, `provider`, `queue`)

**Status**: Available for future use

---

### cache_misses_total

**Type**: Counter  
**Description**: Total number of cache misses  
**Purpose**: Monitor cache effectiveness

**Labels**:
- `cache_key_type`: Type of cache key

**Status**: Available for future use

---

## Label Definitions

### method
HTTP request method.

**Possible Values**:
- `GET`: Read operation
- `POST`: Create operation
- `PUT`: Full update operation
- `PATCH`: Partial update operation
- `DELETE`: Delete operation
- `OPTIONS`: CORS preflight request

---

### route
Normalized route path with placeholders for dynamic segments.

**Examples**:
- `/api/users/{id}` (original: `/api/users/123`)
- `/api/appointments/{uuid}` (original: `/api/appointments/550e8400-e29b-41d4-a716-446655440000`)
- `/api/reports/{date}` (original: `/api/reports/2024-03-18`)

**Purpose**: Prevents high-cardinality issues by grouping similar routes

---

### status_code
HTTP response status code.

**Common Values**:
- `200`: OK (successful GET, PUT, PATCH)
- `201`: Created (successful POST)
- `204`: No Content (successful DELETE)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (server error)
- `503`: Service Unavailable (dependency failure)

---

### user_role
Role of the authenticated user making the request.

**Possible Values**:
- `patient`: Patient user
- `doctor`: Healthcare provider
- `admin`: System administrator
- `anonymous`: Unauthenticated user

---

## Example Queries

### Request Rate

```promql
# Overall request rate (requests per second)
rate(http_requests_total[5m])

# Request rate by route
sum(rate(http_requests_total[5m])) by (route)

# Request rate by method
sum(rate(http_requests_total[5m])) by (method)

# Request rate for specific route
rate(http_requests_total{route="/api/appointments"}[5m])
```

---

### Response Time

```promql
# 50th percentile (median) response time
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile response time
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile by route
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

---

### Error Rate

```promql
# Overall error rate (%)
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# Error rate by route
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route)
/ sum(rate(http_requests_total[5m])) by (route) * 100

# Count of errors in last hour
count_over_time(http_requests_total{status_code=~"5.."}[1h])

# 4xx error rate (client errors)
sum(rate(http_requests_total{status_code=~"4.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100
```

---

### Traffic Patterns

```promql
# Total requests by user role
sum(http_requests_total) by (user_role)

# Requests per minute
sum(rate(http_requests_total[1m])) * 60

# Top 5 routes by traffic
topk(5, sum(rate(http_requests_total[5m])) by (route))

# Traffic distribution by HTTP method
sum(http_requests_total) by (method)
```

---

### Resource Usage

```promql
# Memory usage percentage
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100

# CPU usage rate (per second)
rate(process_cpu_seconds_total[5m])

# Event loop lag
nodejs_eventloop_lag_seconds

# Resident memory (MB)
process_resident_memory_bytes / 1024 / 1024

# GC pause time
rate(nodejs_gc_duration_seconds_sum[5m])
```

---

### Availability & Uptime

```promql
# Uptime (seconds)
time() - process_start_time_seconds

# Uptime (days)
(time() - process_start_time_seconds) / 86400

# Request success rate (non-5xx)
sum(rate(http_requests_total{status_code!~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100
```

---

## Alerting Thresholds

### Suggested Alert Rules

| Metric | Threshold | Severity | Description |
|--------|-----------|----------|-------------|
| Error Rate | > 5% | Critical | High error rate |
| P95 Latency | > 2s | Warning | Slow response time |
| P99 Latency | > 5s | Critical | Very slow response time |
| Memory Usage | > 90% | Warning | High memory usage |
| Event Loop Lag | > 100ms | Warning | Event loop blocking |
| CPU Usage | > 80% | Warning | High CPU usage |
| Active Connections | > 100 | Warning | High load |

---

## Dashboard Examples

### Key Performance Indicators (KPIs)

1. **Request Rate**: `sum(rate(http_requests_total[5m]))`
2. **Error Rate**: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
3. **P95 Latency**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
4. **Active Connections**: `active_connections`
5. **Memory Usage**: `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100`

### Traffic Dashboard

- Request rate by route (bar chart)
- Request distribution by method (pie chart)
- Top 10 slowest endpoints (table)
- Error rate over time (line chart)

### Performance Dashboard

- P50/P95/P99 latency trends (line chart)
- Response time heatmap by route
- Database query duration (histogram)
- Cache hit rate (gauge)

### Resource Dashboard

- Heap memory usage (line chart)
- Event loop lag (line chart)
- GC pause time (histogram)
- CPU usage (gauge)

---

**Last Updated**: March 18, 2026  
**Version**: 1.0.0  
**Maintained by**: Clinical Appointment Platform Team
