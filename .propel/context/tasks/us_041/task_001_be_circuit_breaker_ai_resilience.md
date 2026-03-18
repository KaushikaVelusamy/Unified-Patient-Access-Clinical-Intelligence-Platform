# Task - TASK_001_BE_CIRCUIT_BREAKER_AI_RESILIENCE

## Requirement Reference
- User Story: US_041
- Story Location: `.propel/context/tasks/us_041/us_041.md`
- Acceptance Criteria:
    - AC1: Implement circuit breaker for OpenAI API calls (AI intake, document extraction, medical coding, conflict detection), when failures exceed 50% error rate within 1-minute rolling window, transition to "Open" state and block calls for 60s cooldown, return graceful fallback responses (AI intake→manual form, extraction→queue for later, coding→manual codes, conflicts→basic rules), display circuit breaker status in admin dashboard (Green/Yellow/Red), log state transitions to audit, attempt Half-Open after cooldown, notify admin when circuit opens
- Edge Cases:
    - Circuit opens during active booking: User can book but AI features disabled with "Limited functionality" banner
    - Queued documents after recovery: Background job retries failed extractions FIFO with rate limit 10/minute
    - Fallback logic fails: Return 503 Service Unavailable with retry-after header

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Admin dashboard shows circuit breaker status) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-004 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html |
| **Screen Spec** | SCR-004 (Admin Dashboard - System Health panel with circuit breaker indicators) |
| **UXR Requirements** | NFR-REL01 (Graceful degradation), NFR-REL02 (Circuit breaker for external APIs), UXR-402 (Clear error messages) |
| **Design Tokens** | Circuit breaker indicators: Closed green, Half-Open yellow, Open red, Health panel: traffic light icons |

> **Wireframe Components:**
> - Admin Dashboard System Health panel: Circuit breaker indicators for each OpenAI endpoint (AI Intake, Document Extraction, Medical Coding, Conflict Detection)
> - Traffic light status: Green (Closed, normal operation), Yellow (Half-Open, testing recovery), Red (Open, fallback active)
> - Click indicator: Opens modal with 24h state transition history chart
> - Fallback banners: User-facing pages show "AI features temporarily unavailable" when circuit open

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | opossum | 8.x (Circuit breaker library) |
| Backend | Express | 4.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | Yes (Resilience for AI services) |
| **AIR Requirements** | NFR-REL01 (Graceful degradation), NFR-REL02 (Circuit breaker), TR-004 (Resilience patterns) |
| **AI Pattern** | Circuit breaker pattern for OpenAI API calls |
| **Prompt Template Path** | N/A (Applies to all AI features) |
| **Guardrails Config** | .propel/context/ai-guardrails/circuit-breaker-config.json |
| **Model Provider** | OpenAI (GPT-4 Turbo, GPT-4 Vision) |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Fallback banners) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement circuit breaker for AI service resilience: (1) Install opossum circuit breaker library, (2) Create circuit breaker instances for each OpenAI endpoint: intakeBreaker (AI intake), extractionBreaker (document extraction), codingBreaker (medical coding), conflictBreaker (medication conflicts), (3) Configure circuit breaker: errorThresholdPercentage: 50 (open if >50% failures), requestVolumeThreshold: 10 (min 10 requests before opening), timeout: 30000 (30s per request), rollingCountTimeout: 60000 (1min rolling window), cooldown: 60000 (60s before Half-Open), (4) State machine: Closed (normal) → (>50% failures) → Open (block calls) → (after 60s) → Half-Open (test recovery) → (test success) → Closed OR (test fail) → Open, (5) Graceful fallbacks: AI intake → disable chat, show manual form only, Document extraction → UPDATE documents SET status='queued' WHERE status='processing', queue for retry, Medical coding → return {message: 'AI suggestion unavailable - use manual coding'}, Medication conflicts → basic rule-based validation (check drug interaction database), (6) Circuit breaker status in admin dashboard: GET /api/admin/circuit-breaker-status returns {intakeBreaker: {state: 'closed'|'half-open'|'open', lastStateChange, failureRate}, ...}, display traffic lights (green/yellow/red), (7) Log state transitions: INSERT INTO audit_logs (action_type='circuit_breaker_state_change', details={endpoint, oldState, newState, failureRate}), (8) Notify admin: Send email/SMS when circuit opens (critical alert via SendGrid/Twilio), (9) Prometheus metrics: circuit_breaker_state gauge (0=closed, 1=half-open, 2=open), api_failure_rate histogram, fallback_activation_count counter, (10) Background retry job: Bull queue retries failed extractions in FIFO order, rate limit 10/minute to prevent overwhelming OpenAI API.

## Dependent Tasks
- US_025 Task 001: AI intake (uses intake circuit breaker)
- US_029 Task 001: Document extraction (uses extraction circuit breaker)
- US_032 Task 001: Medical coding (uses coding circuit breaker)
- US_033 Task 001: Medication conflicts (uses conflict circuit breaker)
- US_039 Task 002: Admin dashboard API (displays circuit breaker status)

## Impacted Components
**New:**
- server/src/middleware/circuit-breaker.ts (Circuit breaker instances + config)
- server/src/services/circuit-breaker-fallbacks.ts (Fallback logic for each service)
- server/src/controllers/circuit-breaker.controller.ts (Circuit breaker status endpoints)
- server/src/routes/circuit-breaker.routes.ts (GET /admin/circuit-breaker-status)
- server/src/jobs/document-extraction-retry.ts (Background retry job for queued documents)
- app/src/components/CircuitBreakerStatus.tsx (Admin dashboard status panel)
- app/src/components/AIFeatureUnavailableBanner.tsx (User-facing fallback banner)

**Modified:**
- server/src/services/openai-client.ts (Wrap API calls with circuit breaker)
- server/src/services/ai-intake.service.ts (Use intakeBreaker wrapper)
- server/src/services/document-extraction.service.ts (Use extractionBreaker wrapper)
- server/src/services/medical-coding.service.ts (Use codingBreaker wrapper)
- server/src/services/medication-conflicts.service.ts (Use conflictBreaker wrapper)

## Implementation Plan
1. Install opossum: `npm install opossum`
2. Create circuit-breaker.ts middleware:
   ```typescript
   import CircuitBreaker from 'opossum';
   
   const options = {
     errorThresholdPercentage: 50,
     requestVolumeThreshold: 10,
     timeout: 30000,
     rollingCountTimeout: 60000,
     resetTimeout: 60000  // Cooldown 60s
   };
   
   export const intakeBreaker = new CircuitBreaker(async (prompt) => {
     const response = await openai.chat.completions.create({
       model: 'gpt-4-turbo',
       messages: [{role: 'user', content: prompt}]
     });
     return response.choices[0].message.content;
   }, options);
   
   // Event listeners
   intakeBreaker.on('open', () => {
     console.log('Circuit breaker opened for AI intake');
     auditLog('circuit_breaker_state_change', {endpoint: 'ai-intake', oldState: 'closed', newState: 'open'});
     sendAdminAlert('AI intake circuit breaker opened - fallback to manual form');
   });
   
   intakeBreaker.on('halfOpen', () => {
     console.log('Circuit breaker half-open for AI intake');
     auditLog('circuit_breaker_state_change', {endpoint: 'ai-intake', oldState: 'open', newState: 'half-open'});
   });
   
   intakeBreaker.on('close', () => {
     console.log('Circuit breaker closed for AI intake');
     auditLog('circuit_breaker_state_change', {endpoint: 'ai-intake', oldState: 'half-open', newState: 'closed'});
     sendAdminAlert('AI intake circuit breaker recovered - normal operation resumed');
   });
   
   intakeBreaker.fallback(() => {
     return {message: 'AI intake unavailable - please use manual form', fallbackActive: true};
   });
   ```
3. Create circuit breakers for extraction, coding, conflicts (similar structure)
4. Wrap AI service calls:
   ```typescript
   // ai-intake.service.ts
   async function generateResponse(userMessage: string) {
     try {
       const response = await intakeBreaker.fire(userMessage);
       return response;
     } catch (error) {
       if (intakeBreaker.opened) {
         return {message: 'AI features temporarily unavailable', fallbackActive: true};
       }
       throw error;
     }
   }
   ```
5. Fallback logic (circuit-breaker-fallbacks.ts):
   - intakeFallback: Disable chat UI, show manual form only (component prop: aiAvailable={false})
   - extractionFallback: UPDATE documents SET status='queued', add to Bull retry queue
   - codingFallback: Return {message: 'AI suggestion unavailable - use manual coding', codes: []}
   - conflictFallback: Use local drug interaction database (simple rule checks)
6. GET /api/admin/circuit-breaker-status:
   ```typescript
   async function getCircuitBreakerStatus(req, res) {
     const status = {
       intakeBreaker: {
         state: intakeBreaker.opened ? 'open' : (intakeBreaker.halfOpen ? 'half-open' : 'closed'),
         lastStateChange: intakeBreaker.stats.lastFailureTime,
         failureRate: intakeBreaker.stats.failures / intakeBreaker.stats.fires * 100,
         totalCalls: intakeBreaker.stats.fires,
         successfulCalls: intakeBreaker.stats.successes,
         failedCalls: intakeBreaker.stats.failures
       },
       extractionBreaker: {...},
       codingBreaker: {...},
       conflictBreaker: {...}
     };
     res.json(status);
   }
   ```
7. Admin dashboard CircuitBreakerStatus component:
   - Fetch GET /api/admin/circuit-breaker-status
   - Display traffic lights: Green (closed), Yellow (half-open), Red (open)
   - Click indicator: Opens modal with 24h state transition history
8. User-facing AIFeatureUnavailableBanner:
   - Displays when circuit open: "AI features temporarily unavailable. You can still use manual options."
   - Shown on AI intake page, document upload page, medical coding page
9. Background retry job (document-extraction-retry.ts):
   - Bull queue: 'document-extraction-retry-queue'
   - Cron schedule: Every 5 minutes
   - Query: SELECT * FROM documents WHERE status='queued' ORDER BY created_at ASC LIMIT 10
   - Rate limit: Process 10 documents per iteration (max 10/minute)
   - Retry extraction: Call extractionBreaker.fire(documentPath)
10. Prometheus metrics:
    ```typescript
    const circuitBreakerStateGauge = new Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
      labelNames: ['endpoint']
    });
    
    intakeBreaker.on('open', () => {
      circuitBreakerStateGauge.set({endpoint: 'ai-intake'}, 2);
    });
    ```

## Current Project State
```
ASSIGNMENT/
├── server/src/services/ (AI services exist)
├── server/src/middleware/ (to be created)
└── (circuit breaker to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/middleware/circuit-breaker.ts | Circuit breaker instances |
| CREATE | server/src/services/circuit-breaker-fallbacks.ts | Fallback logic |
| CREATE | server/src/controllers/circuit-breaker.controller.ts | Status endpoints |
| CREATE | server/src/routes/circuit-breaker.routes.ts | Circuit breaker routes |
| CREATE | server/src/jobs/document-extraction-retry.ts | Retry job |
| CREATE | app/src/components/CircuitBreakerStatus.tsx | Dashboard status |
| CREATE | app/src/components/AIFeatureUnavailableBanner.tsx | Fallback banner |
| UPDATE | server/src/services/ai-intake.service.ts | Wrap with intakeBreaker |
| UPDATE | server/src/services/document-extraction.service.ts | Wrap with extractionBreaker |
| UPDATE | server/src/services/medical-coding.service.ts | Wrap with codingBreaker |
| UPDATE | server/src/services/medication-conflicts.service.ts | Wrap with conflictBreaker |

## External References
- [Opossum Circuit Breaker](https://github.com/nodeshift/opossum)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [NFR-REL01 Graceful Degradation](../../../.propel/context/docs/spec.md#NFR-REL01)
- [NFR-REL02 Circuit Breaker](../../../.propel/context/docs/spec.md#NFR-REL02)
- [TR-004 Resilience Patterns](../../../.propel/context/docs/spec.md#TR-004)

## Build Commands
```bash
cd server
npm install opossum
npm run dev

# Test circuit breaker (simulate OpenAI failures)
curl -X POST http://localhost:3001/api/ai/intake \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "test"}' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: Circuit breaker opens after >50% failures in 1min window
- [ ] Integration tests: Fallback logic activates when circuit open
- [ ] opossum installed: package.json shows opossum@8.x
- [ ] Circuit breakers created: intakeBreaker, extractionBreaker, codingBreaker, conflictBreaker
- [ ] Configuration: errorThresholdPercentage=50%, requestVolumeThreshold=10, timeout=30s, resetTimeout=60s
- [ ] Closed state: AI services work normally, circuit breaker transparent
- [ ] Simulate failures: Send 15 requests to OpenAI with 10 failures → circuit opens
- [ ] Open state: Subsequent requests blocked, fallback responses returned immediately
- [ ] Fallback - AI intake: Circuit open → disable chat UI, show manual form only
- [ ] Fallback - Extraction: Circuit open → documents marked 'queued', retried later
- [ ] Fallback - Coding: Circuit open → message "AI suggestion unavailable"
- [ ] Fallback - Conflicts: Circuit open → basic rule-based validation only
- [ ] Half-Open state: After 60s cooldown, single test request sent
- [ ] Recovery success: Test request succeeds → circuit closes, normal operation resumes
- [ ] Recovery failure: Test request fails → circuit stays open, exponential backoff (60s → 120s → 300s)
- [ ] Audit logging: Query audit_logs → see circuit_breaker_state_change entries with timestamps
- [ ] Admin notification: Circuit opens → email/SMS sent to admin
- [ ] Admin dashboard status: GET /admin/circuit-breaker-status → returns states for all breakers
- [ ] CircuitBreakerStatus component: Displays traffic lights (green/yellow/red) per endpoint
- [ ] State transition history: Click indicator → modal shows 24h chart of state changes
- [ ] User-facing banner: AIFeatureUnavailableBanner shows "AI features temporarily unavailable"
- [ ] Background retry job: Queued documents processed 10/minute when circuit recovers
- [ ] Prometheus metrics: circuit_breaker_state gauge exported, Grafana dashboards show state
- [ ] Rate limit handling: OpenAI 429 error → circuit opens, respects rate limits

## Implementation Checklist
- [ ] Install opossum: `npm install opossum`
- [ ] Create circuit-breaker.ts with 4 breaker instances
- [ ] Configure circuit breaker options (thresholds, timeouts, cooldown)
- [ ] Implement event listeners (open, halfOpen, close)
- [ ] Create circuit-breaker-fallbacks.ts with fallback logic for each service
- [ ] Wrap AI service calls with circuit breakers
- [ ] Create circuit-breaker.controller.ts + routes.ts
- [ ] Implement GET /admin/circuit-breaker-status endpoint
- [ ] Create document-extraction-retry.ts background job
- [ ] Create CircuitBreakerStatus.tsx dashboard component
- [ ] Create AIFeatureUnavailableBanner.tsx user-facing component
- [ ] Add Prometheus metrics for circuit breaker states
- [ ] Test circuit breaker state transitions
- [ ] Test fallback logic for each AI service
- [ ] Validate admin notification on circuit open
- [ ] Document circuit breaker behavior in server/README.md
