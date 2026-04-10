# configure-firewall.ps1
# Configures Windows Firewall inbound rules for UPACI platform.
# Allows HTTP (port 80) and HTTPS (port 443) traffic.
# Run as Administrator on the Windows Server host.

#Requires -RunAsAdministrator

Write-Host "[UPACI] Configuring Windows Firewall rules..." -ForegroundColor Cyan

# --- Remove existing UPACI rules to ensure clean state ---
$existingRules = Get-NetFirewallRule -DisplayName "UPACI*" -ErrorAction SilentlyContinue
if ($existingRules) {
    Write-Host "[UPACI] Removing existing UPACI firewall rules..." -ForegroundColor Yellow
    $existingRules | Remove-NetFirewallRule -ErrorAction SilentlyContinue
}

# --- Create HTTP inbound rule (port 80) ---
Write-Host "[UPACI] Creating inbound rule: UPACI HTTP (TCP 80)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule `
        -DisplayName "UPACI HTTP" `
        -Description "Allow inbound HTTP traffic for UPACI Platform (port 80)" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 80 `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Enabled True `
        -ErrorAction Stop | Out-Null
    Write-Host "  Rule 'UPACI HTTP' created successfully." -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to create HTTP rule. $_" -ForegroundColor Red
    exit 1
}

# --- Create HTTPS inbound rule (port 443) ---
Write-Host "[UPACI] Creating inbound rule: UPACI HTTPS (TCP 443)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule `
        -DisplayName "UPACI HTTPS" `
        -Description "Allow inbound HTTPS traffic for UPACI Platform (port 443)" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 443 `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Enabled True `
        -ErrorAction Stop | Out-Null
    Write-Host "  Rule 'UPACI HTTPS' created successfully." -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Failed to create HTTPS rule. $_" -ForegroundColor Red
    exit 1
}

# --- Block direct access to backend port (3000) from external ---
Write-Host "[UPACI] Creating block rule: UPACI Backend Direct Access (TCP 3000)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule `
        -DisplayName "UPACI Block Backend Direct" `
        -Description "Block direct external access to Node.js backend (port 3000). Only localhost via IIS proxy." `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3000 `
        -Action Block `
        -Profile Public `
        -RemoteAddress Any `
        -Enabled True `
        -ErrorAction Stop | Out-Null
    Write-Host "  Rule 'UPACI Block Backend Direct' created (Public profile)." -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Could not create backend block rule. $_" -ForegroundColor Yellow
}

# --- Verify rules ---
Write-Host ""
Write-Host "[UPACI] Verifying firewall rules..." -ForegroundColor Cyan
$rules = Get-NetFirewallRule -DisplayName "UPACI*" -ErrorAction SilentlyContinue

if ($rules) {
    $rules | Format-Table -Property DisplayName, Direction, Action, Enabled, Profile -AutoSize
} else {
    Write-Host "  WARNING: No UPACI firewall rules found." -ForegroundColor Red
}

# --- Test connectivity (local) ---
Write-Host "[UPACI] Testing local port availability..." -ForegroundColor Cyan
$port80 = Test-NetConnection -ComputerName localhost -Port 80 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
$port443 = Test-NetConnection -ComputerName localhost -Port 443 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

Write-Host "  Port 80 (HTTP):  $( if ($port80.TcpTestSucceeded) { 'OPEN' } else { 'CLOSED (IIS may not be running)' } )" -ForegroundColor White
Write-Host "  Port 443 (HTTPS): $( if ($port443.TcpTestSucceeded) { 'OPEN' } else { 'CLOSED (SSL binding may be needed)' } )" -ForegroundColor White

Write-Host ""
Write-Host "[UPACI] Firewall configuration complete." -ForegroundColor Green
Write-Host "[UPACI] Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test from external machine: Test-NetConnection -ComputerName <server> -Port 443" -ForegroundColor White
Write-Host "  2. Configure health monitoring: .\configure-health-monitoring.ps1" -ForegroundColor White
