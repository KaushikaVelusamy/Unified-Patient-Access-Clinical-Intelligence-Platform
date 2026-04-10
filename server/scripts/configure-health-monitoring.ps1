# configure-health-monitoring.ps1
# Installs IIS Application Initialization module (Web-AppInit) and configures
# preloading and health check monitoring for the UPACI platform.
# Run as Administrator on the Windows Server host.

#Requires -RunAsAdministrator

param(
    [string]$SiteName = "UPACI-Frontend",
    [string]$AppPoolName = "UPACI-Frontend",
    [string]$HealthCheckPath = "/healthcheck.html",
    [string]$ApiHealthPath = "/api/health"
)

Write-Host "[UPACI] Configuring IIS health check monitoring..." -ForegroundColor Cyan

# --- Step 1: Install Application Initialization module ---
Write-Host "[UPACI] Checking IIS Application Initialization feature..." -ForegroundColor Cyan

$appInitFeature = Get-WindowsFeature -Name "Web-AppInit" -ErrorAction SilentlyContinue
if ($appInitFeature -and -not $appInitFeature.Installed) {
    Write-Host "  Installing Web-AppInit feature..." -ForegroundColor Yellow
    Install-WindowsFeature -Name "Web-AppInit" -ErrorAction Stop | Out-Null
    Write-Host "  Web-AppInit feature installed." -ForegroundColor Green
} else {
    Write-Host "  Web-AppInit feature already installed." -ForegroundColor Green
}

# --- Step 2: Import IIS module ---
Import-Module WebAdministration -ErrorAction Stop

# --- Step 3: Configure Application Pool for AlwaysRunning ---
Write-Host "[UPACI] Configuring Application Pool '$AppPoolName' for AlwaysRunning..." -ForegroundColor Cyan

if (Test-Path "IIS:\AppPools\$AppPoolName") {
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name startMode -Value "AlwaysRunning"
    Write-Host "  App Pool startMode set to AlwaysRunning." -ForegroundColor Green

    # Set idle timeout to 0 (never idle)
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
    Write-Host "  App Pool idle timeout set to 0 (disabled)." -ForegroundColor Green
} else {
    Write-Host "  ERROR: Application Pool '$AppPoolName' not found." -ForegroundColor Red
    Write-Host "  Run install-iis-features.ps1 first." -ForegroundColor Yellow
    exit 1
}

# --- Step 4: Configure site preloadEnabled ---
Write-Host "[UPACI] Configuring site '$SiteName' for preloading..." -ForegroundColor Cyan

$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($site) {
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationDefaults.preloadEnabled -Value $true
    Write-Host "  Site preloadEnabled set to true." -ForegroundColor Green
} else {
    Write-Host "  ERROR: IIS Site '$SiteName' not found." -ForegroundColor Red
    Write-Host "  Run install-iis-features.ps1 first." -ForegroundColor Yellow
    exit 1
}

# --- Step 5: Configure Application Initialization in web.config ---
Write-Host "[UPACI] Verifying applicationInitialization in web.config..." -ForegroundColor Cyan

$webConfigPath = "C:\inetpub\wwwroot\upaci-frontend\web.config"
if (Test-Path $webConfigPath) {
    [xml]$xml = Get-Content $webConfigPath
    $appInit = $xml.configuration.'system.webServer'.applicationInitialization

    if ($appInit) {
        Write-Host "  applicationInitialization section found in web.config." -ForegroundColor Green
        Write-Host "  doAppInitAfterRestart: $($appInit.doAppInitAfterRestart)" -ForegroundColor White
        foreach ($page in $appInit.add) {
            Write-Host "    Initialization page: $($page.initializationPage)" -ForegroundColor White
        }
    } else {
        Write-Host "  WARNING: applicationInitialization section NOT found in web.config." -ForegroundColor Yellow
        Write-Host "  Ensure web.config has been updated with the applicationInitialization element." -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARNING: web.config not found at $webConfigPath" -ForegroundColor Yellow
    Write-Host "  Run deploy-frontend.ps1 to deploy the frontend first." -ForegroundColor Yellow
}

# --- Step 6: Verify health endpoints ---
Write-Host ""
Write-Host "[UPACI] Testing health endpoints..." -ForegroundColor Cyan

# Test frontend health check
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost$HealthCheckPath" `
        -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    Write-Host "  Frontend health ($HealthCheckPath): HTTP $($frontendHealth.StatusCode) - OK" -ForegroundColor Green
} catch {
    Write-Host "  Frontend health ($HealthCheckPath): FAILED - $_" -ForegroundColor Yellow
}

# Test backend API health
try {
    $apiHealth = Invoke-WebRequest -Uri "http://localhost$ApiHealthPath" `
        -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $apiJson = $apiHealth.Content | ConvertFrom-Json
    Write-Host "  Backend health ($ApiHealthPath):  HTTP $($apiHealth.StatusCode) - Status: $($apiJson.status)" -ForegroundColor Green
} catch {
    Write-Host "  Backend health ($ApiHealthPath):  FAILED - $_" -ForegroundColor Yellow
}

# --- Summary ---
Write-Host ""
Write-Host "[UPACI] Health monitoring configuration complete." -ForegroundColor Green
Write-Host "[UPACI] Configuration summary:" -ForegroundColor Cyan
Write-Host "  App Pool:          $AppPoolName (AlwaysRunning, no idle timeout)" -ForegroundColor White
Write-Host "  Site:              $SiteName (preloadEnabled=true)" -ForegroundColor White
Write-Host "  Health check page: $HealthCheckPath" -ForegroundColor White
Write-Host "  API health:        $ApiHealthPath" -ForegroundColor White
Write-Host ""
Write-Host "[UPACI] Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set up monitoring:  .\monitor-service.ps1" -ForegroundColor White
Write-Host "  2. Test after restart: iisreset /restart" -ForegroundColor White
