# UPACI Monitoring Infrastructure

Grafana and Prometheus monitoring stack for the UPACI Appointment & Clinical Intelligence Platform.

## Overview

This monitoring solution provides real-time observability for the UPACI backend API, tracking uptime, performance, errors, and infrastructure health.

### Key Features

- ✅ **99.9% Uptime Tracking** - 30-day rolling window uptime monitoring
- ✅ **Latency Percentiles** - P50/P95/P99 request latency analysis
- ✅ **Error Rate Monitoring** - Real-time error rate with alerting
- ✅ **Resource Utilization** - CPU, memory, and Node.js metrics
- ✅ **RBAC Compliance** - Admin-only dashboard editing
- ✅ **Auto-Provisioning** - Dashboards and data sources configured automatically

## Quick Start

### 1. Configure Environment

```bash
cd monitoring
cp .env.example .env
```

Edit `.env` and set secure credentials:
- `GF_SECURITY_ADMIN_PASSWORD` - Change from default!
- `METRICS_USERNAME` and `METRICS_PASSWORD` - Credentials for backend `/metrics` endpoint

### 2. Start Monitoring Stack

```bash
docker-compose up -d
```

### 3. Access Grafana

Open http://localhost:3000 and login with credentials from `.env` (default: admin/admin).

Three dashboards are pre-configured:
- **UPACI System Health** - Uptime, latency, errors, resources
- **UPACI API Performance** - Endpoint-specific metrics
- **UPACI Infrastructure** - Node.js runtime health

### 4. Verify Prometheus

Check Prometheus is scraping backend metrics:
- Open http://localhost:9090/targets
- Verify `upaci-backend` target shows status **UP**

## Architecture

```
┌─────────────────┐      scrapes (15s)      ┌─────────────────┐
│  Prometheus     │◄─────────────────────────┤  Backend API    │
│  (Port 9090)    │                          │  /metrics       │
└────────┬────────┘                          └─────────────────┘
         │
         │ queries
         │
         ▼
┌─────────────────┐
│  Grafana        │
│  (Port 3000)    │
│  - Dashboards   │
│  - Alerting     │
└─────────────────┘
```

**Data Flow**:
1. Backend API exposes Prometheus metrics on `/metrics` endpoint
2. Prometheus scrapes metrics every 15 seconds
3. Grafana queries Prometheus and visualizes data in dashboards
4. Alert rules in Prometheus trigger on threshold breaches

## Directory Structure

```
monitoring/
├── .env.example                          # Environment variables template
├── docker-compose.yml                    # Container orchestration
├── README.md                             # This file
│
├── grafana/
│   ├── grafana.ini                       # Grafana server configuration
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── prometheus.yml            # Auto-configure Prometheus datasource
│   │   └── dashboards/
│   │       └── default.yml               # Dashboard auto-loading config
│   └── dashboards/
│       ├── upaci-system-health.json      # Main system dashboard
│       ├── upaci-api-performance.json    # API-specific metrics
│       └── upaci-infrastructure.json     # Node.js runtime metrics
│
├── prometheus/
│   ├── prometheus.yml                    # Scrape configuration
│   └── alerts.yml                        # Alert rules
│
├── scripts/
│   ├── import-dashboards.sh              # Bash dashboard import script
│   └── import-dashboards.ps1             # PowerShell dashboard import script
│
└── docs/
    ├── GRAFANA_SETUP.md                  # Installation and setup guide
    ├── DASHBOARD_GUIDE.md                # Dashboard usage and interpretation
    └── RBAC_CONFIGURATION.md             # Access control configuration
```

## Dashboards

### 1. UPACI System Health

Monitors overall platform reliability and performance.

**Key Panels**:
- **Uptime** - 30-day service availability (target: ≥99.9%)
- **Error Rate** - Percentage of 5xx errors (target: <0.5%)
- **Latency Percentiles** - P50/P95/P99 response times
- **Request Rate** - Throughput by status code (2xx/4xx/5xx)
- **CPU & Memory** - Resource utilization

**Use Cases**:
- SLA compliance verification
- Performance degradation detection
- Capacity planning

### 2. UPACI API Performance

Analyzes endpoint-specific metrics to identify bottlenecks.

**Key Panels**:
- **Top 10 Endpoints** - Highest traffic routes
- **Slowest Endpoints** - P95 latency leaderboard
- **Error Rate by Endpoint** - Isolate problematic routes
- **Throughput by Endpoint** - Traffic distribution

**Use Cases**:
- Identify optimization targets
- Troubleshoot specific endpoint issues
- Understand API usage patterns

### 3. UPACI Infrastructure

Monitors Node.js runtime health and infrastructure metrics.

**Key Panels**:
- **Heap Size** - V8 memory allocation and usage
- **Event Loop Lag** - Node.js responsiveness (target: <10ms)
- **GC Duration** - Garbage collection overhead
- **File Descriptors** - Open connections and handles
- **Active Handles & Requests** - Pending operations

**Use Cases**:
- Detect memory leaks
- Identify event loop blocking
- Optimize garbage collection

## Alert Rules

Prometheus alerts are configured for critical thresholds:

| Alert | Condition | Severity |
|-------|-----------|----------|
| HighErrorRate | Error rate >1% for 5 min | Critical |
| SlowResponseTime | P95 latency >2s for 5 min | Warning |
| ServiceDown | Backend unreachable for 1 min | Critical |
| HighCPUUsage | CPU >80% for 5 min | Warning |
| HighMemoryUsage | Memory >90% for 5 min | Warning |
| HighEventLoopLag | Event loop >50ms for 2 min | Warning |

Alerts appear in:
- Grafana Alerting UI (http://localhost:3000/alerting/list)
- Prometheus Alerts (http://localhost:9090/alerts)

To configure alert notifications (email, Slack, PagerDuty), see [GRAFANA_SETUP.md](docs/GRAFANA_SETUP.md#alerting).

## RBAC Configuration

Default security posture:

- ✅ Self-registration disabled (`allow_sign_up = false`)
- ✅ Anonymous access disabled
- ✅ Default role: Viewer (read-only)
- ✅ Admin role required for dashboard editing

**User Roles**:
- **Viewer** - View dashboards only (operations staff, stakeholders)
- **Editor** - View + edit dashboards (DevOps engineers)
- **Admin** - Full access including user management (platform admins)

For detailed access control configuration, see [RBAC_CONFIGURATION.md](docs/RBAC_CONFIGURATION.md).

## Backend Metrics Requirements

The monitoring stack expects the backend API to expose Prometheus metrics at `/metrics` endpoint.

**Required Metrics**:

```
# Service availability
up

# HTTP request metrics
http_requests_total{route, method, status_code}
http_request_duration_seconds_bucket{route, method, le}

# Connection metrics
active_connections

# Process metrics (prom-client collects these automatically)
process_cpu_seconds_total
process_resident_memory_bytes

# Node.js metrics (prom-client collects these automatically)
nodejs_heap_size_total_bytes
nodejs_heap_size_used_bytes
nodejs_eventloop_lag_seconds
nodejs_gc_duration_seconds_sum
process_open_fds
```

**Implementation** (Express + prom-client):

```typescript
import express from 'express';
import promClient from 'prom-client';

const app = express();

// Enable default metrics (CPU, memory, GC, etc.)
promClient.collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['route', 'method', 'status_code']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['route', 'method'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

See `server/docs/DATABASE_INTEGRATION.md` for full implementation details.

## Troubleshooting

### Dashboards Show "No Data"

**Diagnosis**:
1. Check Prometheus targets: http://localhost:9090/targets
2. Verify backend `/metrics` endpoint is accessible
3. Review Prometheus logs: `docker-compose logs prometheus`

**Solution**:
- Ensure backend is running and exposing metrics
- Check Prometheus basic auth credentials in `prometheus/prometheus.yml`
- Verify `BACKEND_API_URL` in `.env` is correct

### Grafana Won't Start

**Diagnosis**:
```bash
docker-compose logs grafana
```

**Common Issues**:
- Port 3000 already in use: Change `GF_SERVER_HTTP_PORT` in `.env`
- Permission issues: Check volume mount permissions
- Invalid configuration: Validate `grafana/grafana.ini` syntax

### Authentication Failed

**Solution**:
- Reset admin password: 
  ```bash
  docker-compose exec grafana grafana-cli admin reset-admin-password newpassword
  ```
- Check credentials in `.env` match login attempt
- Clear browser cookies/cache

### High Memory Usage

**Solution**:
- Reduce Prometheus retention: Edit `PROMETHEUS_RETENTION` in `.env` (default 30d)
- Decrease scrape interval in `prometheus/prometheus.yml` (e.g., 30s)
- Increase Docker resource limits

For more troubleshooting, see [GRAFANA_SETUP.md](docs/GRAFANA_SETUP.md#troubleshooting).

## Import Dashboards Manually

Use the import scripts if dashboards aren't auto-loading:

**Linux/macOS**:
```bash
cd monitoring/scripts
chmod +x import-dashboards.sh
./import-dashboards.sh http://localhost:3000 admin yourpassword
```

**Windows**:
```powershell
cd monitoring\scripts
.\import-dashboards.ps1 -GrafanaUrl "http://localhost:3000" -AdminUser "admin" -AdminPassword "yourpassword"
```

## Production Deployment

For production environments:

### Security Hardening
- [ ] Change all default passwords
- [ ] Enable HTTPS/TLS (configure reverse proxy)
- [ ] Implement SSO with MFA (LDAP, OAuth, SAML)
- [ ] Enable audit logging
- [ ] Restrict network access (firewall rules)
- [ ] Use secrets management (Vault, AWS Secrets Manager)

### High Availability
- [ ] Deploy multiple Prometheus instances (federation)
- [ ] Use remote storage for long-term retention (Thanos, Cortex)
- [ ] Configure Grafana with external database (PostgreSQL)
- [ ] Set up load balancer for Grafana

### Backup & Recovery
- [ ] Automate dashboard backups (CI/CD pipeline)
- [ ] Store configurations in version control
- [ ] Configure persistent volumes for data
- [ ] Test restore procedures regularly

### Monitoring the Monitoring
- [ ] Set up health checks for Grafana and Prometheus
- [ ] Configure external uptime monitoring (Pingdom, StatusCake)
- [ ] Set up alerts for monitoring stack failures
- [ ] Monitor resource usage of monitoring containers

See [GRAFANA_SETUP.md](docs/GRAFANA_SETUP.md#production-deployment) for detailed production guidance.

## Maintenance

### Weekly Tasks
- Review alert history
- Check dashboard relevance
- Verify data retention is working

### Monthly Tasks
- Review user access (remove inactive users)
- Rotate credentials
- Update Grafana/Prometheus versions
- Archive old metrics if needed

### Quarterly Tasks
- Conduct access review audit
- Review and update alert thresholds
- Capacity planning based on trends
- Update documentation

## Documentation

- [GRAFANA_SETUP.md](docs/GRAFANA_SETUP.md) - Installation, configuration, deployment
- [DASHBOARD_GUIDE.md](docs/DASHBOARD_GUIDE.md) - Dashboard usage and metric interpretation
- [RBAC_CONFIGURATION.md](docs/RBAC_CONFIGURATION.md) - Access control and security

## Support

For issues or questions:

1. Check documentation in `docs/` directory
2. Review Grafana logs: `docker-compose logs grafana`
3. Review Prometheus logs: `docker-compose logs prometheus`
4. Consult official documentation:
   - [Grafana Docs](https://grafana.com/docs/)
   - [Prometheus Docs](https://prometheus.io/docs/)

## License

Part of the UPACI Appointment & Clinical Intelligence Platform.
