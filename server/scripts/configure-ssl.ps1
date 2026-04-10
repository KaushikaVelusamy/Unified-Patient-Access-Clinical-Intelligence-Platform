# configure-ssl.ps1
# Installs an SSL certificate and binds it to the UPACI-Frontend IIS site on port 443.
# Supports both Let's Encrypt (win-acme) and manual PFX import.
# Run as Administrator.

#Requires -RunAsAdministrator

param(
    [string]$SiteName   = "UPACI-Frontend",
    [string]$HostName   = "",
    [string]$PfxPath    = "",
    [string]$PfxPassword = "",
    [switch]$UseLetsEncrypt
)

Import-Module WebAdministration -ErrorAction Stop

if ($UseLetsEncrypt) {
    # ---------- Let's Encrypt via win-acme ----------
    Write-Host "[UPACI] Let's Encrypt SSL setup" -ForegroundColor Cyan

    $wacsExe = Get-Command wacs.exe -ErrorAction SilentlyContinue
    if (-not $wacsExe) {
        Write-Host "[UPACI] win-acme (wacs.exe) not found on PATH." -ForegroundColor Red
        Write-Host "  Download from: https://github.com/win-acme/win-acme/releases" -ForegroundColor Yellow
        Write-Host "  Extract and add to PATH, then re-run this script." -ForegroundColor Yellow
        exit 1
    }

    if ([string]::IsNullOrEmpty($HostName)) {
        Write-Host "[UPACI] ERROR: -HostName is required for Let's Encrypt." -ForegroundColor Red
        Write-Host "  Example: .\configure-ssl.ps1 -UseLetsEncrypt -HostName upaci.example.com" -ForegroundColor Yellow
        exit 1
    }

    Write-Host "[UPACI] Requesting certificate for $HostName ..." -ForegroundColor Yellow
    wacs.exe --target manual --host $HostName --installation iis --siteid (Get-Website -Name $SiteName).id
    Write-Host "[UPACI] Certificate request submitted. Check win-acme output above." -ForegroundColor Green

} elseif (-not [string]::IsNullOrEmpty($PfxPath)) {
    # ---------- Manual PFX import ----------
    Write-Host "[UPACI] Importing PFX certificate: $PfxPath" -ForegroundColor Cyan

    if (-not (Test-Path $PfxPath)) {
        Write-Host "[UPACI] ERROR: PFX file not found at $PfxPath" -ForegroundColor Red
        exit 1
    }

    $securePassword = if ([string]::IsNullOrEmpty($PfxPassword)) {
        Read-Host "Enter PFX password" -AsSecureString
    } else {
        ConvertTo-SecureString $PfxPassword -AsPlainText -Force
    }

    $cert = Import-PfxCertificate -FilePath $PfxPath -CertStoreLocation Cert:\LocalMachine\My -Password $securePassword
    Write-Host "[UPACI] Certificate imported. Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

    # Add HTTPS binding
    $existingBinding = Get-WebBinding -Name $SiteName -Protocol https -ErrorAction SilentlyContinue
    if (-not $existingBinding) {
        New-WebBinding -Name $SiteName -Protocol https -Port 443 -SslFlags 1
        Write-Host "[UPACI] HTTPS binding added on port 443." -ForegroundColor Green
    } else {
        Write-Host "[UPACI] HTTPS binding already exists." -ForegroundColor Yellow
    }

    # Bind certificate
    $binding = Get-WebBinding -Name $SiteName -Protocol https
    $binding.AddSslCertificate($cert.Thumbprint, "my")
    Write-Host "[UPACI] SSL certificate bound to site." -ForegroundColor Green

} else {
    Write-Host "[UPACI] SSL Certificate Configuration" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  Let's Encrypt:  .\configure-ssl.ps1 -UseLetsEncrypt -HostName upaci.example.com" -ForegroundColor Yellow
    Write-Host "  Manual PFX:     .\configure-ssl.ps1 -PfxPath C:\certs\upaci.pfx" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "No certificate action taken." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[UPACI] SSL configuration complete." -ForegroundColor Green
Write-Host "  Verify: https://$( if ($HostName) { $HostName } else { 'localhost' } )" -ForegroundColor White
