# Task - TASK_001_BE_LOAD_TESTING_PERFORMANCE_OPTIMIZATION

## Requirement Reference
- User Story: US_040
- Story Location: `.propel/context/tasks/us_040/us_040.md`
- Acceptance Criteria:
    - AC1: Run load tests (Artillery or k6) with scenarios: 100 concurrent users booking appointments, 50 users uploading documents, 20 admin users viewing dashboards, system maintains API response times <500ms for 95th percentile (NFR-PERF01), handles 100+ concurrent users (NFR-PERF02), database queries <100ms for 90% (NFR-PERF03), optimize bottlenecks with indexes, caching, connection pooling, AI batching, log metrics to Prometheus, generate load test report
- Edge Cases:
    - Load exceeds capacity: Horizontal scaling or circuit breaker activates
    - AI API rate limits: Requests queued, returns 429 with retry-after header
    - Redis cache down: Fallback to direct database queries

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No (Backend/Infrastructure) |
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
| Backend | k6 | 0.48.x (Load testing tool) |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |
| Monitoring | Prometheus | 2.x |

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
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

## Task Overview
Implement load testing and performance optimization: (1) Install k6 load testing tool, (2) Create load test scenarios: booking-flow.js (100 VUs login → search slots → book appointment), document-upload-flow.js (50 VUs login → upload PDF → wait extraction), admin-dashboard-flow.js (20 VUs login → view metrics → export CSV), (3) Execute load tests: k6 run --vus 100 --duration 15m booking-flow.js, (4) Monitor performance: Prometheus metrics (api_request_duration_seconds histogram, database_query_duration_seconds, redis_cache_hit_rate gauge, active_users gauge), (5) Identify bottlenecks: APM tools (Application Insights or custom tracing), (6) Optimize database: Add covering indexes (CREATE INDEX idx_appointments_date_dept ON appointments(appointment_datetime, department_id)), analyze slow queries with EXPLAIN ANALYZE, (7) Implement caching: Provider schedules cached 5min TTL (Redis key: slots:{date}:{departmentId}, value: JSON array of slots), patient profiles cached 1min TTL (key: profile:{patientId}), (8) Optimize AI API calls: Batch medical coding requests (send 5 diagnoses in single OpenAI call with function calling array), (9) Connection pooling: PostgreSQL max 50 connections (pg-pool config), Redis max 20 connections, (10) Generate report: .propel/docs/load-test-report.md with charts (throughput requests/sec, response time distribution p50/p95/p99, error rate %, resource utilization CPU/memory/disk).

## Dependent Tasks
- US_005 Task 001: Prometheus metrics collection (monitoring load test results)
- US_006 Task 001: Grafana dashboards (visualizing performance metrics)
- US_004 Task 001: Redis caching layer (cache optimization)

## Impacted Components
**New:**
- load-tests/booking-flow.js (k6 test scenario)
- load-tests/document-upload-flow.js (k6 test scenario)
- load-tests/admin-dashboard-flow.js (k6 test scenario)
- load-tests/config.js (Shared configuration)
- server/src/utils/batch-ai-requests.ts (AI request batching utility)
- .propel/docs/load-test-report.md (Performance report)

**Modified:**
- server/db/schema.sql (Add performance indexes)
- server/src/config/database.ts (Update connection pool config)
- server/src/services/appointment.service.ts (Add caching layer)
- server/src/controllers/slots.controller.ts (Cache provider schedules)

## Implementation Plan
1. Install k6: `brew install k6` (macOS) or download from k6.io
2. Create booking-flow.js test:
   ```javascript
   import http from 'k6/http';
   import { check, sleep } from 'k6';
   export let options = { vus: 100, duration: '15m' };
   export default function() {
     // Login
     let loginRes = http.post('http://localhost:3001/api/auth/login', JSON.stringify({email: 'patient@example.com', password: 'Test1234!'}));
     check(loginRes, {'login status 200': (r) => r.status === 200});
     let token = loginRes.json('token');
     
     // Search slots
     let slotsRes = http.get('http://localhost:3001/api/slots?date=2024-02-01&departmentId=dept-uuid', {headers: {Authorization: `Bearer ${token}`}});
     check(slotsRes, {'slots status 200': (r) => r.status === 200, 'response <500ms': (r) => r.timings.duration < 500});
     
     // Book appointment
     let bookRes = http.post('http://localhost:3001/api/appointments', JSON.stringify({slotId: 'slot-uuid', chiefComplaint: 'Checkup'}), {headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}});
     check(bookRes, {'book status 201': (r) => r.status === 201});
     
     sleep(1);
   }
   ```
3. Create document-upload-flow.js (50 VUs upload PDF, check processing status)
4. Create admin-dashboard-flow.js (20 VUs fetch metrics, export CSV)
5. Add database indexes:
   - CREATE INDEX idx_appointments_date_dept ON appointments(appointment_datetime, department_id);
   - CREATE INDEX idx_appointments_patient_status ON appointments(patient_id, status);
   - CREATE INDEX idx_slots_date_available ON slots(date, is_available);
6. Implement caching in slots.controller.ts:
   ```typescript
   async getSlots(req, res) {
     const {date, departmentId} = req.query;
     const cacheKey = `slots:${date}:${departmentId}`;
     
     // Check cache
     const cached = await redis.get(cacheKey);
     if (cached) return res.json(JSON.parse(cached));
     
     // Query database
     const slots = await db.query('SELECT * FROM slots WHERE date=$1 AND department_id=$2', [date, departmentId]);
     
     // Cache result (5min TTL)
     await redis.setex(cacheKey, 300, JSON.stringify(slots.rows));
     res.json(slots.rows);
   }
   ```
7. Connection pooling (database.ts):
   ```typescript
   const pool = new Pool({
     host: 'localhost',
     port: 5432,
     database: 'appointment_db',
     user: 'postgres',
     password: process.env.DB_PASSWORD,
     max: 50, // Max 50 connections
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000
   });
   ```
8. AI request batching (batch-ai-requests.ts):
   ```typescript
   async function batchMedicalCoding(diagnoses: string[]): Promise<Code[]> {
     const response = await openai.chat.completions.create({
       model: 'gpt-4-turbo',
       messages: [{role: 'system', content: 'Map diagnoses to ICD-10 codes'}, {role: 'user', content: diagnoses.join(', ')}],
       functions: [{name: 'codeDiagnoses', parameters: {type: 'array', items: {type: 'object', properties: {diagnosis, primaryCode, confidence}}}}],
       function_call: {name: 'codeDiagnoses'}
     });
     return JSON.parse(response.choices[0].message.function_call.arguments);
   }
   ```
9. Run load tests:
   - k6 run --vus 100 --duration 15m load-tests/booking-flow.js --out json=results.json
   - k6 run --vus 50 --duration 15m load-tests/document-upload-flow.js
   - k6 run --vus 20 --duration 15m load-tests/admin-dashboard-flow.js
10. Analyze results: Parse results.json, calculate p50/p95/p99 response times, error rate, throughput
11. Generate report (.propel/docs/load-test-report.md):
    - Executive summary (pass/fail criteria)
    - Throughput: requests/sec (target: >100 req/s sustained)
    - Response times: p50 <200ms, p95 <500ms, p99 <1000ms
    - Error rate: <0.1%
    - Resource utilization: CPU <70%, memory <80%, disk I/O <50MB/s
    - Bottlenecks identified: Slow queries optimized with indexes, cache hit rate improved from 40% to 85%
    - Recommendations: Horizontal scaling plan, further optimizations

## Current Project State
```
ASSIGNMENT/
├── server/src/ (backend exists)
├── load-tests/ (to be created)
└── (performance optimization to be applied)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | load-tests/booking-flow.js | Booking test scenario |
| CREATE | load-tests/document-upload-flow.js | Upload test scenario |
| CREATE | load-tests/admin-dashboard-flow.js | Dashboard test scenario |
| CREATE | load-tests/config.js | Shared config |
| CREATE | server/src/utils/batch-ai-requests.ts | AI batching utility |
| CREATE | .propel/docs/load-test-report.md | Performance report |
| UPDATE | server/db/schema.sql | Add performance indexes |
| UPDATE | server/src/config/database.ts | Connection pool config |
| UPDATE | server/src/controllers/slots.controller.ts | Add caching layer |

## External References
- [k6 Documentation](https://k6.io/docs/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [NFR-PERF01 API <500ms](../../../.propel/context/docs/spec.md#NFR-PERF01)
- [NFR-PERF02 100+ Users](../../../.propel/context/docs/spec.md#NFR-PERF02)
- [NFR-PERF03 DB Queries <100ms](../../../.propel/context/docs/spec.md#NFR-PERF03)

## Build Commands
```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/docs/getting-started/installation/

# Run load tests
k6 run --vus 100 --duration 15m load-tests/booking-flow.js --out json=booking-results.json
k6 run --vus 50 --duration 15m load-tests/document-upload-flow.js --out json=upload-results.json
k6 run --vus 20 --duration 15m load-tests/admin-dashboard-flow.js --out json=admin-results.json

# Analyze results
k6 inspect booking-results.json
```

## Implementation Validation Strategy
- [ ] Unit tests: batch-ai-requests batches multiple diagnoses in single call
- [ ] Integration tests: Caching layer returns cached results on second request
- [ ] k6 installed: Run `k6 version` → shows version
- [ ] Load test scenarios: booking-flow.js, document-upload-flow.js, admin-dashboard-flow.js exist
- [ ] Booking flow test: 100 VUs → login → search slots → book appointment, sustained 15 minutes
- [ ] Response times: p95 <500ms (NFR-PERF01), p50 <200ms, p99 <1000ms
- [ ] Throughput: >100 requests/sec sustained
- [ ] Error rate: <0.1% (less than 1 error per 1000 requests)
- [ ] Concurrent users: System handles 100+ VUs without degradation (NFR-PERF02)
- [ ] Database indexes: EXPLAIN ANALYZE shows index scan (not seq scan) on appointments by date
- [ ] Cache hit rate: Prometheus metric redis_cache_hit_rate >80%
- [ ] Provider schedule caching: First request queries DB, second request returns cached (Redis TTL 5min)
- [ ] Patient profile caching: Cache key profile:{patientId} with 1min TTL
- [ ] Connection pooling: PostgreSQL max 50 connections, active connections monitored via Prometheus
- [ ] AI request batching: 5 diagnoses sent in single OpenAI call, function calling returns array
- [ ] Load test report: .propel/docs/load-test-report.md exists with charts + analysis
- [ ] Report sections: Executive summary, throughput graph, response time distribution, error rate, resource utilization, bottlenecks, recommendations
- [ ] Performance metrics: Prometheus exporters log api_request_duration_seconds, database_query_duration_seconds, redis_cache_hit_rate
- [ ] Grafana dashboard: Visualizes load test results in real-time

## Implementation Checklist
- [ ] Install k6 load testing tool
- [ ] Create load-tests/ directory with scenarios
- [ ] Write booking-flow.js test (100 VUs)
- [ ] Write document-upload-flow.js test (50 VUs)
- [ ] Write admin-dashboard-flow.js test (20 VUs)
- [ ] Add database indexes for appointments, slots queries
- [ ] Implement caching layer in slots.controller.ts
- [ ] Configure PostgreSQL connection pool (max 50)
- [ ] Configure Redis connection pool (max 20)
- [ ] Implement AI request batching utility
- [ ] Run load tests and collect metrics
- [ ] Analyze results: throughput, response times, error rate
- [ ] Generate load-test-report.md with findings
- [ ] Validate NFR-PERF01/PERF02/PERF03 requirements met
- [ ] Document load testing procedure in server/README.md
