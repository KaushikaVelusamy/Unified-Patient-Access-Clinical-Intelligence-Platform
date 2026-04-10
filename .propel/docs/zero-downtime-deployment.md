# Zero-Downtime Deployment with PM2

## Overview

The UPACI backend uses **PM2 cluster mode** for zero-downtime deployments.
PM2 runs one worker per CPU core (`instances: "max"`) and performs **rolling
restarts** via `pm2 reload`: it sends SIGINT to one instance at a time, waits
for graceful shutdown (30 s), starts the new version, waits for the
`process.send('ready')` signal, then moves to the next instance. At least
_N − 1_ instances remain online throughout.

### Architecture

```
                  ┌───────────────────────────────┐
                  │         Load Balancer          │
                  └──────┬──────┬──────┬──────────┘
                         │      │      │
               ┌─────────┘      │      └─────────┐
               ▼                ▼                ▼
          ┌─────────┐    ┌─────────┐    ┌─────────┐
          │ Worker 1 │    │ Worker 2 │    │ Worker N │
          │  (PM2)   │    │  (PM2)   │    │  (PM2)   │
          └─────────┘    └─────────┘    └─────────┘
                  │              │              │
            ┌─────▼──────────────▼──────────────▼─────┐
            │              PostgreSQL                  │
            └─────────────────────────────────────────┘
            ┌─────────────────────────────────────────┐
            │            Upstash Redis                 │
            └─────────────────────────────────────────┘
```

## Deployment Process

### 1. Staging Deployment

```bash
chmod +x .propel/scripts/deploy-staging.sh
./.propel/scripts/deploy-staging.sh
```

The script:

1. Pulls latest code (`git pull --ff-only`)
2. Installs dependencies (`npm ci`)
3. Builds TypeScript (`npm run build`)
4. Performs zero-downtime reload (`pm2 reload upaci-backend`)
5. Polls `/api/health` (15 attempts, 2 s interval)
6. Reports success / failure

### 2. Production Deployment

```bash
chmod +x .propel/scripts/deploy-production.sh
./.propel/scripts/deploy-production.sh --confirm
```

The script:

1. **Requires** `--confirm` flag (safety gate)
2. Backs up current version to `PREVIOUS_VERSION`
3. Pulls latest code
4. Runs backward-compatible DB migrations (`npm run migrate:up`)
5. Installs production dependencies (`npm ci --omit=dev`)
6. Builds TypeScript
7. Performs zero-downtime reload
8. Polls `/api/health` (30 attempts, 2 s interval)
9. Verifies ≥ 3 instances online
10. Reports deployment duration

## Rollback Procedures

### Option 1: Rollback Script

```bash
./.propel/scripts/rollback.sh
```

Reads `PREVIOUS_VERSION`, checks out that commit, rebuilds, and reloads PM2.

### Option 2: Git Revert + Redeploy

```bash
git log --oneline -5            # identify failing commit
git revert <commit-hash>        # create revert commit
git push origin main
./.propel/scripts/deploy-production.sh --confirm
```

### Option 3: Manual PM2 Reload (Emergency)

```bash
cd server
git checkout <known-good-tag>
npm ci --omit=dev && npm run build
pm2 reload upaci-backend
```

## Database Migrations

| Scenario | Strategy |
|----------|----------|
| **Add nullable column** | Run migration before deploy — old code ignores the column |
| **Rename column** | Add new column → deploy code reading both → backfill → drop old column |
| **Breaking change** | Schedule maintenance window; notify users in advance |

**Rule:** Migrations must be backward-compatible with the currently running code.
The deploy script runs `npm run migrate:up` _before_ PM2 reload.

## Health Check Validation

After every deployment the scripts poll:

```
GET /api/health  →  HTTP 200 = healthy
                     HTTP 503 = unhealthy
```

Response includes:

| Field | Meaning |
|-------|---------|
| `database.status` | `connected` / `disconnected` |
| `redis.status` | `connected` / `disconnected` |
| `aiService.available` | `true` / `false` (only when `OPENAI_API_KEY` set) |
| `executionTime` | Health-check latency |

If the health check does not return 200 within the retry window the deploy
script exits with code 1.

## Monitoring

### Prometheus Metrics

Start the PM2 exporter:

```bash
cd monitoring/prometheus
node pm2-exporter.js
# → http://localhost:9209/metrics
```

| Metric | Type | Description |
|--------|------|-------------|
| `pm2_instances_running` | gauge | Online instances |
| `pm2_instances_total` | gauge | Configured instances |
| `pm2_cpu_percent` | gauge | CPU % per instance |
| `pm2_memory_bytes` | gauge | Memory per instance |
| `pm2_restart_count` | gauge | Restart count per instance |
| `pm2_uptime_seconds` | gauge | Uptime per instance |
| `deployment_duration_seconds` | histogram | Deployment time |
| `zero_downtime_achieved_total` | counter | Successful zero-downtime deploys |

### Grafana Dashboard

Import `monitoring/grafana/dashboards/deployment-dashboard.json` in Grafana
(Dashboards → Import → Upload JSON). Panels:

- Instances Running / Total (stat)
- Instances Running Over Time (timeseries)
- CPU Usage per Instance (timeseries)
- Memory Usage per Instance (timeseries)
- Restart Events (timeseries)
- Deployment Duration (timeseries)
- Instance Uptime (timeseries)

### Recommended Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Instances below minimum | `pm2_instances_running < 3` for 1 m | Critical |
| Deployment duration exceeded | `deployment_duration_seconds > 300` | Warning |
| High restart rate | `increase(pm2_restart_count[5m]) > 5` | Warning |

## Troubleshooting

### Deployment hangs during reload

1. Check PM2 logs: `pm2 logs upaci-backend --err --lines 50`
2. Verify graceful shutdown code sends `process.exit(0)` within 30 s
3. Last resort: `pm2 restart upaci-backend` (causes brief downtime)

### Health check fails after deployment

1. Database connectivity: check `DB_HOST`, `DB_PORT` env vars
2. Redis connectivity: check `REDIS_HOST` env var
3. Application logs: `pm2 logs upaci-backend --lines 100`
4. Port conflict: `lsof -i :3001` or `netstat -tlnp | grep 3001`

### Instances stuck in "errored" state

```bash
pm2 delete upaci-backend
pm2 start ecosystem.config.js
```

### Rollback fails

1. Verify `PREVIOUS_VERSION` file exists in `server/`
2. Verify the recorded commit hash is valid: `git cat-file -t $(cat PREVIOUS_VERSION)`
3. Manual checkout: `git checkout <tag-or-hash>`

## Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Show process list & status |
| `pm2 reload upaci-backend` | Zero-downtime rolling reload |
| `pm2 restart upaci-backend` | Hard restart (brief downtime) |
| `pm2 stop upaci-backend` | Stop all instances |
| `pm2 delete upaci-backend` | Remove from PM2 |
| `pm2 logs upaci-backend` | Tail live logs |
| `pm2 logs upaci-backend --err` | Tail error logs only |
| `pm2 monit` | Real-time monitoring TUI |
| `pm2 jlist` | JSON list of all processes |
| `pm2 describe upaci-backend` | Detailed process info |
| `pm2 save` | Save process list for auto-restart |
| `pm2 startup` | Generate OS startup hook |
