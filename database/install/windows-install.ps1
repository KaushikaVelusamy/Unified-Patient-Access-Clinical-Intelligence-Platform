<#
.SYNOPSIS
    PostgreSQL 15 + pgvector Installation Script for Windows

.DESCRIPTION
    Automates installation of PostgreSQL 15.x and pgvector extension on Windows 10/11.
    Requires Administrator privileges.

.NOTES
    File Name      : windows-install.ps1
    Author         : Clinical Appointment Platform Team
    Prerequisite   : PowerShell 5.1+, Administrator rights
    Version        : 1.0.0
#>

#Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$PostgreSQLVersion = "15.9",
    [string]$InstallPath = "C:\Program Files\PostgreSQL\15",
    [string]$DataPath = "C:\Program Files\PostgreSQL\15\data",
    [string]$PostgreSQLPort = "5432",
    [string]$PostgreSQLPassword = "postgres",
    [switch]$SkipPostgreSQL,
    [switch]$SkipPgVector
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Header
Write-Info "=========================================="
Write-Info "PostgreSQL 15 + pgvector Installation"
Write-Info "Clinical Appointment Platform"
Write-Info "=========================================="
Write-Host ""

# Check Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "ERROR: This script must be run as Administrator."
    Write-Host "Right-click PowerShell and select 'Run as Administrator'"
    exit 1
}

# Step 1: Check if PostgreSQL is already installed
Write-Info "[Step 1/5] Checking existing PostgreSQL installation..."
$pgInstalled = Test-Path "$InstallPath\bin\psql.exe"

if ($pgInstalled -and -not $SkipPostgreSQL) {
    Write-Warning "PostgreSQL appears to be already installed at $InstallPath"
    $response = Read-Host "Do you want to skip PostgreSQL installation? (Y/N)"
    if ($response -eq "Y" -or $response -eq "y") {
        $SkipPostgreSQL = $true
    }
}

# Step 2: Download and Install PostgreSQL
if (-not $SkipPostgreSQL) {
    Write-Info "[Step 2/5] Downloading PostgreSQL $PostgreSQLVersion installer..."
    
    $installerUrl = "https://get.enterprisedb.com/postgresql/postgresql-$PostgreSQLVersion-1-windows-x64.exe"
    $installerPath = "$env:TEMP\postgresql-$PostgreSQLVersion-installer.exe"
    
    try {
        Write-Host "Downloading from: $installerUrl"
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "✓ PostgreSQL installer downloaded successfully"
    }
    catch {
        Write-Error "ERROR: Failed to download PostgreSQL installer"
        Write-Host "Please download manually from: https://www.postgresql.org/download/windows/"
        exit 1
    }
    
    Write-Info "Installing PostgreSQL $PostgreSQLVersion..."
    Write-Host "Note: This may take 5-10 minutes. Please wait..."
    
    # Silent installation parameters
    $installArgs = @(
        "--mode", "unattended",
        "--unattendedmodeui", "minimal",
        "--superpassword", $PostgreSQLPassword,
        "--servicename", "postgresql-x64-15",
        "--serviceaccount", "postgres",
        "--serverport", $PostgreSQLPort,
        "--prefix", "`"$InstallPath`"",
        "--datadir", "`"$DataPath`"",
        "--locale", "en_US.UTF-8"
    )
    
    try {
        Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait -NoNewWindow
        Write-Success "✓ PostgreSQL $PostgreSQLVersion installed successfully"
    }
    catch {
        Write-Error "ERROR: PostgreSQL installation failed"
        Write-Host "Error details: $_"
        exit 1
    }
    finally {
        # Cleanup installer
        if (Test-Path $installerPath) {
            Remove-Item $installerPath -Force
        }
    }
    
    # Add PostgreSQL to PATH
    Write-Info "Adding PostgreSQL to system PATH..."
    $pgBinPath = "$InstallPath\bin"
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    
    if ($currentPath -notcontains $pgBinPath) {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgBinPath", "Machine")
        $env:Path = "$env:Path;$pgBinPath"
        Write-Success "✓ PostgreSQL added to system PATH"
    }
    
    # Wait for PostgreSQL service to start
    Write-Info "Waiting for PostgreSQL service to start..."
    Start-Sleep -Seconds 5
    
    $service = Get-Service -Name "postgresql-x64-15" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq "Running") {
        Write-Success "✓ PostgreSQL service is running"
    }
    else {
        Write-Warning "PostgreSQL service not running. Attempting to start..."
        Start-Service -Name "postgresql-x64-15"
        Start-Sleep -Seconds 3
        Write-Success "✓ PostgreSQL service started"
    }
}
else {
    Write-Info "[Step 2/5] Skipping PostgreSQL installation (already installed)"
}

# Step 3: Verify PostgreSQL installation
Write-Info "[Step 3/5] Verifying PostgreSQL installation..."
try {
    $pgVersionOutput = & "$InstallPath\bin\psql.exe" --version
    Write-Success "✓ PostgreSQL version: $pgVersionOutput"
}
catch {
    Write-Error "ERROR: PostgreSQL verification failed"
    Write-Host "psql command not found. Installation may have failed."
    exit 1
}

# Step 4: Download and Install pgvector extension
if (-not $SkipPgVector) {
    Write-Info "[Step 4/5] Installing pgvector extension..."
    
    $pgVectorVersion = "0.5.1"
    $pgVectorUrl = "https://github.com/pgvector/pgvector/releases/download/v$pgVectorVersion/pgvector-v$pgVectorVersion-pg15-windows-x64.zip"
    $pgVectorZip = "$env:TEMP\pgvector.zip"
    $pgVectorExtract = "$env:TEMP\pgvector"
    
    try {
        Write-Host "Downloading pgvector v$pgVectorVersion..."
        Invoke-WebRequest -Uri $pgVectorUrl -OutFile $pgVectorZip -UseBasicParsing
        Write-Success "✓ pgvector downloaded successfully"
        
        # Extract pgvector
        Write-Info "Extracting pgvector files..."
        Expand-Archive -Path $pgVectorZip -DestinationPath $pgVectorExtract -Force
        
        # Copy DLL to PostgreSQL lib directory
        $vectorDll = Get-ChildItem -Path $pgVectorExtract -Filter "vector.dll" -Recurse | Select-Object -First 1
        if ($vectorDll) {
            Copy-Item -Path $vectorDll.FullName -Destination "$InstallPath\lib\vector.dll" -Force
            Write-Success "✓ vector.dll copied to $InstallPath\lib\"
        }
        else {
            Write-Error "ERROR: vector.dll not found in pgvector archive"
            exit 1
        }
        
        # Copy SQL and control files
        $vectorSql = Get-ChildItem -Path $pgVectorExtract -Filter "vector*.sql" -Recurse
        $vectorControl = Get-ChildItem -Path $pgVectorExtract -Filter "vector.control" -Recurse | Select-Object -First 1
        
        $shareExtensionPath = "$InstallPath\share\extension"
        if (-not (Test-Path $shareExtensionPath)) {
            New-Item -ItemType Directory -Path $shareExtensionPath -Force | Out-Null
        }
        
        foreach ($file in $vectorSql) {
            Copy-Item -Path $file.FullName -Destination $shareExtensionPath -Force
        }
        
        if ($vectorControl) {
            Copy-Item -Path $vectorControl.FullName -Destination $shareExtensionPath -Force
        }
        
        Write-Success "✓ pgvector extension files installed"
    }
    catch {
        Write-Error "ERROR: pgvector installation failed"
        Write-Host "Error details: $_"
        Write-Host ""
        Write-Warning "FALLBACK: You can continue without pgvector. AI features will be disabled."
        Write-Host "Refer to database/docs/TROUBLESHOOTING.md for manual installation."
    }
    finally {
        # Cleanup
        if (Test-Path $pgVectorZip) { Remove-Item $pgVectorZip -Force }
        if (Test-Path $pgVectorExtract) { Remove-Item $pgVectorExtract -Recurse -Force }
    }
}
else {
    Write-Info "[Step 4/5] Skipping pgvector installation"
}

# Step 5: Initialize Database and Enable Extension
Write-Info "[Step 5/5] Initializing UPACI database..."

$env:PGPASSWORD = $PostgreSQLPassword

try {
    # Check if database already exists
    $dbExists = & "$InstallPath\bin\psql.exe" -U postgres -h localhost -p $PostgreSQLPort -t -c "SELECT 1 FROM pg_database WHERE datname='upaci'" 2>$null
    
    if ($dbExists -match "1") {
        Write-Warning "Database 'upaci' already exists"
    }
    else {
        Write-Host "Creating database 'upaci'..."
        & "$InstallPath\bin\psql.exe" -U postgres -h localhost -p $PostgreSQLPort -c "CREATE DATABASE upaci;" | Out-Null
        Write-Success "✓ Database 'upaci' created"
    }
    
    # Enable pgvector extension
    if (-not $SkipPgVector) {
        Write-Host "Enabling pgvector extension..."
        & "$InstallPath\bin\psql.exe" -U postgres -h localhost -p $PostgreSQLPort -d upaci -c "CREATE EXTENSION IF NOT EXISTS vector;" | Out-Null
        
        # Verify extension
        $extInstalled = & "$InstallPath\bin\psql.exe" -U postgres -h localhost -p $PostgreSQLPort -d upaci -t -c "SELECT 1 FROM pg_extension WHERE extname='vector';"
        
        if ($extInstalled -match "1") {
            Write-Success "✓ pgvector extension enabled successfully"
        }
        else {
            Write-Warning "pgvector extension could not be verified. Check TROUBLESHOOTING.md"
        }
    }
}
catch {
    Write-Error "ERROR: Database initialization failed"
    Write-Host "Error details: $_"
    exit 1
}
finally {
    Remove-Item Env:\PGPASSWORD
}

# Summary
Write-Host ""
Write-Success "=========================================="
Write-Success "Installation Complete!"
Write-Success "=========================================="
Write-Host ""
Write-Info "PostgreSQL Details:"
Write-Host "  - Version: PostgreSQL $PostgreSQLVersion"
Write-Host "  - Install Path: $InstallPath"
Write-Host "  - Port: $PostgreSQLPort"
Write-Host "  - Database: upaci"
Write-Host "  - Service: postgresql-x64-15"
Write-Host ""
Write-Info "Connection String:"
Write-Host "  postgresql://postgres:$PostgreSQLPassword@localhost:$PostgreSQLPort/upaci"
Write-Host ""
Write-Info "Next Steps:"
Write-Host "  1. Update server/.env with database connection details"
Write-Host "  2. Test connection: psql -U postgres -d upaci"
Write-Host "  3. Run test scripts in database/scripts/"
Write-Host ""
Write-Warning "IMPORTANT: Change the default postgres password for production!"
Write-Host ""
