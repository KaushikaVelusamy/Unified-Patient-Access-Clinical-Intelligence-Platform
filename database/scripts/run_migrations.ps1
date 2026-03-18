<#
.SYNOPSIS
    Database Migration Runner for Windows

.DESCRIPTION
    Executes all database migrations in sequential order for the Clinical Appointment Platform

.PARAMETER DbName
    Database name (default: upaci)

.PARAMETER DbUser
    Database user (default: postgres)

.PARAMETER DbHost
    Database host (default: localhost)

.PARAMETER DbPort
    Database port (default: 5432)

.PARAMETER SkipSeed
    Skip loading seed data

.PARAMETER RollbackFirst
    Rollback all tables before running migrations

.EXAMPLE
    .\run_migrations.ps1
    .\run_migrations.ps1 -DbUser upaci_user -SkipSeed
    .\run_migrations.ps1 -RollbackFirst

.NOTES
    File Name      : run_migrations.ps1
    Author         : Clinical Appointment Platform Team
    Prerequisite   : PostgreSQL 15+, psql in PATH
    Version        : 1.0.0
#>

param(
    [string]$DbName = "upaci",
    [string]$DbUser = "postgres",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [switch]$SkipSeed,
    [switch]$RollbackFirst
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

function Write-Header {
    param([string]$Message)
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
}

# Header
Write-Header "Database Migration Runner`nClinical Appointment Platform"

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Migration directories
$MigrationsDir = Join-Path $ProjectRoot "migrations"
$SeedsDir = Join-Path $ProjectRoot "seeds"
$RollbackDir = Join-Path $ProjectRoot "rollback"

# Check if directories exist
if (-not (Test-Path $MigrationsDir)) {
    Write-Error "Migrations directory not found: $MigrationsDir"
    exit 1
}

# Test database connection
Write-Info "Testing database connection..."

$env:PGPASSWORD = Read-Host "Enter database password" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))

try {
    $testResult = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT 1" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database connection successful"
    } else {
        throw "Connection failed"
    }
}
catch {
    Write-Error "Cannot connect to database"
    Write-Info "Connection details:"
    Write-Host "  Host: $DbHost"
    Write-Host "  Port: $DbPort"
    Write-Host "  Database: $DbName"
    Write-Host "  User: $DbUser"
    Remove-Item Env:\PGPASSWORD
    exit 1
}

# Rollback if requested
if ($RollbackFirst) {
    Write-Warning "Rolling back all tables first..."
    
    $rollbackScript = Join-Path $RollbackDir "rollback_all.sql"
    if (Test-Path $rollbackScript) {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $rollbackScript | Out-Null
        Write-Success "Rollback completed"
    } else {
        Write-Warning "Rollback script not found, skipping..."
    }
    Write-Host ""
}

# Run migrations
Write-Header "Running Migrations"

$migrationCount = 0
$migrationErrors = 0

$migrationFiles = Get-ChildItem -Path $MigrationsDir -Filter "V*.sql" | Sort-Object Name

foreach ($migrationFile in $migrationFiles) {
    Write-Info "Running migration: $($migrationFile.Name)"
    
    try {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $migrationFile.FullName
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Migration $($migrationFile.Name) completed"
            $migrationCount++
        } else {
            throw "Migration failed"
        }
    }
    catch {
        Write-Error "Migration $($migrationFile.Name) failed"
        $migrationErrors++
        Remove-Item Env:\PGPASSWORD
        exit 1
    }
    Write-Host ""
}

# Load seed data
if (-not $SkipSeed) {
    Write-Header "Loading Seed Data"
    
    $seedScript = Join-Path $SeedsDir "dev_seed_data.sql"
    if (Test-Path $seedScript) {
        Write-Info "Loading development seed data..."
        
        try {
            & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $seedScript | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Seed data loaded successfully"
            } else {
                throw "Seed data failed"
            }
        }
        catch {
            Write-Error "Failed to load seed data"
            Write-Warning "Migrations completed but seed data failed"
        }
    } else {
        Write-Warning "Seed data file not found, skipping..."
    }
    Write-Host ""
}

# Verify tables created
Write-Header "Verification"

Write-Info "Verifying tables..."
$tableCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'app'" 2>&1
$tableCount = $tableCount.Trim()

if ([int]$tableCount -gt 0) {
    Write-Success "Tables created: $tableCount"
} else {
    Write-Error "No tables found in app schema"
    Remove-Item Env:\PGPASSWORD
    exit 1
}

# Verify foreign keys
$fkCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'app'" 2>&1
$fkCount = $fkCount.Trim()
Write-Success "Foreign keys created: $fkCount"

# Verify indexes
$indexCount = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'app'" 2>&1
$indexCount = $indexCount.Trim()
Write-Success "Indexes created: $indexCount"

# Verify pgvector
$vectorExt = & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector'" 2>&1
$vectorExt = $vectorExt.Trim()
if ([int]$vectorExt -eq 1) {
    Write-Success "pgvector extension enabled"
} else {
    Write-Warning "pgvector extension not found"
}

Write-Host ""

# Summary
Write-Header "Migration Summary"
Write-Success "Migrations executed: $migrationCount"
Write-Success "Migration errors: $migrationErrors"
Write-Success "Tables in app schema: $tableCount"
Write-Success "Foreign key constraints: $fkCount"
Write-Success "Indexes: $indexCount"

Write-Host ""
Write-Info "Database: $DbName on ${DbHost}:${DbPort}"
Write-Info "Migration directory: $MigrationsDir"

Write-Host ""
Write-Success "All migrations completed successfully!"
Write-Host ""

# Cleanup
Remove-Item Env:\PGPASSWORD
