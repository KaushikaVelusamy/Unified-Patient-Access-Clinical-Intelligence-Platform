# monitor-service.ps1
# Monitors UPACI-Backend Windows Service status, CPU, memory, and uptime.
# Can be run manually or scheduled via Windows Task Scheduler.
# Run as Administrator for full metrics access.

#Requires -RunAsAdministrator

param(
    [string]$ServiceName = "UPACI-Backend",
    [string]$LogPath = "C:\Logs\UPACI\service-monitor.csv",
    [switch]$InstallScheduledTask,
    [switch]$RemoveScheduledTask,
    [int]$IntervalMinutes = 5
)

$taskName = "UPACI Service Monitor"

# --- Install Task Scheduler task ---
if ($InstallScheduledTask) {
    Write-Host "[UPACI] Installing scheduled task: $taskName (every $IntervalMinutes minutes)..." -ForegroundColor Cyan

    $scriptPath = $MyInvocation.MyCommand.Path
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

    $trigger = New-ScheduledTaskTrigger `
        -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
        -RepetitionDuration (New-TimeSpan -Days 365)

    $principal = New-ScheduledTaskPrincipal `
        -UserId "SYSTEM" `
        -LogonType ServiceAccount `
        -RunLevel Highest

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)

    # Remove existing task if present
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Monitors UPACI-Backend service health every $IntervalMinutes minutes" `
        -ErrorAction Stop | Out-Null

    Write-Host "[UPACI] Scheduled task '$taskName' created successfully." -ForegroundColor Green
    Write-Host "  Interval: Every $IntervalMinutes minutes" -ForegroundColor White
    Write-Host "  Log:      $LogPath" -ForegroundColor White
    exit 0
}

# --- Remove Task Scheduler task ---
if ($RemoveScheduledTask) {
    Write-Host "[UPACI] Removing scheduled task: $taskName..." -ForegroundColor Cyan
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "[UPACI] Scheduled task removed." -ForegroundColor Green
    exit 0
}

# --- Collect service metrics ---
Write-Host "[UPACI] Monitoring service: $ServiceName" -ForegroundColor Cyan
Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "  ERROR: Service '$ServiceName' not found." -ForegroundColor Red
    exit 1
}

# Service status
$status = [PSCustomObject]@{
    Timestamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Service     = $ServiceName
    Status      = $service.Status.ToString()
    StartType   = $service.StartType.ToString()
    CPU_Percent = 0
    Memory_MB   = 0
    Uptime      = "N/A"
    ApiHealth   = "Unknown"
}

# Process metrics (if service is running)
if ($service.Status -eq 'Running') {
    # Find the node process associated with the service
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

    if ($nodeProcesses) {
        # Use the first node process (or filter by command line if multiple)
        $proc = $nodeProcesses | Sort-Object WorkingSet64 -Descending | Select-Object -First 1

        # CPU calculation
        $cpuCores = (Get-CimInstance Win32_Processor | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
        if ($cpuCores -gt 0 -and $proc.CPU) {
            $uptime = (Get-Date) - $proc.StartTime
            $cpuPercent = [math]::Round(($proc.CPU / $uptime.TotalSeconds / $cpuCores) * 100, 2)
            $status.CPU_Percent = $cpuPercent
            $status.Uptime = "{0}d {1}h {2}m" -f $uptime.Days, $uptime.Hours, $uptime.Minutes
        }

        # Memory
        $status.Memory_MB = [math]::Round($proc.WorkingSet64 / 1MB, 2)
    }

    # API health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" `
            -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $healthJson = $response.Content | ConvertFrom-Json
        $status.ApiHealth = $healthJson.status
    } catch {
        $status.ApiHealth = "Unreachable"
    }
}

# --- Display metrics ---
Write-Host ""
Write-Host "  Service Status:  $($status.Status)" -ForegroundColor $(if ($status.Status -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "  Start Type:      $($status.StartType)" -ForegroundColor White
Write-Host "  CPU Usage:       $($status.CPU_Percent)%" -ForegroundColor White
Write-Host "  Memory Usage:    $($status.Memory_MB) MB" -ForegroundColor White
Write-Host "  Uptime:          $($status.Uptime)" -ForegroundColor White
Write-Host "  API Health:      $($status.ApiHealth)" -ForegroundColor $(if ($status.ApiHealth -eq 'healthy') { 'Green' } elseif ($status.ApiHealth -eq 'degraded') { 'Yellow' } else { 'Red' })

# --- Log to CSV ---
$logDir = Split-Path -Parent $LogPath
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
}

$csvExists = Test-Path $LogPath
$status | Export-Csv -Path $LogPath -Append -NoTypeInformation -Force

if (-not $csvExists) {
    Write-Host ""
    Write-Host "  Log file created: $LogPath" -ForegroundColor Green
} else {
    Write-Host "  Metrics appended to: $LogPath" -ForegroundColor Green
}

# --- Alert on unhealthy state ---
if ($service.Status -ne 'Running') {
    Write-Host ""
    Write-Host "  ALERT: Service is NOT running! Status: $($service.Status)" -ForegroundColor Red
    Write-Host "  Attempting to start service..." -ForegroundColor Yellow
    try {
        Start-Service -Name $ServiceName -ErrorAction Stop
        Write-Host "  Service started successfully." -ForegroundColor Green
    } catch {
        Write-Host "  FAILED to start service: $_" -ForegroundColor Red
        # Log restart failure
        $eventMessage = "UPACI-Backend service restart failed: $_"
        Write-EventLog -LogName Application -Source "UPACI" -EventId 5001 -EntryType Error -Message $eventMessage -ErrorAction SilentlyContinue
    }
}

if ($status.ApiHealth -eq 'Unreachable' -and $service.Status -eq 'Running') {
    Write-Host ""
    Write-Host "  WARNING: Service is running but API health check failed." -ForegroundColor Yellow
    Write-Host "  Check application logs at C:\Logs\UPACI\ for errors." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[UPACI] Monitoring check complete." -ForegroundColor Green
