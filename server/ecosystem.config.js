/**
 * PM2 Ecosystem Configuration
 *
 * Cluster-mode settings for the UPACI backend.
 * - instances "max" → one worker per CPU core (NFR-REL05)
 * - kill_timeout 30 000 ms → matches the graceful-shutdown timer in server.ts
 * - wait_ready true → PM2 waits for process.send('ready') before routing traffic
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 * @task US_050 task_001 - PM2 Cluster Configuration
 */

module.exports = {
  apps: [
    {
      /* ── Identity ─────────────────────────────────────── */
      name: 'upaci-backend',
      script: './dist/server.js',

      /* ── Cluster ──────────────────────────────────────── */
      instances: 'max',
      exec_mode: 'cluster',

      /* ── Graceful shutdown / readiness ────────────────── */
      kill_timeout: 30000,
      wait_ready: true,
      listen_timeout: 10000,

      /* ── Restart policies ─────────────────────────────── */
      max_restarts: 10,
      min_uptime: '60s',
      max_memory_restart: '1G',

      /* ── Environment ──────────────────────────────────── */
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3001,
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_USER: process.env.DB_USER || '',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        DB_NAME: process.env.DB_NAME || '',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
      },

      /* ── Logging ──────────────────────────────────────── */
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
