# UPACI Platform — Windows Deployment Runbook

> **Version**: 1.0  
> **Last Updated**: 2025-01-20  
> **Platform**: Unified Patient Access & Clinical Intelligence (UPACI)  
> **Target OS**: Windows Server 2019 / 2022

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [IIS Installation](#2-iis-installation)
3. [Backend Windows Service Setup](#3-backend-windows-service-setup)
4. [Frontend Deployment](#4-frontend-deployment)
5. [SSL Certificate Installation](#5-ssl-certificate-installation)
6. [Reverse Proxy Configuration](#6-reverse-proxy-configuration)
7. [Firewall Rules](#7-firewall-rules)
8. [Health Check Verification](#8-health-check-verification)
9. [Monitoring Setup](#9-monitoring-setup)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### System Requirements

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| OS | Windows Server 2019 | Windows Server 2022 |
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4 cores |
| Disk | 20 GB free | 50 GB free |
| .NET Framework | 4.8+ | 4.8+ |

### Software Requirements

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 20.x LTS | <https://nodejs.org/> |
| Git | Latest | <https://git-scm.com/> |
| URL Rewrite Module | 2.1 | <https://www.iis.net/downloads/microsoft/url-rewrite> |
| ARR 3.0 | 3.0 | <https://www.iis.net/downloads/microsoft/application-request-routing> |

### Pre-Deployment Checklist

- [ ] Windows Server 2019/2022 fully patched
- [ ] Administrator access confirmed
- [ ] Node.js 20.x LTS installed (`node --version`)
- [ ] npm available (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Domain DNS configured to point to server IP
- [ ] SSL certificate available (PFX or Let's Encrypt)
- [ ] Source code cloned to deployment directory

---

## 2. IIS Installation

### Run the IIS installation script

```powershell
# Open PowerShell as Administrator
cd C:\path\to\upaci\server\scripts
.\install-iis-features.ps1
```

### What this installs

- IIS Web Server (Web-Server, Web-WebServer)
- Static content, default documents, HTTP errors
- HTTP redirect, request filtering
- Static and dynamic compression
- Management console
- Application Pool: **UPACI-Frontend** (No Managed Code, ApplicationPoolIdentity, AlwaysRunning)
- IIS Site: **UPACI-Frontend** on port 80

### Verification

```powershell
# Verify IIS is running
Get-Service W3SVC | Select-Object Status, Name, DisplayName

# Verify app pool exists
Get-WebAppPoolState -Name "UPACI-Frontend"

# Verify site exists
Get-Website -Name "UPACI-Frontend"
```

**Expected**: W3SVC service Running, App Pool Started, Site Started.

<!-- Screenshot: IIS Manager showing UPACI-Frontend site and app pool -->

---

## 3. Backend Windows Service Setup

### Install dependencies and build

```powershell
cd C:\path\to\upaci\server
npm install
npm run build
```

### Set up production logging directory

```powershell
.\scripts\setup-logging.ps1
```

This creates `C:\Logs\UPACI\` with correct NETWORK SERVICE / LOCAL SERVICE permissions.

### Create production environment file

```powershell
# Copy template and edit with actual values
Copy-Item .env.production .env
# Edit .env with production database credentials, Redis URL, JWT secrets
```

### Install the Windows Service

```powershell
node install-service.js
```

### Verification

```powershell
# Check service status
Get-Service -Name "UPACI-Backend"

# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
```

**Expected**: Service status Running. Health endpoint returns `{"status":"healthy"}`.

<!-- Screenshot: Services.msc showing UPACI-Backend service Running -->

### Uninstall (if needed)

```powershell
node uninstall-service.js
```

---

## 4. Frontend Deployment

### Deploy the React frontend to IIS

```powershell
cd C:\path\to\upaci\server\scripts
.\deploy-frontend.ps1
```

### What this does

1. Runs `npm run build` in the app directory (Vite output to `dist/`)
2. Copies build artifacts to `C:\inetpub\wwwroot\upaci-frontend\`
3. Verifies critical files (index.html, web.config, healthcheck.html)
4. Sets IIS_IUSRS read permissions

### Verification

```powershell
# Check files deployed
Get-ChildItem C:\inetpub\wwwroot\upaci-frontend\ | Select-Object Name, Length

# Test frontend
Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing | Select-Object StatusCode
```

**Expected**: StatusCode 200, index.html served.

<!-- Screenshot: Browser showing UPACI login page -->

---

## 5. SSL Certificate Installation

### Option A: Let's Encrypt (automated via win-acme)

```powershell
.\configure-ssl.ps1 -Domain "upaci.yourdomain.com" -UseLetsEncrypt
```

### Option B: Manual PFX import

```powershell
.\configure-ssl.ps1 -Domain "upaci.yourdomain.com" -PfxPath "C:\certs\upaci.pfx" -PfxPassword "your-password"
```

### Verification

```powershell
# Check HTTPS binding
Get-WebBinding -Name "UPACI-Frontend" | Where-Object { $_.protocol -eq "https" }

# Test HTTPS
Invoke-WebRequest -Uri "https://upaci.yourdomain.com/" -UseBasicParsing | Select-Object StatusCode
```

**Expected**: HTTPS binding on port 443 with SNI, StatusCode 200.

<!-- Screenshot: IIS Manager showing HTTPS binding with certificate -->

---

## 6. Reverse Proxy Configuration

### Install Application Request Routing (ARR)

```powershell
.\install-arr.ps1
```

### What this configures

1. Verifies ARR 3.0 module installed
2. Enables ARR reverse proxy at server level
3. Installs WebSocket protocol support (Web-WebSockets)
4. Registers allowed server variables: `HTTP_X_FORWARDED_FOR`, `HTTP_X_FORWARDED_PROTO`

### Proxy rules (configured in web.config)

The `web.config` at `C:\inetpub\wwwroot\upaci-frontend\` contains:

| Rule | Pattern | Target | Purpose |
|------|---------|--------|---------|
| HTTP to HTTPS redirect | `(.*)` on HTTP | `https://{HTTP_HOST}/{R:1}` | Force HTTPS |
| API Proxy | `^api/(.*)` | `http://localhost:3000/api/{R:1}` | Backend API |
| WebSocket Proxy | `^socket\.io/(.*)` | `http://localhost:3000/socket.io/{R:1}` | Real-time events |
| SPA Fallback | `.*` (non-file) | `/` | React client routing |

### Verification

```powershell
# Test API proxy — should return backend health response
Invoke-WebRequest -Uri "https://localhost/api/health" -UseBasicParsing -SkipCertificateCheck

# Verify X-Forwarded headers reach backend (check backend logs)
# Expected log entry: "X-Forwarded-For: <client-ip>, X-Forwarded-Proto: https"
```

**Expected**: API proxy returns `{"status":"healthy"}` from backend at localhost:3000.

<!-- Screenshot: IIS URL Rewrite showing API Proxy and WebSocket Proxy rules -->

---

## 7. Firewall Rules

### Configure Windows Firewall

```powershell
.\configure-firewall.ps1
```

### Rules created

| Rule | Direction | Protocol | Port | Action | Profiles |
|------|-----------|----------|------|--------|----------|
| UPACI HTTP | Inbound | TCP | 80 | Allow | Domain, Private, Public |
| UPACI HTTPS | Inbound | TCP | 443 | Allow | Domain, Private, Public |
| UPACI Block Backend Direct | Inbound | TCP | 3000 | Block | Public |

### Verification

```powershell
# List UPACI firewall rules
Get-NetFirewallRule -DisplayName "UPACI*" | Format-Table DisplayName, Direction, Action, Enabled

# Test from external machine
Test-NetConnection -ComputerName <server-ip> -Port 443
```

**Expected**: Ports 80/443 open externally. Port 3000 blocked from public networks (only accessible via localhost IIS proxy).

<!-- Screenshot: Windows Firewall showing UPACI rules -->

---

## 8. Health Check Verification

### Configure IIS Application Initialization

```powershell
.\configure-health-monitoring.ps1
```

### What this configures

- Installs `Web-AppInit` IIS feature
- Sets App Pool `startMode` to `AlwaysRunning`
- Disables idle timeout (keeps app pool alive)
- Enables `preloadEnabled` on UPACI-Frontend site
- Verifies `applicationInitialization` config in web.config

### Health check endpoints

| Endpoint | Type | Expected Response |
|----------|------|-------------------|
| `/healthcheck.html` | Frontend (static) | HTTP 200, body "OK" |
| `/api/health` | Backend (via proxy) | HTTP 200, JSON `{"status":"healthy"}` |

### Verification

```powershell
# Frontend health
Invoke-WebRequest -Uri "https://upaci.yourdomain.com/healthcheck.html" -UseBasicParsing

# Backend health (via reverse proxy)
Invoke-WebRequest -Uri "https://upaci.yourdomain.com/api/health" -UseBasicParsing

# Restart IIS and verify auto-preload
iisreset /restart
# Wait 10 seconds, then check IIS logs for /healthcheck.html request
Get-Content "C:\inetpub\logs\LogFiles\W3SVC*\*.log" -Tail 20
```

**Expected**: Both endpoints return HTTP 200. After IIS restart, `/healthcheck.html` is automatically requested by Application Initialization.

<!-- Screenshot: Browser showing /api/health JSON response -->

---

## 9. Monitoring Setup

### Run a manual monitoring check

```powershell
.\monitor-service.ps1
```

### Sample output

```
[UPACI] Monitoring service: UPACI-Backend
  Timestamp: 2025-01-20 14:30:00

  Service Status:  Running
  Start Type:      Automatic
  CPU Usage:       2.35%
  Memory Usage:    156.42 MB
  Uptime:          5d 3h 22m
  API Health:      healthy

  Metrics appended to: C:\Logs\UPACI\service-monitor.csv
```

### Install scheduled monitoring (every 5 minutes)

```powershell
.\monitor-service.ps1 -InstallScheduledTask -IntervalMinutes 5
```

### Remove scheduled monitoring

```powershell
.\monitor-service.ps1 -RemoveScheduledTask
```

### Verification

```powershell
# Check scheduled task exists
Get-ScheduledTask -TaskName "UPACI Service Monitor"

# Check monitoring log
Import-Csv "C:\Logs\UPACI\service-monitor.csv" | Select-Object -Last 5 | Format-Table
```

**Expected**: Scheduled task registered. CSV log growing every 5 minutes with service metrics.

<!-- Screenshot: Task Scheduler showing UPACI Service Monitor task -->
<!-- Screenshot: CSV log in Excel showing service metrics over time -->

---

## 10. Troubleshooting

### Common Issues

#### Service won't start

```powershell
# Check Windows Event Log for UPACI errors
Get-EventLog -LogName Application -Source "UPACI" -Newest 10 | Format-List

# Check service error
Get-WinEvent -FilterHashtable @{LogName='System'; Level=2} -MaxEvents 20 |
    Where-Object { $_.Message -like "*UPACI*" }

# Check application logs
Get-Content "C:\Logs\UPACI\error.log" -Tail 50
```

**Common causes**: Missing .env file, database connection failure, port 3000 already in use.

#### IIS returns 502 Bad Gateway

```powershell
# Verify backend service is running
Get-Service -Name "UPACI-Backend"

# Verify backend is listening on port 3000
Test-NetConnection -ComputerName localhost -Port 3000

# Verify ARR proxy is enabled
Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled"
```

**Common causes**: Backend service stopped, ARR not enabled, port mismatch.

#### SSL certificate errors

```powershell
# Check certificate binding
netsh http show sslcert

# Check certificate expiry
Get-ChildItem Cert:\LocalMachine\WebHosting | Select-Object Subject, NotAfter, Thumbprint
```

**Common causes**: Expired certificate, missing intermediate CA, wrong binding hostname.

#### WebSocket connection fails

```powershell
# Verify WebSocket module installed
Get-WindowsFeature -Name "Web-WebSockets"

# Verify ARR configuration
Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled"

# Check web.config for socket.io rule
Select-String -Path "C:\inetpub\wwwroot\upaci-frontend\web.config" -Pattern "socket.io"
```

**Common causes**: Web-WebSockets feature not installed, ARR proxy not enabled, missing socket.io rewrite rule.

#### High memory or CPU usage

```powershell
# Check Node.js process
Get-Process -Name "node" | Select-Object CPU, WorkingSet64, StartTime

# Check monitoring log for trends
Import-Csv "C:\Logs\UPACI\service-monitor.csv" | Select-Object -Last 50 |
    Sort-Object Memory_MB -Descending | Select-Object -First 5
```

**Common causes**: Memory leak, high traffic, unoptimized queries.

### Useful Commands Reference

| Task | Command |
|------|---------|
| Restart backend service | `Restart-Service -Name "UPACI-Backend"` |
| Restart IIS | `iisreset /restart` |
| Restart app pool | `Restart-WebAppPool -Name "UPACI-Frontend"` |
| View backend logs | `Get-Content "C:\Logs\UPACI\combined.log" -Tail 100` |
| View error logs | `Get-Content "C:\Logs\UPACI\error.log" -Tail 50` |
| View IIS logs | `Get-Content "C:\inetpub\logs\LogFiles\W3SVC*\*.log" -Tail 50` |
| Check all UPACI services | `Get-Service -Name "*UPACI*"` |
| Test API health | `Invoke-WebRequest "http://localhost:3000/api/health" -UseBasicParsing` |
| Redeploy frontend | `.\deploy-frontend.ps1` |
| Monitor service | `.\monitor-service.ps1` |

---

## Deployment Order Summary

Execute the scripts in this order for a clean deployment:

```
1. .\install-iis-features.ps1       # IIS roles, app pool, site
2. .\setup-logging.ps1              # Logging directory permissions
3. node install-service.js           # Backend Windows Service
4. .\deploy-frontend.ps1            # React frontend to IIS
5. .\configure-ssl.ps1              # SSL certificate
6. .\install-arr.ps1                # ARR reverse proxy
7. .\configure-firewall.ps1         # Firewall rules
8. .\configure-health-monitoring.ps1 # Health checks
9. .\monitor-service.ps1 -InstallScheduledTask  # Scheduled monitoring
```

After deployment, verify with:

```powershell
# Full verification suite
Invoke-WebRequest "https://upaci.yourdomain.com/" -UseBasicParsing             # Frontend
Invoke-WebRequest "https://upaci.yourdomain.com/healthcheck.html" -UseBasicParsing  # Health
Invoke-WebRequest "https://upaci.yourdomain.com/api/health" -UseBasicParsing    # API proxy
Get-Service -Name "UPACI-Backend"                                                # Backend service
Get-NetFirewallRule -DisplayName "UPACI*"                                        # Firewall
Get-ScheduledTask -TaskName "UPACI Service Monitor"                              # Monitoring
```
