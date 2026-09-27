$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SDVX PlayLog Tool - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Python
# ------------------------------------------------------------

Write-Host "[1/8] Checking Python 3.12..." -ForegroundColor Yellow

$python = Get-Command python -ErrorAction SilentlyContinue

if (-not $python) {
    throw "Python was not found. Install Python 3.12 and run this script again."
}

$pythonVersion = & python --version 2>&1

if ($pythonVersion -notmatch "Python 3\.12\.") {
    throw "Python 3.12 is required. Detected: $pythonVersion"
}

Write-Host "  $pythonVersion" -ForegroundColor Green

# ------------------------------------------------------------
# uv
# ------------------------------------------------------------

Write-Host "[2/8] Checking uv..." -ForegroundColor Yellow

$uv = Get-Command uv -ErrorAction SilentlyContinue

if (-not $uv) {
    throw "uv was not found. Install uv and run this script again."
}

$uvVersion = & uv --version 2>&1
Write-Host "  $uvVersion" -ForegroundColor Green

# ------------------------------------------------------------
# Python dependencies
# ------------------------------------------------------------

Write-Host "[3/8] Installing Python dependencies..." -ForegroundColor Yellow

& uv sync

if ($LASTEXITCODE -ne 0) {
    throw "uv sync failed."
}

Write-Host "  Python environment ready." -ForegroundColor Green

# ------------------------------------------------------------
# Node.js / npm
# ------------------------------------------------------------

Write-Host "[4/8] Checking Node.js / npm..." -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue

if (-not $node) {
    throw "Node.js was not found. Install Node.js and run this script again."
}

if (-not $npm) {
    throw "npm was not found. Install Node.js and run this script again."
}

$nodeVersion = & node --version
$npmVersion = & npm --version

Write-Host "  Node.js $nodeVersion" -ForegroundColor Green
Write-Host "  npm $npmVersion" -ForegroundColor Green

# ------------------------------------------------------------
# UI dependencies
# ------------------------------------------------------------

Write-Host "[5/8] Installing UI dependencies..." -ForegroundColor Yellow

Push-Location (Join-Path $ProjectRoot "ui")

try {
    if (-not (Test-Path "package-lock.json")) {
        throw "ui/package-lock.json was not found."
    }

    & npm ci

    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed."
    }
}
finally {
    Pop-Location
}

Write-Host "  UI environment ready." -ForegroundColor Green

# ------------------------------------------------------------
# Local configuration
# ------------------------------------------------------------

Write-Host "[6/8] Preparing local configuration..." -ForegroundColor Yellow

$appDataRoot = Join-Path $env:LOCALAPPDATA "SDVX PlayLog Tool"
$configPath = Join-Path $appDataRoot "config.yaml"
$configExamplePath = Join-Path $ProjectRoot "config.example.yaml"
$resourcesRoot = Join-Path $appDataRoot "resources"
$resourcesTemplateRoot = Join-Path $ProjectRoot "asset\resources_template"

New-Item -ItemType Directory -Force -Path $appDataRoot | Out-Null
New-Item -ItemType Directory -Force -Path $resourcesRoot | Out-Null

if (-not (Test-Path $configPath)) {
    if (-not (Test-Path $configExamplePath)) {
        throw "config.example.yaml was not found."
    }

    Copy-Item $configExamplePath $configPath

    Write-Host "  Created config.yaml in LocalAppData." -ForegroundColor Green
}
else {
    Write-Host "  config.yaml already exists. Kept existing file." -ForegroundColor Green
}

$resourceFiles = @(
    "result_default.png",
    "result_sample.png",
    "result_template.png",
    "song_start_default.png",
    "song_start_sample.png",
    "song_start_template.png"
)

foreach ($file in $resourceFiles) {

    $sourcePath = Join-Path $resourcesTemplateRoot $file
    $destinationPath = Join-Path $resourcesRoot $file

    if (-not (Test-Path $sourcePath)) {
        throw "Resource file was not found: asset\resources_template\$file"
    }

    Copy-Item `
        -Path $sourcePath `
        -Destination $destinationPath `
        -Force
}

Write-Host "  Copied resource images to LocalAppData." -ForegroundColor Green

$envPath = Join-Path $ProjectRoot ".env"

if (-not (Test-Path $envPath)) {
    @"
# OBS WebSocket Server password
OBS_WEBSOCKET_PASSWORD=
"@ | Set-Content -Path $envPath -Encoding UTF8

    Write-Host "  Created .env" -ForegroundColor Green
}
else {
    Write-Host "  .env already exists. Kept existing file." -ForegroundColor Green
}

# ------------------------------------------------------------
# Runtime directories
# ------------------------------------------------------------

Write-Host "[7/8] Preparing application data directories..." -ForegroundColor Yellow

$dataRoot = Join-Path $env:LOCALAPPDATA "SDVX PlayLog Tool\data"

$directories = @(
    $dataRoot,
    (Join-Path $dataRoot "debug"),
    (Join-Path $dataRoot "logs"),
    (Join-Path $dataRoot "media"),
    (Join-Path $dataRoot "temp"),
    (Join-Path $dataRoot "database")
)

foreach ($directory in $directories) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

Write-Host "  Data directory: $dataRoot" -ForegroundColor Green

# ------------------------------------------------------------
# Required files / external tools
# ------------------------------------------------------------

Write-Host "[8/8] Checking required files and tools..." -ForegroundColor Yellow

$requiredFiles = @(
    "asset\tray_icon.png"
)

foreach ($file in $requiredFiles) {
    $path = Join-Path $ProjectRoot $file

    if (-not (Test-Path $path)) {
        throw "Required file was not found: $file"
    }
}

$obsPath = "C:\Program Files\obs-studio\bin\64bit\obs64.exe"

if (-not (Test-Path $obsPath)) {
    Write-Host ""
    Write-Host "OBS Studio was not found at:" -ForegroundColor Red
    Write-Host "  $obsPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install OBS Studio and run this script again." -ForegroundColor Yellow
    throw "OBS Studio is required."
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue

if (-not $ffmpeg) {
    throw "ffmpeg was not found in PATH."
}

if (-not $ffprobe) {
    throw "ffprobe was not found in PATH."
}

Write-Host "  OBS Studio found." -ForegroundColor Green
Write-Host "  ffmpeg found." -ForegroundColor Green
Write-Host "  ffprobe found." -ForegroundColor Green

# ------------------------------------------------------------
# Complete
# ------------------------------------------------------------

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Setup completed." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure OBS Studio."
Write-Host "  2. Set OBS_WEBSOCKET_PASSWORD in .env."
Write-Host "  3. Configure config.yaml if necessary."
Write-Host ""
