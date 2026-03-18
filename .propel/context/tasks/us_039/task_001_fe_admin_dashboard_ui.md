# Task - TASK_001_FE_ADMIN_DASHBOARD_UI

## Requirement Reference
- User Story: US_039
- Story Location: `.propel/context/tasks/us_039/us_039.md`
- Acceptance Criteria:
    - AC1: Admin Dashboard displays real-time metrics updated every 30s via WebSocket: Current Queue Size, Average Wait Time, Today's Appointments (scheduled, checked-in, completed, no-shows), system health (API Response Times, AI Service Status, DB Connection Pool, Redis Cache Hit Rate), operational KPIs (Total Appointments, No-Show Rate, Avg Booking Lead Time, Insurance Verification Success Rate, Patient Satisfaction), charts (Line: daily appointments, Bar: no-shows by weekday, Pie: appointment types), filter by date range, export CSV, alerts section for system issues
- Edge Cases:
    - WebSocket connection drops: Fallback to polling every 60s, show "Real-time sync paused" warning
    - Historical metrics: Daily aggregates saved, 90-day retention (TR-006)
    - No data for date range: Show "No appointments in this period" with option to select different range

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Admin dashboard page) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-004 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-004-admin-dashboard.html |
| **Screen Spec** | SCR-004 (Admin Dashboard) |
| **UXR Requirements** | NFR-PERF01 (WebSocket updates <30s), NFR-REL03 (Health monitoring), TR-006 (90-day retention), UXR-203 (Dashboard layout best practices), UXR-302 (Real-time data visualization) |
| **Design Tokens** | Metrics cards: 300px width, white bg, shadow sm, Value: bold 32pt, Trend arrow: green up/red down, Charts: Chart.js default theme, Health indicators: traffic lights (Green >80%, Yellow 50-80%, Red <50%), Alert banner: red bg #FEE, Export button: secondary #6C757D |

> **Wireframe Components:**
> - Header: "Admin Dashboard" title, date range selector (dropdown), "Export CSV" button, "Live" status indicator (green dot)
> - Top metrics cards (4 in row): Current Queue Size (large number + trend arrow + sparkline), Average Wait Time (minutes + target indicator), Today's Appointments (fraction 45/60), No-Show Rate (% + daily comparison)
> - System Health panel: 4 traffic lights (API Speed ms, AI Service %, DB Connections %, Cache Hit Rate %), click indicator opens details modal with 24h trend chart
> - Main charts section: Line chart (daily appointments 7-day view), Bar chart (no-shows by weekday Mon-Sun), Pie chart (appointment types)
> - Alerts section: Red banner if critical issues, yellow warning box non-critical, each with timestamp + description + Dismiss or View Details button
> - Auto-refresh indicator: Header small icon "Live" with green dot pulse, last updated timestamp

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Frontend | Socket.IO Client | 4.x |
| Frontend | Chart.js | 4.x |
| Frontend | react-chartjs-2 | 5.x |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | Socket.IO | 4.x |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |

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
| **Mobile Impact** | Yes (Responsive layout) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement Admin Dashboard UI: (1) AdminDashboard page with WebSocket connection to backend, (2) MetricsCards component displays 4 real-time metrics (current queue size, avg wait time, today's appointments, no-show rate), (3) SystemHealthPanel with traffic light indicators (green/yellow/red) for API speed, AI service, DB connections, cache hit rate, (4) DashboardCharts component with Chart.js (line chart for daily appointments, bar chart for no-shows by weekday, pie chart for appointment types), (5) Date range selector dropdown (Today/Last 7 Days/Last 30 Days/Custom) with react-date-range calendar picker, (6) Export CSV button downloads metrics as CSV file, (7) AlertsSection displays system issues with dismiss/view details buttons, (8) Auto-refresh indicator shows "Live" status with green dot pulse animation + last updated timestamp, (9) WebSocket fallback: If connection drops, switch to polling every 60s + show warning "Real-time sync paused", (10) Responsive layout: Mobile stacks cards vertically, desktop 4-column grid.

## Dependent Tasks
- US_039 Task 002: Admin Dashboard API (WebSocket server, metrics endpoints)
- US_005: Prometheus (system health monitoring)
- US_010: RBAC (admin role required)

## Impacted Components
**New:**
- app/src/pages/AdminDashboard.tsx (Dashboard page)
- app/src/components/MetricsCards.tsx (Top 4 metrics cards)
- app/src/components/SystemHealthPanel.tsx (Health indicators)
- app/src/components/DashboardCharts.tsx (Chart.js charts)
- app/src/components/AlertsSection.tsx (System alerts)
- app/src/components/DateRangeSelector.tsx (Date filter)
- app/src/hooks/useAdminDashboard.ts (WebSocket + polling logic)
- app/src/utils/exportMetricsCSV.ts (CSV export utility)

**Modified:**
- app/src/App.tsx (Add /admin/dashboard route)

## Implementation Plan
1. Install dependencies: `npm install socket.io-client chart.js react-chartjs-2 react-date-range`
2. Create useAdminDashboard hook:
   - Connect to WebSocket: io('http://localhost:3001', {query: {token: jwtToken}})
   - Listen to 'metrics-update' event: socket.on('metrics-update', setMetrics)
   - Fallback: If socket disconnects, switch to polling GET /api/admin/metrics every 60s
   - Return {metrics, isLive, lastUpdated}
3. MetricsCards component:
   - 4 cards: {CurrentQueueSize, AvgWaitTime, TodayAppointments, NoShowRate}
   - Each card: Title, Value (large 32pt), Trend arrow (↑ green, ↓ red), Sparkline mini chart (Chart.js Line with 7-day data)
4. SystemHealthPanel:
   - 4 traffic lights: API Speed (green if <500ms, yellow 500-1000ms, red >1000ms), AI Service (green if >95% success, yellow 80-95%, red <80%), DB Connections (green if <80% of max, yellow 80-95%, red >95%), Cache Hit Rate (green if >80%, yellow 50-80%, red <50%)
   - Click indicator: Opens modal with Chart.js line chart showing 24h trend
5. DashboardCharts:
   - Line chart: X-axis=last 7 days, Y-axis=appointment count, dataset from metrics.dailyAppointments[]
   - Bar chart: X-axis=Mon-Sun, Y-axis=no-show count, dataset from metrics.noshowsByWeekday[]
   - Pie chart: Labels=['Online Booking', 'Walk-in', 'Staff Booked'], dataset from metrics.appointmentTypeDistribution
6. DateRangeSelector: Dropdown with options (Today, Last 7 Days, Last 30 Days, Custom), if Custom selected, show react-date-range DateRangePicker
7. Export CSV: exportMetricsCSV function formats metrics as CSV rows, creates Blob, triggers download
8. AlertsSection: Displays metrics.alerts[] array, each alert with {severity: 'critical'|'warning', message, timestamp}, dismissible with button
9. Auto-refresh indicator: Header with "Live" text + green dot (pulse animation), lastUpdated timestamp (e.g., "Last updated: 2 minutes ago")
10. Layout: Desktop: 4-column grid for metrics cards, 2-column for charts, Mobile: Single column stack

## Current Project State
```
ASSIGNMENT/
├── app/src/pages/ (user management exists)
├── app/src/hooks/ (auth hooks exist)
└── (admin dashboard to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | app/src/pages/AdminDashboard.tsx | Dashboard page |
| CREATE | app/src/components/MetricsCards.tsx | Metrics cards |
| CREATE | app/src/components/SystemHealthPanel.tsx | Health panel |
| CREATE | app/src/components/DashboardCharts.tsx | Charts component |
| CREATE | app/src/components/AlertsSection.tsx | Alerts section |
| CREATE | app/src/components/DateRangeSelector.tsx | Date filter |
| CREATE | app/src/hooks/useAdminDashboard.ts | WebSocket logic |
| CREATE | app/src/utils/exportMetricsCSV.ts | CSV export |
| UPDATE | app/src/App.tsx | Add /admin/dashboard route |

## External References
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [react-chartjs-2](https://react-chartjs-2.js.org/)
- [react-date-range](https://github.com/hypeserver/react-date-range)
- [NFR-PERF01 WebSocket <30s](../../../.propel/context/docs/spec.md#NFR-PERF01)
- [TR-006 90-Day Retention](../../../.propel/context/docs/spec.md#TR-006)

## Build Commands
```bash
cd app
npm install socket.io-client chart.js react-chartjs-2 react-date-range
npm run dev
```

## Implementation Validation Strategy
- [ ] Unit tests: useAdminDashboard connects to WebSocket, receives metrics
- [ ] Integration tests: AdminDashboard renders metrics cards
- [ ] Socket.IO client installed: package.json shows socket.io-client@4.x
- [ ] Chart.js installed: package.json shows chart.js@4.x, react-chartjs-2@5.x
- [ ] Dashboard route: Navigate to /admin/dashboard → page renders
- [ ] Metrics cards: 4 cards displayed (Current Queue, Avg Wait Time, Today's Appts, No-Show Rate)
- [ ] Sparklines: Each card shows mini line chart with 7-day trend
- [ ] Trend arrows: Cards show ↑ green or ↓ red arrow based on comparison
- [ ] System health: Panel displays 4 traffic lights (green/yellow/red) for API/AI/DB/Cache
- [ ] Click health indicator: Opens modal with Chart.js 24h trend chart
- [ ] Line chart: Shows daily appointments for last 7 days with hover tooltips
- [ ] Bar chart: Shows no-shows by weekday (Mon-Sun)
- [ ] Pie chart: Shows appointment types distribution (Online/Walk-in/Staff)
- [ ] Date range selector: Dropdown with Today/Last 7 Days/Last 30 Days/Custom options
- [ ] Custom date picker: Select Custom → react-date-range calendar opens
- [ ] Export CSV: Click "Export CSV" → downloads metrics.csv file
- [ ] Alerts section: Displays system issues with red banner (critical) or yellow box (warning)
- [ ] Auto-refresh: "Live" indicator with green dot pulse, updates every 30s
- [ ] WebSocket updates: Metrics refresh without jarring page reload
- [ ] Fallback polling: Disconnect WebSocket → warning "Real-time sync paused", polls every 60s
- [ ] No data: Select date range with no appointments → shows "No appointments in this period"
- [ ] Responsive: Mobile view stacks cards vertically, desktop displays 4-column grid
- [ ] WCAG AA: Keyboard Tab navigation, 4.5:1 contrast, screen reader compatible

## Implementation Checklist
- [ ] Install Socket.IO client: `npm install socket.io-client`
- [ ] Install Chart.js: `npm install chart.js react-chartjs-2`
- [ ] Install react-date-range: `npm install react-date-range`
- [ ] Create useAdminDashboard.ts hook with WebSocket connection
- [ ] Implement fallback polling logic
- [ ] Create AdminDashboard.tsx page
- [ ] Create MetricsCards.tsx with sparklines
- [ ] Create SystemHealthPanel.tsx with traffic lights
- [ ] Create DashboardCharts.tsx with Chart.js (Line, Bar, Pie)
- [ ] Create DateRangeSelector.tsx with react-date-range
- [ ] Create AlertsSection.tsx
- [ ] Implement exportMetricsCSV.ts utility
- [ ] Add /admin/dashboard route to App.tsx
- [ ] Test WebSocket connection + metrics updates
- [ ] Test fallback polling when WebSocket drops
- [ ] Validate responsive layout (mobile + desktop)
- [ ] Document dashboard features in app/README.md
