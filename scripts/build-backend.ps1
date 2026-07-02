# Sprint C.1: PyInstaller ile backend'i tek-dizin olarak paketle
# Cikti: backend/dist/umtalagent-backend/

$ErrorActionPreference = "Stop"

$RepoRoot = (Get-Item $PSScriptRoot).Parent.FullName
$BackendDir = Join-Path $RepoRoot "backend"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  UmtalAgent Backend Build (PyInstaller)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Venv kontrolu
$venvPython = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "[!] .venv bulunamadi. Once: python -m venv .venv && .venv\Scripts\pip install -r backend\requirements.txt" -ForegroundColor Red
    exit 1
}

# PyInstaller yuklu mu?
& $venvPython -c "import PyInstaller" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[+] PyInstaller yukleniyor..." -ForegroundColor Yellow
    & $venvPython -m pip install pyinstaller
}

# Eski cikti varsa temizle
$DistDir = Join-Path $BackendDir "dist"
$BuildDir = Join-Path $BackendDir "build"
if (Test-Path $DistDir) {
    Write-Host "[+] Eski dist temizleniyor..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $DistDir
}
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}

# Build
Push-Location $BackendDir
try {
    Write-Host "[+] PyInstaller calisiyor (--clean --noconfirm)..." -ForegroundColor Cyan
    & $venvPython -m PyInstaller umtalagent.spec --clean --noconfirm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] PyInstaller basarisiz." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

$exePath = Join-Path $DistDir "umtalagent-backend\umtalagent-backend.exe"
if (Test-Path $exePath) {
    $size = (Get-Item $exePath).Length / 1MB
    Write-Host ""
    Write-Host "[+] Basarili!" -ForegroundColor Green
    Write-Host "    Cikti: $exePath ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test etmek icin:" -ForegroundColor Cyan
    Write-Host "    & '$exePath'"
    Write-Host "    # Sonra: http://127.0.0.1:8000/api/health"
} else {
    Write-Host "[!] exe bulunamadi: $exePath" -ForegroundColor Red
    exit 1
}