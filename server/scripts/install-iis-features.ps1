# install-iis-features.ps1
# Installs required IIS roles, features, and URL Rewrite module.
# Run as Administrator on the Windows Server host.

#Requires -RunAsAdministrator

param(
    [switch]$SkipUrlRewrite
)

Write-Host "[UPACI] Installing IIS roles and features..." -ForegroundColor Cyan

# Core IIS features
$features = @(
    "Web-Server",
    "Web-WebServer",
    "Web-Common-Http",
    "Web-Static-Content",
    "Web-Default-Doc",
    "Web-Http-Errors",
    "Web-Http-Redirect",
    "Web-Security",
    "Web-Filtering",
    "Web-Stat-Compression",
    "Web-Dyn-Compression",
    "Web-Mgmt-Tools",
    "Web-Mgmt-Console"
)

foreach ($feature in $features) {
    $state = Get-WindowsFeature -Name $feature -ErrorAction SilentlyContinue
    if ($state -and -not $state.Installed) {
        Write-Host "  Installing $feature ..." -ForegroundColor Yellow
        Install-WindowsFeature -Name $feature -ErrorAction Stop | Out-Null
    } else {
        Write-Host "  $feature already installed" -ForegroundColor Green
    }
}

Write-Host "[UPACI] IIS core features installed." -ForegroundColor Green

# URL Rewrite Module (downloaded separately)
if (-not $SkipUrlRewrite) {
    $urlRewriteCheck = Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue
    if (-not $urlRewriteCheck) {
        Write-Host ""
        Write-Host "[UPACI] URL Rewrite Module 2.1 is NOT installed." -ForegroundColor Red
        Write-Host "  Download from: https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Yellow
        Write-Host "  Or install via Web Platform Installer." -ForegroundColor Yellow
    } else {
        Write-Host "[UPACI] URL Rewrite Module is already installed." -ForegroundColor Green
    }
}

# Create Application Pool
Import-Module WebAdministration -ErrorAction SilentlyContinue

$poolName = "UPACI-Frontend"
if (-not (Test-Path "IIS:\AppPools\$poolName")) {
    New-WebAppPool -Name $poolName
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name processModel.identityType -Value 4  # ApplicationPoolIdentity
    Set-ItemProperty "IIS:\AppPools\$poolName" -Name startMode -Value "AlwaysRunning"
    Write-Host "[UPACI] Application Pool '$poolName' created (No Managed Code, ApplicationPoolIdentity)." -ForegroundColor Green
} else {
    Write-Host "[UPACI] Application Pool '$poolName' already exists." -ForegroundColor Yellow
}

# Create site directory
$sitePath = "C:\inetpub\wwwroot\upaci-frontend"
if (-not (Test-Path $sitePath)) {
    New-Item -ItemType Directory -Force -Path $sitePath | Out-Null
    Write-Host "[UPACI] Created site directory: $sitePath" -ForegroundColor Green
}

# Create IIS site
$siteName = "UPACI-Frontend"
$existingSite = Get-Website -Name $siteName -ErrorAction SilentlyContinue
if (-not $existingSite) {
    New-Website -Name $siteName -Port 80 -PhysicalPath $sitePath -ApplicationPool $poolName
    Write-Host "[UPACI] IIS site '$siteName' created on port 80." -ForegroundColor Green
} else {
    Write-Host "[UPACI] IIS site '$siteName' already exists." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[UPACI] IIS installation complete. Next steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy frontend:   .\deploy-frontend.ps1" -ForegroundColor White
Write-Host "  2. Configure SSL:     .\configure-ssl.ps1" -ForegroundColor White
