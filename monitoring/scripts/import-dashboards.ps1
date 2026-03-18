# UPACI Grafana Dashboard Import Script (PowerShell)
# Imports dashboard JSON files via Grafana HTTP API
# Usage: .\import-dashboards.ps1 [-GrafanaUrl "http://localhost:3000"] [-AdminUser "admin"] [-AdminPassword "admin"]

param(
    [string]$GrafanaUrl = "http://localhost:3000",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin"
)

$ErrorActionPreference = "Stop"

# Configuration
$DashboardDir = Join-Path $PSScriptRoot "..\grafana\dashboards"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "UPACI Dashboard Import Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Grafana URL: $GrafanaUrl"
Write-Host "Dashboard Directory: $DashboardDir"
Write-Host ""

# Create credentials
$SecurePassword = ConvertTo-SecureString $AdminPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($AdminUser, $SecurePassword)

# Check if Grafana is reachable
Write-Host "Checking Grafana connectivity..."
try {
    $healthResponse = Invoke-WebRequest -Uri "$GrafanaUrl/api/health" -Method Get -UseBasicParsing -TimeoutSec 10
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✓ Grafana is reachable" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Cannot connect to Grafana at $GrafanaUrl" -ForegroundColor Red
    Write-Host "Ensure Grafana is running: docker-compose ps"
    exit 1
}
Write-Host ""

# Verify credentials
Write-Host "Verifying admin credentials..."
try {
    $orgResponse = Invoke-WebRequest -Uri "$GrafanaUrl/api/org" -Method Get -Credential $Credential -UseBasicParsing
    if ($orgResponse.StatusCode -eq 200) {
        Write-Host "✓ Credentials verified" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Invalid credentials (HTTP $($_.Exception.Response.StatusCode.Value__))" -ForegroundColor Red
    Write-Host "Check AdminUser and AdminPassword parameters"
    exit 1
}
Write-Host ""

# Check if dashboard directory exists
if (-not (Test-Path $DashboardDir)) {
    Write-Host "ERROR: Dashboard directory not found: $DashboardDir" -ForegroundColor Red
    exit 1
}

# Count dashboard files
$DashboardFiles = Get-ChildItem -Path $DashboardDir -Filter "*.json"
$DashboardCount = $DashboardFiles.Count

if ($DashboardCount -eq 0) {
    Write-Host "WARNING: No dashboard JSON files found in $DashboardDir" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $DashboardCount dashboard(s) to import"
Write-Host ""

# Import statistics
$ImportSuccess = 0
$ImportFailed = 0

# Get or create folder
$FolderTitle = "UPACI Monitoring"
Write-Host "Checking for folder: $FolderTitle"

try {
    $foldersResponse = Invoke-RestMethod -Uri "$GrafanaUrl/api/folders" -Method Get -Credential $Credential
    $folder = $foldersResponse | Where-Object { $_.title -eq $FolderTitle }
    
    if (-not $folder) {
        Write-Host "Creating folder: $FolderTitle"
        $folderPayload = @{
            title = $FolderTitle
        } | ConvertTo-Json
        
        $folder = Invoke-RestMethod -Uri "$GrafanaUrl/api/folders" -Method Post -Credential $Credential -Body $folderPayload -ContentType "application/json"
    }
    
    $FolderUid = $folder.uid
    Write-Host "Using folder UID: $FolderUid"
} catch {
    Write-Host "WARNING: Could not create/find folder. Importing to General folder." -ForegroundColor Yellow
    $FolderUid = $null
}
Write-Host ""

# Import each dashboard
foreach ($DashboardFile in $DashboardFiles) {
    $DashboardName = $DashboardFile.BaseName -replace 'upaci-', '' -replace '-', ' '
    $DashboardName = (Get-Culture).TextInfo.ToTitleCase($DashboardName)
    
    Write-Host "Importing: $DashboardName"
    
    try {
        # Read dashboard JSON
        $DashboardJson = Get-Content -Path $DashboardFile.FullName -Raw | ConvertFrom-Json
        
        # Prepare import payload
        $importPayload = @{
            dashboard = $DashboardJson
            overwrite = $true
        }
        
        if ($FolderUid) {
            $importPayload.folderUid = $FolderUid
        }
        
        $importBody = $importPayload | ConvertTo-Json -Depth 100
        
        # Import dashboard
        $importResponse = Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/db" -Method Post -Credential $Credential -Body $importBody -ContentType "application/json"
        
        if ($importResponse.status -eq "success") {
            $DashboardUid = $importResponse.uid
            $DashboardUrl = "$GrafanaUrl/d/$DashboardUid"
            Write-Host "  ✓ Imported successfully" -ForegroundColor Green
            Write-Host "  URL: $DashboardUrl"
            $ImportSuccess++
        } else {
            Write-Host "  ✗ Import failed: $($importResponse.message)" -ForegroundColor Red
            $ImportFailed++
        }
    } catch {
        Write-Host "  ✗ Import failed: $($_.Exception.Message)" -ForegroundColor Red
        $ImportFailed++
    }
    
    Write-Host ""
}

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Import Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Total: $DashboardCount"
Write-Host "Success: $ImportSuccess" -ForegroundColor Green
if ($ImportFailed -gt 0) {
    Write-Host "Failed: $ImportFailed" -ForegroundColor Red
}
Write-Host ""

# Set dashboard permissions (Admin-only editing)
if ($ImportSuccess -gt 0 -and $FolderUid) {
    Write-Host "Setting dashboard permissions (Admin-only editing)..."
    
    try {
        # Get all dashboards in UPACI Monitoring folder
        $dashboardsInFolder = Invoke-RestMethod -Uri "$GrafanaUrl/api/search?folderUids=$FolderUid&type=dash-db" -Method Get -Credential $Credential
        
        foreach ($dashboard in $dashboardsInFolder) {
            $DashUid = $dashboard.uid
            
            # Set permissions: Viewer=View (1), Admin=Edit (2)
            $permPayload = @{
                items = @(
                    @{
                        role = "Viewer"
                        permission = 1
                    },
                    @{
                        role = "Admin"
                        permission = 2
                    }
                )
            } | ConvertTo-Json
            
            try {
                Invoke-RestMethod -Uri "$GrafanaUrl/api/dashboards/uid/$DashUid/permissions" -Method Post -Credential $Credential -Body $permPayload -ContentType "application/json" | Out-Null
                Write-Host "  Set permissions for dashboard: $DashUid"
            } catch {
                Write-Host "  WARNING: Could not set permissions for $DashUid" -ForegroundColor Yellow
            }
        }
        
        Write-Host "✓ Permissions configured" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "WARNING: Could not set dashboard permissions" -ForegroundColor Yellow
    }
}

# Final status
if ($ImportFailed -eq 0) {
    Write-Host "All dashboards imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Grafana at: $GrafanaUrl"
    exit 0
} else {
    Write-Host "Some dashboards failed to import. Check errors above." -ForegroundColor Yellow
    exit 1
}
