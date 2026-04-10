# setup-logging.ps1
# Creates the UPACI log directory and grants write permissions to service accounts.
# Run as Administrator on the Windows Server host.

param(
    [string]$LogPath = "C:\Logs\UPACI"
)

Write-Host "[UPACI] Setting up logging directory: $LogPath" -ForegroundColor Cyan

# Create directory
if (-Not (Test-Path $LogPath)) {
    New-Item -ItemType Directory -Force -Path $LogPath | Out-Null
    Write-Host "[UPACI] Created directory: $LogPath" -ForegroundColor Green
} else {
    Write-Host "[UPACI] Directory already exists: $LogPath" -ForegroundColor Yellow
}

# Grant NETWORK SERVICE full control (for IIS worker processes)
icacls $LogPath /grant "NETWORK SERVICE:(OI)(CI)F" /T /Q
Write-Host "[UPACI] Granted NETWORK SERVICE full control" -ForegroundColor Green

# Grant LOCAL SERVICE full control (for Windows Service)
icacls $LogPath /grant "LOCAL SERVICE:(OI)(CI)F" /T /Q
Write-Host "[UPACI] Granted LOCAL SERVICE full control" -ForegroundColor Green

# Verify permissions
Write-Host ""
Write-Host "[UPACI] Current permissions on $LogPath :" -ForegroundColor Cyan
icacls $LogPath

Write-Host ""
Write-Host "[UPACI] Logging directory setup complete." -ForegroundColor Green
