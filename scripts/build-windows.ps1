<#
.SYNOPSIS
  UmtalAgent - Windows full build pipeline

.DESCRIPTION
  1. Backend'i PyInstaller ile paketler -> backend/dist/umtalagent-backend/
  2. Frontend'i Vite + electron-builder ile paketler -> frontend/release/
  3. Final NSIS installer'i .nsi script'i ile derler -> dist/UmtalAgent-Setup.exe

.NOTES
  Gereksinimler:
    - Python 3.11+ (pyinstaller pip ile yuklenmeli)
    - Node.js 18+
    - NSIS (https://nsis.sourceforge.io/) -- makensis PATH'te olmali
#>

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path "$PSScriptRoot\..").Path
Write-Host "[BUILD] Repo root: $Root"

# 1) Backend: PyInstaller
Write-Host "`n[1/3] Backend PyInstaller bundle ..." -ForegroundColor Cyan
Push-Location "$Root\backend"
try {
    if (-not (Get-Command pyinstaller -ErrorAction SilentlyContinue)) {
        Write-Host "pyinstaller bulunamadi, yukleniyor..." -ForegroundColor Yellow
        python -m pip install pyinstaller
    }
    pyinstaller umtalagent.spec --clean --noconfirm
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller basarisiz" }
} finally {
    Pop-Location
}

# 2) Frontend: Vite + electron-builder
Write-Host "`n[2/3] Frontend (Vite + Electron) build ..." -ForegroundColor Cyan
Push-Location "$Root\frontend"
try {
    if (-not (Test-Path node_modules)) {
        npm install
    }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Vite build basarisiz" }
    npx electron-builder --win --x64 --dir
    if ($LASTEXITCODE -ne 0) { throw "electron-builder basarisiz" }
} finally {
    Pop-Location
}

# 3) NSIS installer
Write-Host "`n[3/3] NSIS installer ..." -ForegroundColor Cyan
$nsis = Get-Command makensis -ErrorAction SilentlyContinue
if (-not $nsis) {
    Write-Host "makensis bulunamadi -- installer asamasi atlandi." -ForegroundColor Yellow
    Write-Host "NSIS yuklendiginde: makensis $Root\installer\umtalagent.nsi" -ForegroundColor Yellow
    exit 0
}

makensis "$Root\installer\umtalagent.nsi"
if ($LASTEXITCODE -ne 0) { throw "makensis basarisiz" }

Write-Host "`nBUILD TAMAM. Cikti: $Root\dist\UmtalAgent-Setup.exe" -ForegroundColor Green