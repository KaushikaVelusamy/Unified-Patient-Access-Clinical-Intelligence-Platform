# Prometheus Setup Guide

This guide explains how to set up Prometheus monitoring for the Clinical Appointment Platform backend API.

## Overview

The application exposes metrics in Prometheus format at the `/metrics` endpoint, which can be scraped by a Prometheus server for monitoring and alerting.

## Features

- **Automatic Metric Collection**: All HTTP requests are automatically tracked
- **Low-Cardinality Labels**: Labels are restricted to prevent metric explosion
- **Secure Access**: Metrics endpoint is protected by IP whitelist or basic authentication
- **Node.js Metrics**: Includes default Node.js metrics (memory, CPU, event loop)
- **Custom Metrics**: Support for application-specific metrics (database queries, cache hits)

## Metrics Endpoint

### URL
```
http://localhost:3001/metrics
```

### Authentication

The metrics endpoint supports two authentication methods:

#### 1. IP Whitelist (Default)
Access is restricted to specific IP addresses defined in `METRICS_IP_WHITELIST`.

```bash
# .env
METRICS_AUTH_ENABLED=false
METRICS_IP_WHITELIST=127.0.0.1,::1,10.0.0.5
```

#### 2. Basic Authentication (Recommended for Production)
Requires username and password for access.

```bash
# .env
METRICS_AUTH_ENABLED=true
METRICS_AUTH_USER=admin
METRICS_AUTH_PASS=secure_password_here
```

### Testing the Metrics Endpoint

#### With IP Whitelist
```bash
curl http://localhost:3001/metrics
```

#### With Basic Authentication
```bash
curl -u admin:secure_password_here http://localhost:3001/metrics
```

#### Expected Response
```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.01"} 45
http_request_duration_seconds_bucket{method="GET",route="/api/users",status_code="200",user_role="patient",le="0.05"} 98
...

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/users",status_code="200",user_role="patient"} 100
...

# HELP active_connections Number of active HTTP connections
# TYPE active_connections gauge
active_connections 12
```

## Prometheus Server Setup

### 1. Install Prometheus

#### Docker
```bash
docker pull prom/prometheus:latest
```

#### Linux
```bash
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-2.45.0.linux-amd64.tar.gz
cd prometheus-2.45.0.linux-amd64
```

#### macOS
```bash
brew install prometheus
```

#### Windows
Download from: https://prometheus.io/download/

### 2. Configure Prometheus

Create or edit `prometheus.yml`:

```yaml
# Global configuration
global:
  scrape_interval: 15s     # Scrape targets every 15 seconds
  evaluation_interval: 15s # Evaluate rules every 15 seconds
  
  # Attach these labels to all time series or alerts
  external_labels:
    monitor: 'clinical-appointment-platform'
    environment: 'production'

# Alertmanager configuration (optional)
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - 'alertmanager:9093'

# Load rules once and periodically evaluate them
rule_files:
  # - "alert_rules.yml"

# Scrape configurations
scrape_configs:
  # Backend API metrics
  - job_name: 'upaci-backend'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/metrics'
    scheme: 'http'
    
    # Basic authentication (if enabled)
    basic_auth:
      username: 'admin'
      password: 'secure_password_here'
    
    # Static targets
    static_configs:
      - targets: ['localhost:3001']
        labels:
          service: 'backend-api'
          environment: 'development'
    
    # Relabeling (optional)
    metric_relabel_configs:
      # Drop metrics with specific labels
      - source_labels: [__name__]
        regex: 'nodejs_version_info'
        action: drop
```

### 3. Start Prometheus Server

#### Docker
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:latest
```

#### Direct Installation
```bash
./prometheus --config.file=prometheus.yml
```

### 4. Verify Prometheus

1. Open Prometheus UI: http://localhost:9090
2. Go to Status → Targets
3. Verify `upaci-backend` target is UP
4. Query metrics: `http_requests_total`

## Alert Rules (Optional)

Create `alert_rules.yml`:

```yaml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route)
          /
          sum(rate(http_requests_total[5m])) by (route)
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.route }}"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.route }}"
      
      # Slow requests
      - alert: SlowRequests
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow requests on {{ $labels.route }}"
          description: "95th percentile latency is {{ $value }}s on {{ $labels.route }}"
      
      # High CPU usage
      - alert: HighCPUUsage
        expr: process_cpu_seconds_total > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) > 0.90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
      
      # Event loop lag
      - alert: HighEventLoopLag
        expr: nodejs_eventloop_lag_seconds > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High event loop lag"
          description: "Event loop lag is {{ $value }}s"
```

## Grafana Integration (Optional)

### 1. Install Grafana

#### Docker
```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana:latest
```

### 2. Add Prometheus Data Source

1. Open Grafana: http://localhost:3000 (default login: admin/admin)
2. Go to Configuration → Data Sources
3. Click "Add data source"
4. Select "Prometheus"
5. Set URL: http://localhost:9090
6. Click "Save & Test"

### 3. Import Dashboard

Create a custom dashboard or import community dashboards:

#### Sample Dashboard JSON

```json
{
  "dashboard": {
    "title": "UPACI Backend Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{ method }} {{ route }}"
        }]
      },
      {
        "title": "Request Duration (95th percentile)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{ route }}"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
          "legendFormat": "{{ route }}"
        }]
      },
      {
        "title": "Active Connections",
        "targets": [{
          "expr": "active_connections",
          "legendFormat": "Active"
        }]
      }
    ]
  }
}
```

## Useful PromQL Queries

### Request Rate
```promql
# Overall request rate
rate(http_requests_total[5m])

# Request rate by route
sum(rate(http_requests_total[5m])) by (route)

# Request rate by method
sum(rate(http_requests_total[5m])) by (method)
```

### Response Time
```promql
# 50th percentile (median)
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

# 95th percentile
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

### Error Rate
```promql
# Overall error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m]))

# Error rate by route
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route)
/ sum(rate(http_requests_total[5m])) by (route)
```

### Resource Usage
```promql
# Memory usage
nodejs_heap_size_used_bytes

# Memory usage percentage
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100

# CPU usage
rate(process_cpu_seconds_total[5m])

# Event loop lag
nodejs_eventloop_lag_seconds
```

## Best Practices

### 1. Label Cardinality
- ✅ **Use**: method, route, status_code, user_role
- ❌ **Avoid**: user_id, request_id, session_id, timestamp

### 2. Histogram Buckets
- Adjust buckets based on your application's response time characteristics
- Current buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5] seconds
- Customize in `server/src/config/metrics.ts`

### 3. Scrape Interval
- Production: 15-30 seconds
- Development: 5-15 seconds
- High-frequency metrics: Consider using Prometheus pushgateway

### 4. Retention
- Default: 15 days
- Increase for long-term analysis
- Configure in Prometheus: `--storage.tsdb.retention.time=90d`

### 5. Security
- Always use basic authentication in production
- Use TLS/HTTPS for metrics endpoint
- Whitelist Prometheus server IP only
- Rotate credentials regularly

## Troubleshooting

### Metrics Endpoint Returns 401
- Check `METRICS_AUTH_ENABLED` is false OR provide valid credentials
- Verify IP is in `METRICS_IP_WHITELIST`

### Metrics Endpoint Returns 403
- Your IP is not whitelisted
- Add your IP to `METRICS_IP_WHITELIST` in `.env`

### Prometheus Can't Scrape
- Verify backend is running: `curl http://localhost:3001/metrics`
- Check Prometheus server can reach backend (firewall, network)
- Verify basic_auth credentials match `.env` configuration
- Check Prometheus logs: `docker logs prometheus`

### High Cardinality Warning
- Review labels in metrics
- Ensure route normalization is working (/api/users/123 → /api/users/{id})
- Remove user_id or request_id labels

### Missing Metrics
- Check metrics are registered in `metricsRegistry.ts`
- Verify metricsCollector middleware is registered in `app.ts`
- Ensure requests are hitting the backend

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [prom-client GitHub](https://github.com/siimon/prom-client)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)

---

**Last Updated**: March 18, 2026  
**Version**: 1.0.0  
**Maintained by**: Clinical Appointment Platform Team
