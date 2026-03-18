# Dashboard User Guide

## Overview

This guide explains the pre-configured UPACI monitoring dashboards, their panels, metrics, and how to interpret the data.

## Dashboard Architecture

The monitoring solution includes three specialized dashboards:

1. **System Health** - Overall platform reliability and performance
2. **API Performance** - Endpoint-specific metrics and latency
3. **Infrastructure** - Node.js runtime and resource utilization

## 1. UPACI System Health Dashboard

**Purpose**: Monitor overall system reliability, request performance, and resource usage.

**Default Time Range**: Last 24 hours  
**Refresh Interval**: 10 seconds

### Panels

#### 1.1 Uptime (30-day Rolling Window)

**Metric**: Service availability percentage over 30 days  
**Query**: `avg_over_time(up{job="upaci-backend"}[30d]) * 100`

**Visualization**: Stat panel with color thresholds
- 🔴 Red: <99.9% (SLA breach)
- 🟡 Yellow: 99.9-99.95%
- 🟢 Green: ≥99.95%

**Interpretation**:
- Target: ≥99.9% (max 43 minutes downtime/month)
- Values <99.9% indicate SLA violations
- Investigate service restarts or network issues if dropping

#### 1.2 Error Rate

**Metric**: Percentage of 5xx errors vs total requests  
**Query**: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100`

**Visualization**: Gauge with thresholds
- 🟢 Green: <0.5%
- 🟡 Yellow: 0.5-1%
- 🔴 Red: ≥1%

**Interpretation**:
- Target: <0.5% error rate
- Spike indicates application errors or database issues
- Check logs and recent deployments if elevated

#### 1.3 Active Connections

**Metric**: Current number of active client connections  
**Query**: `active_connections{job="upaci-backend"}`

**Visualization**: Stat panel showing current value

**Interpretation**:
- Normal: Varies with traffic patterns
- Sudden drop: Potential network/load balancer issue
- Sustained high: May indicate connection pool exhaustion

#### 1.4 Request Latency Percentiles

**Metrics**: Response time distribution across requests  
**Queries**:
- P50: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))`
- P95: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- P99: `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))`

**Visualization**: Time series graph with 3 lines

**Interpretation**:
- **P50 (median)**: 50% of requests complete within this time - typical user experience
- **P95**: 95% complete within this time - good performance indicator
- **P99**: 99% complete within this time - worst-case user experience
- Target: P95 <500ms, P99 <2s
- Growing spread between percentiles indicates inconsistent performance

#### 1.5 Request Rate by Status

**Metrics**: Requests per second categorized by HTTP status code  
**Queries**:
- Total: `sum(rate(http_requests_total[5m]))`
- 2xx: `sum(rate(http_requests_total{status_code=~"2.."}[5m]))`
- 4xx: `sum(rate(http_requests_total{status_code=~"4.."}[5m]))`
- 5xx: `sum(rate(http_requests_total{status_code=~"5.."}[5m]))`

**Visualization**: Stacked time series

**Interpretation**:
- Normal: Majority 2xx (success) responses
- Elevated 4xx: Client errors (validation, auth issues)
- Any 5xx: Application/server errors - investigate immediately

#### 1.6 CPU Usage

**Metric**: Process CPU utilization percentage  
**Query**: `rate(process_cpu_seconds_total[5m]) * 100`

**Visualization**: Time series graph

**Interpretation**:
- Normal: 30-60% during business hours
- >80% sustained: Potential performance bottleneck
- Correlate spikes with traffic increases or code deploys

#### 1.7 Memory Usage

**Metrics**: Process memory consumption in MB  
**Queries**:
- RSS: `process_resident_memory_bytes / 1024 / 1024`
- Heap Used: `nodejs_heap_size_used_bytes / 1024 / 1024`
- Heap Total: `nodejs_heap_size_total_bytes / 1024 / 1024`

**Visualization**: Time series with 3 lines

**Interpretation**:
- **RSS**: Total physical memory used by process
- **Heap Total**: Allocated V8 heap memory
- **Heap Used**: Actually used heap memory
- Watch for memory leaks (continuously climbing heap used)
- Gap between heap used/total is available memory buffer

## 2. UPACI API Performance Dashboard

**Purpose**: Analyze endpoint-specific performance and identify bottlenecks.

**Default Time Range**: Last 6 hours  
**Refresh Interval**: 10 seconds

### Panels

#### 2.1 Top 10 Endpoints by Request Count

**Metric**: Highest traffic endpoints by requests/second  
**Query**: `topk(10, sum by (route) (rate(http_requests_total{job="upaci-backend"}[5m])))`

**Visualization**: Table showing endpoint and req/s

**Interpretation**:
- Identify high-traffic routes
- Prioritize optimization efforts
- Spot unexpected traffic patterns

#### 2.2 Slowest Endpoints (P95 Latency)

**Metric**: Top 10 slowest endpoints by 95th percentile response time  
**Query**: `topk(10, histogram_quantile(0.95, sum by (route, le) (rate(http_request_duration_seconds_bucket[5m]))))`

**Visualization**: Table with endpoint and P95 latency (seconds)

**Interpretation**:
- Focus optimization on routes with P95 >2s
- Database queries or external API calls are common causes
- Compare with request count to prioritize impact

#### 2.3 Error Rate by Endpoint

**Metric**: Percentage of errors per endpoint over time  
**Query**: `sum by (route) (rate(http_requests_total{status_code=~"5.."}[5m])) / sum by (route) (rate(http_requests_total[5m])) * 100`

**Visualization**: Time series graph (one line per endpoint)

**Interpretation**:
- Isolate problematic endpoints
- Check recent code changes to specific routes
- Review endpoint-specific logs for error details

#### 2.4 Throughput by Endpoint

**Metric**: Requests per second for each endpoint  
**Query**: `sum by (route) (rate(http_requests_total{job="upaci-backend"}[5m]))`

**Visualization**: Time series graph

**Interpretation**:
- Understand traffic distribution across API
- Identify peak usage times per endpoint
- Plan capacity based on endpoint-specific load

## 3. UPACI Infrastructure Dashboard

**Purpose**: Monitor Node.js runtime health and infrastructure metrics.

**Default Time Range**: Last 6 hours  
**Refresh Interval**: 10 seconds

### Panels

#### 3.1 Node.js Heap Size

**Metrics**: V8 heap memory allocation and usage  
**Queries**:
- Total Heap: `nodejs_heap_size_total_bytes`
- Used Heap: `nodejs_heap_size_used_bytes`
- External Memory: `nodejs_external_memory_bytes`

**Visualization**: Time series graph (bytes)

**Interpretation**:
- Total Heap: Maximum allocated by V8
- Used Heap: Actually used memory - should flatten after GC
- External: Memory used outside V8 (buffers, etc.)
- Memory leak indicator: Used heap never decreases after GC

#### 3.2 Event Loop Lag

**Metric**: Event loop delay in milliseconds  
**Query**: `nodejs_eventloop_lag_seconds * 1000`

**Visualization**: Gauge with thresholds
- 🟢 Green: <10ms
- 🟡 Yellow: 10-50ms
- 🔴 Red: ≥50ms

**Interpretation**:
- Measures Node.js responsiveness
- High lag indicates CPU-intensive operations blocking event loop
- Target: <10ms for responsive API
- Investigate synchronous operations if elevated

#### 3.3 Garbage Collection Duration

**Metric**: Time spent in GC per second  
**Query**: `rate(nodejs_gc_duration_seconds_sum[5m])`

**Visualization**: Time series by GC type

**Interpretation**:
- Higher GC time = less time processing requests
- Frequent full GCs indicate memory pressure
- Target: <10% of CPU time in GC
- Consider heap size tuning if excessive

#### 3.4 File Descriptors

**Metrics**: Open and maximum file descriptors  
**Queries**:
- Open: `process_open_fds`
- Max: `process_max_fds`

**Visualization**: Time series comparing open vs max

**Interpretation**:
- File descriptors used for files, sockets, connections
- Approaching max indicates resource exhaustion
- Typical causes: connection leaks, file handle leaks
- Action: Increase ulimit or fix resource leaks

#### 3.5 Node.js Active Handles & Requests

**Metrics**: Active libuv handles and requests  
**Queries**:
- Active Handles: `nodejs_active_handles`
- Active Requests: `nodejs_active_requests`

**Visualization**: Time series

**Interpretation**:
- Handles: Open connections, timers, etc.
- Requests: Pending I/O operations
- Continuously growing indicates resource leaks
- Should correlate with active connections

#### 3.6 Garbage Collection Frequency

**Metric**: GC runs per second by type  
**Query**: `rate(nodejs_gc_runs_total[5m])`

**Visualization**: Stacked bar chart by GC type

**Interpretation**:
- Higher frequency with same heap size = memory churn
- Scavenge (minor GC): Fast, collects young generation
- Mark-Sweep-Compact (major GC): Slow, full heap collection
- Optimize object creation patterns if excessive

## Using PromQL Queries

All panels use PromQL (Prometheus Query Language). Common functions:

- **rate()**: Per-second rate of change over time range
- **avg_over_time()**: Average value over time range
- **histogram_quantile()**: Calculate percentile from histogram
- **sum by()**: Aggregate across label dimensions
- **topk()**: Return top N time series by value

## Dashboard Customization

### Changing Time Ranges

1. Click time range picker (top-right)
2. Select preset or enter custom range
3. Use zoom (click-drag on graph) for detailed view

### Adding Variables

1. Dashboard Settings > Variables
2. Add variable (e.g., `$environment`, `$instance`)
3. Use in queries: `{job="upaci-backend", env="$environment"}`

### Modifying Panels

1. Click panel title > Edit
2. Modify query, visualization, thresholds
3. Save dashboard (requires Editor role)

## Best Practices

1. **Regular Monitoring**: Review dashboards daily during business hours
2. **Set Up Alerts**: Configure notifications for threshold breaches
3. **Correlate Metrics**: Cross-reference panels to identify root causes
4. **Baseline Establishment**: Understand normal patterns to spot anomalies
5. **Time Zone Awareness**: All timestamps in browser local time
6. **Annotation Usage**: Mark deployments/incidents on graphs for context

## Troubleshooting Dashboard Issues

### Panel Shows "No Data"

- Verify Prometheus is scraping metrics
- Check query syntax in panel edit mode
- Confirm time range includes data
- Validate metric name exists in Prometheus

### Query Too Slow

- Reduce time range
- Increase query interval (step)
- Simplify PromQL query
- Add recording rules for complex queries

### Inconsistent Data

- Check Prometheus retention settings
- Verify scrape interval consistency
- Review backend metrics export format
- Validate histogram bucket boundaries

## Additional Resources

- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Panel Documentation](https://grafana.com/docs/grafana/latest/panels/)
- [Histogram vs Summary Metrics](https://prometheus.io/docs/practices/histograms/)
