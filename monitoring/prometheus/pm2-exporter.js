/**
 * PM2 Prometheus Exporter
 *
 * Exposes PM2 process metrics on port 9209 for Prometheus scraping:
 *   pm2_instances_running, pm2_instances_total,
 *   pm2_cpu_percent, pm2_memory_bytes,
 *   pm2_restart_count, pm2_uptime_seconds,
 *   deployment_duration_seconds, zero_downtime_achieved
 *
 * Usage:
 *   node pm2-exporter.js
 *   # → http://localhost:9209/metrics
 *
 * @task US_050 task_003 - Deployment Pipeline Automation
 */

'use strict';

const pm2 = require('pm2');
const client = require('prom-client');
const http = require('http');

const PORT = parseInt(process.env.PM2_EXPORTER_PORT || '9209', 10);
const APP_NAME = process.env.PM2_APP_NAME || 'upaci-backend';
const SCRAPE_INTERVAL = 15000; // 15 seconds

// ── Prometheus registry ────────────────────────────────
const register = new client.Registry();
register.setDefaultLabels({ app: APP_NAME });

// ── Gauges ─────────────────────────────────────────────
const instancesRunning = new client.Gauge({
  name: 'pm2_instances_running',
  help: 'Number of PM2 instances currently online',
  registers: [register],
});

const instancesTotal = new client.Gauge({
  name: 'pm2_instances_total',
  help: 'Total number of PM2 instances configured',
  registers: [register],
});

const cpuPercent = new client.Gauge({
  name: 'pm2_cpu_percent',
  help: 'CPU usage percentage per instance',
  labelNames: ['instance_id', 'instance_name'],
  registers: [register],
});

const memoryBytes = new client.Gauge({
  name: 'pm2_memory_bytes',
  help: 'Memory usage in bytes per instance',
  labelNames: ['instance_id', 'instance_name'],
  registers: [register],
});

const restartCount = new client.Gauge({
  name: 'pm2_restart_count',
  help: 'Total number of restarts per instance',
  labelNames: ['instance_id', 'instance_name'],
  registers: [register],
});

const uptimeSeconds = new client.Gauge({
  name: 'pm2_uptime_seconds',
  help: 'Process uptime in seconds per instance',
  labelNames: ['instance_id', 'instance_name'],
  registers: [register],
});

// ── Deployment-specific metrics ────────────────────────
const deploymentDuration = new client.Histogram({
  name: 'deployment_duration_seconds',
  help: 'Time taken for a deployment (push via POST /deploy-event)',
  buckets: [10, 30, 60, 120, 300, 600],
  registers: [register],
});

const zeroDowntimeAchieved = new client.Counter({
  name: 'zero_downtime_achieved_total',
  help: 'Number of successful zero-downtime deployments',
  registers: [register],
});

// ── Collect PM2 metrics ────────────────────────────────
function collectMetrics() {
  pm2.connect((err) => {
    if (err) {
      console.error('PM2 connect error:', err.message);
      return;
    }

    pm2.list((listErr, processes) => {
      if (listErr) {
        console.error('PM2 list error:', listErr.message);
        pm2.disconnect();
        return;
      }

      const appProcs = processes.filter((p) => p.name === APP_NAME);
      const online = appProcs.filter(
        (p) => p.pm2_env && p.pm2_env.status === 'online',
      );

      instancesTotal.set(appProcs.length);
      instancesRunning.set(online.length);

      appProcs.forEach((proc) => {
        const id = String(proc.pm_id);
        const name = proc.name;
        const monit = proc.monit || {};

        cpuPercent.labels(id, name).set(monit.cpu || 0);
        memoryBytes.labels(id, name).set(monit.memory || 0);
        restartCount
          .labels(id, name)
          .set(proc.pm2_env ? proc.pm2_env.restart_time || 0 : 0);

        if (proc.pm2_env && proc.pm2_env.pm_uptime) {
          const uptime = (Date.now() - proc.pm2_env.pm_uptime) / 1000;
          uptimeSeconds.labels(id, name).set(Math.max(0, uptime));
        }
      });

      pm2.disconnect();
    });
  });
}

// ── HTTP Server ────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.url === '/metrics' && req.method === 'GET') {
    try {
      const metrics = await register.metrics();
      res.writeHead(200, { 'Content-Type': register.contentType });
      res.end(metrics);
    } catch (e) {
      res.writeHead(500);
      res.end(e.message);
    }
    return;
  }

  // POST /deploy-event — record a deployment event
  if (req.url === '/deploy-event' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.duration_seconds) {
          deploymentDuration.observe(Number(data.duration_seconds));
        }
        if (data.zero_downtime) {
          zeroDowntimeAchieved.inc();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// ── Start ──────────────────────────────────────────────
setInterval(collectMetrics, SCRAPE_INTERVAL);
collectMetrics(); // immediate first collect

server.listen(PORT, () => {
  console.log(`PM2 Prometheus exporter listening on :${PORT}/metrics`);
});
