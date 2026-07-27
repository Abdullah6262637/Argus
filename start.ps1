# ============================================================
# Argus — Native PowerShell Launch Script
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Argus Diagnostics and Setup / Sistem Kontrol Asamasi" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 1. Python check
$pythonOk = $false
if (Test-Path ".venv\Scripts\python.exe") {
    Write-Host "[+] Python found in local .venv." -ForegroundColor Green
    $pythonOk = $true
} elseif (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
    Write-Host "[+] Python found via uv package manager." -ForegroundColor Green
    $pythonOk = $true
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "[+] Python found in PATH." -ForegroundColor Green
    $pythonOk = $true
}

if (-not $pythonOk) {
    Write-Host "[!] ERROR: Python was not found." -ForegroundColor Red
    Write-Host "[!] HATA: Sisteminizde Python bulunamadi." -ForegroundColor Red
    Pause
    exit 1
}

# 2. Node.js check
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[!] ERROR: Node.js was not found in your system PATH." -ForegroundColor Red
    Write-Host "[!] HATA: Sisteminizde Node.js bulunamadi." -ForegroundColor Red
    Pause
    exit 1
}

# 3. Virtual environment check
if (-not (Test-Path ".venv")) {
    Write-Host "[+] Creating .venv..." -ForegroundColor Yellow
    if (Test-Path "$env:USERPROFILE\.local\bin\uv.exe") {
        & "$env:USERPROFILE\.local\bin\uv.exe" venv .venv
    } else {
        python -m venv .venv
    }
    Write-Host "[+] Installing requirements..." -ForegroundColor Yellow
    & ".venv\Scripts\pip.exe" install -r backend\requirements.txt
} else {
    Write-Host "[+] Python virtual environment (.venv) is ready." -ForegroundColor Green
}

# 4. Frontend node_modules check
Set-Location "$rootDir\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "[+] Installing frontend node_modules..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[+] Frontend dependencies are ready." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  [+] Setup check complete! Launching Argus..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

npm run electron:dev