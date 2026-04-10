# deploy-frontend.ps1
# Builds the React frontend and deploys to the IIS site directory.
# Run from the repository root or server/scripts/ directory.

param(
    [string]$DestinationPath = "C:\inetpub\wwwroot\upaci-frontend",
    [switch]$SkipBuild
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\.." )).Path
$appDir   = Join-Path $repoRoot "app"
$buildDir = Join-Path $appDir "dist"

Write-Host "[UPACI] Frontend deployment starting..." -ForegroundColor Cyan
Write-Host "  Source (app):  $appDir" -ForegroundColor White
Write-Host "  Build output:  $buildDir" -ForegroundColor White
Write-Host "  Destination:   $DestinationPath" -ForegroundColor White

# Step 1 - Build React app
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[UPACI] Building React application..." -ForegroundColor Yellow
    Push-Location $appDir
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[UPACI] Build failed. Aborting deployment." -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } finally {
        Pop-Location
    }
    Write-Host "[UPACI] Build succeeded." -ForegroundColor Green
} else {
    Write-Host "[UPACI] Skipping build (--SkipBuild)." -ForegroundColor Yellow
}

# Step 2 - Verify build artifacts
if (-not (Test-Path (Join-Path $buildDir "index.html"))) {
    Write-Host "[UPACI] ERROR: index.html not found in $buildDir." -ForegroundColor Red
    Write-Host "  Run 'npm run build' in the app directory first." -ForegroundColor Yellow
    exit 1
}

# Step 3 - Create destination if needed
if (-not (Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Force -Path $DestinationPath | Out-Null
    Write-Host "[UPACI] Created destination: $DestinationPath" -ForegroundColor Green
}

# Step 4 - Copy build artifacts
Write-Host ""
Write-Host "[UPACI] Copying build artifacts to IIS site..." -ForegroundColor Yellow
Copy-Item -Path "$buildDir\*" -Destination $DestinationPath -Recurse -Force
Write-Host "[UPACI] Files copied." -ForegroundColor Green

# Step 5 - Verify critical files
$requiredFiles = @("index.html", "web.config", "healthcheck.html")
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $DestinationPath $file
    if (Test-Path $filePath) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
    }
}

# Step 6 - Set permissions (IIS_IUSRS read access)
icacls $DestinationPath /grant "IIS_IUSRS:(OI)(CI)RX" /T /Q 2>$null

Write-Host ""
Write-Host "[UPACI] Frontend deployment complete." -ForegroundColor Green
