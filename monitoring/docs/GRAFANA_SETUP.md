# Grafana Dashboard Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the UPACI monitoring stack with Grafana and Prometheus.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- Network access to backend API (default: `http://host.docker.internal:3001`)
- Minimum 2GB RAM available for containers

## Quick Start

### 1. Configure Environment

Copy the example environment file and customize:

```bash
cd monitoring
cp .env.example .env
```

Edit `.env` to set:
- `GF_SECURITY_ADMIN_USER` - Grafana admin username (default: admin)
- `GF_SECURITY_ADMIN_PASSWORD` - Grafana admin password (change from default!)
- `BACKEND_API_URL` - Backend metrics endpoint URL
- `METRICS_USERNAME` - Backend metrics auth username
- `METRICS_PASSWORD` - Backend metrics auth password

### 2. Start Monitoring Stack

```bash
docker-compose up -d
```

This starts:
- **Grafana** on http://localhost:3000
- **Prometheus** on http://localhost:9090

### 3. Verify Services

Check service health:

```bash
docker-compose ps
docker-compose logs grafana
docker-compose logs prometheus
```

### 4. Access Grafana

1. Navigate to http://localhost:3000
2. Login with credentials from `.env` (default: admin/admin)
3. Dashboards are automatically provisioned on startup

## Dashboard Access

Three dashboards are pre-configured:

1. **UPACI System Health** (`/d/upaci-system-health`)
   - 30-day uptime percentage
   - Request latency percentiles (P50/P95/P99)
   - Error rate monitoring
   - CPU and memory usage

2. **UPACI API Performance** (`/d/upaci-api-performance`)
   - Top 10 endpoints by request count
   - Slowest endpoints (P95 latency)
   - Error rate by endpoint
   - Throughput by endpoint

3. **UPACI Infrastructure** (`/d/upaci-infrastructure`)
   - Node.js heap size and memory
   - Event loop lag
   - Garbage collection metrics
   - File descriptor usage

## Prometheus Data Source

Prometheus is automatically configured as the default data source with:
- **URL**: http://prometheus:9090
- **Access**: Proxy mode (Grafana server proxies requests)
- **Scrape Interval**: 15 seconds
- **Retention**: 30 days

## Troubleshooting

### Dashboards Not Loading

1. Check Grafana logs: `docker-compose logs grafana`
2. Verify dashboard files exist in `grafana/dashboards/`
3. Restart Grafana: `docker-compose restart grafana`

### No Data in Dashboards

1. Verify Prometheus is scraping backend:
   - Open http://localhost:9090/targets
   - Check `upaci-backend` target is UP
2. Check backend `/metrics` endpoint is accessible:
   ```bash
   curl http://localhost:3001/metrics \
     -u username:password
   ```
3. Verify metric names match queries in dashboards

### Authentication Issues

1. Check Prometheus basic auth credentials in `prometheus/prometheus.yml`
2. Ensure backend requires authentication for `/metrics` endpoint
3. Update credentials in both `.env` and `prometheus.yml`

### High Memory Usage

1. Reduce Prometheus retention: Edit `PROMETHEUS_RETENTION` in `.env`
2. Decrease scrape interval in `prometheus/prometheus.yml` (e.g., 30s)
3. Increase Docker resource limits

## Updating Dashboards

### Option 1: Modify JSON Files

1. Edit dashboard JSON in `grafana/dashboards/`
2. Restart Grafana: `docker-compose restart grafana`
3. Dashboards auto-reload within 10 seconds

### Option 2: Export from UI

1. Make changes in Grafana UI
2. Click Share > Export > Save to file
3. Replace JSON file in `grafana/dashboards/`
4. Commit to version control

## Alerting

Alert rules are configured in `prometheus/alerts.yml` for:

- High error rate (>1%)
- Slow response times (P95 >2s)
- Service down
- High CPU usage (>80%)
- High memory usage (>90%)
- Database connection failures

Alerts appear in:
- Grafana Alerting UI
- Prometheus Alerts page (http://localhost:9090/alerts)

To add alert notifications (email, Slack, etc.), configure Grafana notification channels:
1. Go to Alerting > Notification channels
2. Add channel with webhook/SMTP details
3. Link to alert rules in dashboard panels

## Backup and Recovery

### Backup Dashboards

```bash
# Backup all dashboards
cp -r grafana/dashboards /backup/location

# Backup configuration
cp grafana/grafana.ini /backup/location
cp prometheus/prometheus.yml /backup/location
```

### Restore from Backup

```bash
# Restore dashboards
cp /backup/location/dashboards/* grafana/dashboards/

# Restart to apply
docker-compose restart grafana
```

## Production Deployment

For production environments:

1. **Security**:
   - Change default admin password
   - Enable HTTPS (configure reverse proxy or GF_SERVER_PROTOCOL)
   - Restrict network access to monitoring ports
   - Use secrets management for credentials

2. **Persistence**:
   - Configure external volumes for Grafana/Prometheus data
   - Set up regular backups
   - Use persistent storage for logs

3. **Scaling**:
   - Consider Prometheus federation for multi-instance backends
   - Use remote storage for long-term metrics retention
   - Scale Grafana with load balancer if needed

4. **High Availability**:
   - Deploy multiple Prometheus instances
   - Use Thanos or Cortex for HA Prometheus
   - Configure Grafana with external database (PostgreSQL)

## Additional Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [PromQL Query Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
