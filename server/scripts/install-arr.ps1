# install-arr.ps1
# Installs IIS Application Request Routing (ARR) 3.0, enables reverse proxy,
# enables WebSocket protocol support, and configures allowed server variables.
# Run as Administrator on the Windows Server host.

#Requires -RunAsAdministrator

Write-Host "[UPACI] Configuring Application Request Routing (ARR) for reverse proxy..." -ForegroundColor Cyan

# --- Step 1: Check if ARR is installed ---
$arrModule = Get-WebGlobalModule -Name "ApplicationRequestRouting" -ErrorAction SilentlyContinue
if (-not $arrModule) {
    Write-Host ""
    Write-Host "[UPACI] ARR 3.0 is NOT installed." -ForegroundColor Red
    Write-Host "  Install ARR 3.0 from one of the following methods:" -ForegroundColor Yellow
    Write-Host "    1. Web Platform Installer: https://www.iis.net/downloads/microsoft/application-request-routing" -ForegroundColor Yellow
    Write-Host "    2. Direct MSI download (x64): https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  After installing ARR, re-run this script to complete configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "[UPACI] ARR module detected." -ForegroundColor Green

# --- Step 2: Enable ARR proxy ---
Write-Host "[UPACI] Enabling ARR reverse proxy..." -ForegroundColor Cyan
try {
    Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
        -Filter "system.webServer/proxy" -Name "enabled" -Value "True"
    Write-Host "[UPACI] ARR proxy enabled." -ForegroundColor Green
} catch {
    Write-Host "[UPACI] WARNING: Could not enable ARR proxy. Error: $_" -ForegroundColor Yellow
}

# --- Step 3: Enable WebSocket protocol in ARR ---
Write-Host "[UPACI] Enabling WebSocket protocol support in IIS..." -ForegroundColor Cyan

$wsFeature = Get-WindowsFeature -Name "Web-WebSockets" -ErrorAction SilentlyContinue
if ($wsFeature -and -not $wsFeature.Installed) {
    Write-Host "  Installing Web-WebSockets feature..." -ForegroundColor Yellow
    Install-WindowsFeature -Name "Web-WebSockets" -ErrorAction Stop | Out-Null
    Write-Host "  Web-WebSockets feature installed." -ForegroundColor Green
} else {
    Write-Host "  Web-WebSockets feature already installed." -ForegroundColor Green
}

# Enable WebSocket in ARR proxy settings
try {
    Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
        -Filter "system.webServer/proxy" -Name "reverseRewriteHostInResponseHeaders" -Value "True"
    Write-Host "[UPACI] ARR response header rewriting enabled." -ForegroundColor Green
} catch {
    Write-Host "[UPACI] WARNING: Could not configure response header rewriting. Error: $_" -ForegroundColor Yellow
}

# --- Step 4: Configure allowed server variables for X-Forwarded headers ---
Write-Host "[UPACI] Configuring allowed server variables for X-Forwarded headers..." -ForegroundColor Cyan

$serverVars = @("HTTP_X_FORWARDED_FOR", "HTTP_X_FORWARDED_PROTO")

foreach ($var in $serverVars) {
    $existing = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
        -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." `
        -ErrorAction SilentlyContinue | Where-Object { $_.name -eq $var }

    if (-not $existing) {
        try {
            Add-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
                -Filter "system.webServer/rewrite/allowedServerVariables" `
                -Name "." -Value @{name=$var}
            Write-Host "  Allowed server variable: $var" -ForegroundColor Green
        } catch {
            Write-Host "  WARNING: Could not add server variable $var. Error: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Server variable $var already allowed." -ForegroundColor Green
    }
}

# --- Step 5: Verify configuration ---
Write-Host ""
Write-Host "[UPACI] Verifying ARR configuration..." -ForegroundColor Cyan

$proxyEnabled = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter "system.webServer/proxy" -Name "enabled" -ErrorAction SilentlyContinue
Write-Host "  ARR Proxy Enabled:   $($proxyEnabled.Value)" -ForegroundColor White

$wsInstalled = (Get-WindowsFeature -Name "Web-WebSockets" -ErrorAction SilentlyContinue).Installed
Write-Host "  WebSocket Installed: $wsInstalled" -ForegroundColor White

$allowedVars = Get-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' `
    -Filter "system.webServer/rewrite/allowedServerVariables" -Name "." `
    -ErrorAction SilentlyContinue
Write-Host "  Allowed Server Variables:" -ForegroundColor White
foreach ($v in $allowedVars) {
    Write-Host "    - $($v.name)" -ForegroundColor White
}

Write-Host ""
Write-Host "[UPACI] ARR installation and configuration complete." -ForegroundColor Green
Write-Host "[UPACI] Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure firewall:   .\configure-firewall.ps1" -ForegroundColor White
Write-Host "  2. Configure monitoring: .\configure-health-monitoring.ps1" -ForegroundColor White
