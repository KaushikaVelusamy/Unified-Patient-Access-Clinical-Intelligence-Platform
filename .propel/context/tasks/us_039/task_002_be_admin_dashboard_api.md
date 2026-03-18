# Task - TASK_002_BE_ADMIN_DASHBOARD_API

## Requirement Reference
- User Story: US_039
- Story Location: `.propel/context/tasks/us_039/us_039.md`
- Acceptance Criteria:
    - AC1: Backend WebSocket server broadcasts real-time metrics every 30s to admin clients: Current Queue Size, Average Wait Time, Today's Appointments counts, system health (API response times, AI service status, DB connections, Redis cache stats), operational KPIs (total appointments, no-show rate, avg booking lead time, insurance verification success rate), metrics cached in Redis with 30s TTL, historical aggregates saved daily with 90-day retention
- Edge Cases:
    - WebSocket authentication: Verify JWT token on connection
    - Historical data: Daily aggregates computed by cron job, stored in daily_metrics table
    - No data for range: Return empty arrays, frontend shows message

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend API) |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | Socket.IO | 4.x |
| Backend | Bull | 4.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No (Backend API) |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement Admin Dashboard API: (1) WebSocket server (Socket.IO) broadcasts real-time metrics every 30s to admin clients only, (2) Metrics calculation: Current Queue (COUNT appointments WHERE status IN ('Scheduled','Arrived','Walk-in')), Avg Wait Time (AVG(in_progress_time - arrival_time) WHERE DATE=today), Today's Appointments (COUNT by status), System Health (Prometheus API integration for API response times + DB connections, Redis INFO stats for cache hit rate, audit_logs for AI service success rate), Operational KPIs (total appointments, no-show rate, avg booking lead time, insurance verification success rate for selected date range), (3) Cache metrics in Redis (key: metrics:dashboard:{date}, TTL 30s to reduce DB load), (4) GET /api/admin/metrics endpoint with date range filter for fallback polling, (5) GET /api/admin/metrics/export generates CSV file, (6) Daily cron job computes historical aggregates: daily_metrics table (date, total_appointments, no_show_count, avg_wait_time, insurance_success_rate), retained 90 days (TR-006), (7) WebSocket authentication: Verify JWT token on connection, restrict to admin role.

## Dependent Tasks
- US_010 Task 001: RBAC middleware (admin role verification)
- US_005: Prometheus (system health monitoring)
- US_024: No-show data (no-show rate calculation)
- US_037: Insurance verifications (insurance success rate)

## Impacted Components
**New:**
- server/src/websockets/admin-dashboard.socket.ts (WebSocket server)
- server/src/services/admin-metrics.service.ts (Metrics calculation)
- server/src/controllers/admin-metrics.controller.ts (Metrics endpoints)
- server/src/routes/admin-metrics.routes.ts (GET /admin/metrics, GET /admin/metrics/export)
- server/src/jobs/daily-metrics-aggregator.ts (Cron job for historical aggregates)
- server/src/utils/metrics-csv-exporter.ts (CSV export utility)

**Modified:**
- server/db/schema.sql (Add daily_metrics table)
- server/src/server.ts (Initialize WebSocket server)

## Implementation Plan
1. Database schema: CREATE TABLE daily_metrics (id SERIAL, metric_date DATE UNIQUE, total_appointments INTEGER, no_show_count INTEGER, avg_wait_time_minutes INTEGER, insurance_verification_success_rate DECIMAL(5,2), created_at TIMESTAMP DEFAULT NOW())
2. WebSocket server (admin-dashboard.socket.ts):
   - Initialize Socket.IO: io = new Server(httpServer, {cors: {origin: 'http://localhost:3000'}})
   - Authentication: io.use((socket, next) => {const token = socket.handshake.query.token; verify JWT, check role='admin', next()})
   - Broadcast metrics every 30s: setInterval(() => {const metrics = await calculateMetrics(); io.to('admins').emit('metrics-update', metrics)}, 30000)
3. Metrics calculation service (admin-metrics.service.ts):
   - calculateMetrics(): Query PostgreSQL for real-time counts, aggregate data
   - Current Queue: SELECT COUNT(*) FROM appointments WHERE status IN ('Scheduled','Arrived','Walk-in') AND appointment_datetime = CURRENT_DATE
   - Avg Wait Time: SELECT AVG(EXTRACT(EPOCH FROM (in_progress_time - arrival_time))/60) FROM appointments WHERE arrival_time IS NOT NULL AND in_progress_time IS NOT NULL AND DATE(arrival_time) = CURRENT_DATE
   - Today's Appointments: SELECT status, COUNT(*) FROM appointments WHERE appointment_datetime = CURRENT_DATE GROUP BY status
   - System Health:
     - API Response Times: Call Prometheus API GET /api/v1/query?query=http_request_duration_ms{quantile="0.95"}
     - DB Connections: SELECT count(*) FROM pg_stat_activity WHERE datname='appointment_db'
     - Redis Cache: REDIS INFO stats → parse keyspace_hits, keyspace_misses → calculate hit_rate = hits/(hits+misses)
     - AI Service: SELECT COUNT(*) FROM audit_logs WHERE action_type LIKE 'ai_%' AND created_at > NOW()-INTERVAL '1 hour' → calculate success_rate
   - Operational KPIs (date range):
     - Total Appointments: SELECT COUNT(*) FROM appointments WHERE appointment_datetime BETWEEN $1 AND $2
     - No-Show Rate: SELECT (COUNT(*) FILTER (WHERE status='No Show') / COUNT(*)::FLOAT * 100) FROM appointments WHERE appointment_datetime BETWEEN $1 AND $2
     - Avg Booking Lead Time: SELECT AVG(EXTRACT(EPOCH FROM (appointment_datetime - created_at))/86400) FROM appointments WHERE created_at BETWEEN $1 AND $2
     - Insurance Verification Success Rate: SELECT (COUNT(*) FILTER (WHERE status='active') / COUNT(*)::FLOAT * 100) FROM insurance_verifications WHERE verification_date BETWEEN $1 AND $2
   - Cache result: SET metrics:dashboard:{date} JSON.stringify(metrics) EX 30
4. GET /api/admin/metrics:
   - verifyToken, requireRole('admin')
   - Query params: startDate, endDate (default last 7 days)
   - Check cache: GET metrics:dashboard:{date}, if hit return cached
   - Else: calculateMetrics(), cache result, return JSON
5. GET /api/admin/metrics/export:
   - verifyToken, requireRole('admin')
   - Query params: startDate, endDate
   - Call calculateMetrics() for range
   - Format as CSV: "Date,Total Appointments,No-Show Rate %,Avg Wait Time,Insurance Success Rate\n2024-01-15,120,8.5,15,96.2\n..."
   - Set headers: Content-Type: text/csv, Content-Disposition: attachment; filename="metrics-{startDate}-{endDate}.csv"
   - Send CSV
6. Daily cron job (daily-metrics-aggregator.ts):
   - Schedule: '0 1 * * *' (1AM daily)
   - Query yesterday's data: SELECT metrics for DATE=CURRENT_DATE-1
   - INSERT INTO daily_metrics (metric_date, total_appointments, no_show_count, avg_wait_time_minutes, insurance_verification_success_rate)
   - Cleanup old data: DELETE FROM daily_metrics WHERE metric_date < CURRENT_DATE - INTERVAL '90 days' (TR-006)
7. Initialize WebSocket in server.ts: import adminDashboardSocket; adminDashboardSocket.init(httpServer)
8. Alerts: If API response time >1000ms or AI success rate <80%, include in metrics.alerts array

## Current Project State
```
ASSIGNMENT/
├── server/src/ (admin services exist)
├── server/src/websockets/ (to be created)
└── (admin dashboard API to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/websockets/admin-dashboard.socket.ts | WebSocket server |
| CREATE | server/src/services/admin-metrics.service.ts | Metrics calculation |
| CREATE | server/src/controllers/admin-metrics.controller.ts | Metrics handlers |
| CREATE | server/src/routes/admin-metrics.routes.ts | Metrics endpoints |
| CREATE | server/src/jobs/daily-metrics-aggregator.ts | Cron job |
| CREATE | server/src/utils/metrics-csv-exporter.ts | CSV utility |
| UPDATE | server/db/schema.sql | Add daily_metrics table |
| UPDATE | server/src/server.ts | Initialize WebSocket |

## External References
- [Socket.IO Server Documentation](https://socket.io/docs/v4/server-api/)
- [Prometheus HTTP API](https://prometheus.io/docs/prometheus/latest/querying/api/)
- [PostgreSQL Aggregates](https://www.postgresql.org/docs/current/functions-aggregate.html)
- [Redis INFO Command](https://redis.io/commands/info/)
- [NFR-PERF01 WebSocket <30s](../../../.propel/context/docs/spec.md#NFR-PERF01)
- [TR-006 90-Day Retention](../../../.propel/context/docs/spec.md#TR-006)

## Build Commands
```bash
cd server
npm install socket.io axios node-cron
npm run dev

# Test metrics endpoint
curl -X GET "http://localhost:3001/api/admin/metrics?startDate=2024-01-01&endDate=2024-01-15" \
  -H "Authorization: Bearer <admin-token>"

# Test CSV export
curl -X GET "http://localhost:3001/api/admin/metrics/export?startDate=2024-01-01&endDate=2024-01-15" \
  -H "Authorization: Bearer <admin-token>" \
  --output metrics.csv
```

## Implementation Validation Strategy
- [ ] Unit tests: calculateMetrics returns {queueSize, avgWaitTime, todayAppointments, systemHealth, kpis}
- [ ] Integration tests: GET /admin/metrics returns metrics JSON
- [ ] Socket.IO installed: package.json shows socket.io@4.x
- [ ] daily_metrics table exists: \d daily_metrics shows columns
- [ ] WebSocket server: Start server → console logs "WebSocket server initialized"
- [ ] WebSocket authentication: Connect without token → connection rejected "Unauthorized"
- [ ] Admin restriction: Staff user connects → rejected "Admin role required"
- [ ] Metrics broadcast: Admin connects → receives 'metrics-update' event every 30s
- [ ] Current queue: Query appointments → queueSize matches COUNT WHERE status IN ('Scheduled','Arrived')
- [ ] Avg wait time: Query appointments with arrival/in_progress times → avgWaitTime calculated correctly
- [ ] Today's appointments: Breakdown by status (scheduled: 30, checked-in: 10, completed: 40, no-shows: 5)
- [ ] System health: API response times from Prometheus, DB connections from pg_stat_activity, cache hit rate from Redis INFO
- [ ] AI service status: Query audit_logs for ai_* actions → calculate success rate
- [ ] KPIs calculation: Date range Jan 1-15 → total appointments 450, no-show rate 7.2%, avg lead time 3.5 days, insurance success 94.8%
- [ ] Redis caching: GET metrics:dashboard:2024-01-15 → cached result returned
- [ ] Cache expiration: Wait 31s → cache expired, recalculated
- [ ] GET /admin/metrics: Returns JSON with all metrics + arrays for charts (dailyAppointments[], noshowsByWeekday[], appointmentTypeDistribution[])
- [ ] CSV export: GET /admin/metrics/export → downloads CSV file with headers + data rows
- [ ] Daily cron job: Runs at 1AM → INSERT yesterday's metrics into daily_metrics
- [ ] 90-day retention: Query daily_metrics → records older than 90 days deleted
- [ ] Alerts: API response time >1000ms → metrics.alerts includes {severity: 'critical', message: 'API response time high'}

## Implementation Checklist
- [ ] Install Socket.IO: `npm install socket.io`
- [ ] Install axios for Prometheus: `npm install axios`
- [ ] Install node-cron: `npm install node-cron`
- [ ] Create daily_metrics table
- [ ] Implement admin-metrics.service.ts with calculateMetrics()
- [ ] Create admin-dashboard.socket.ts with WebSocket server
- [ ] Implement JWT authentication middleware for WebSocket
- [ ] Create admin-metrics.controller.ts + admin-metrics.routes.ts
- [ ] Create daily-metrics-aggregator.ts cron job
- [ ] Create metrics-csv-exporter.ts utility
- [ ] Initialize WebSocket in server.ts
- [ ] Test WebSocket connection + metrics broadcast
- [ ] Test metrics caching with Redis
- [ ] Validate daily cron job + 90-day cleanup
- [ ] Document admin dashboard API in server/README.md
