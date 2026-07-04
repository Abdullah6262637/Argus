# ============================================================
# Argus — Smart Setup & Launch Script / Akıllı Kurulum Betiği (PowerShell)
# ============================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  👁️ Argus Diagnostics & Setup / Sistem Kontrol Aşaması" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Requirement Checks / Gereksinim Kontrolleri
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck -and -not (Test-Path -Path ".venv\Scripts\python.exe")) {
    Write-Host "[!] ERROR: Python was not found in your system PATH." -ForegroundColor Red
    Write-Host "[!] HATA: Sisteminizde Python bulunamadı. Lütfen Python 3.12+ kurup PATH'e ekleyin." -ForegroundColor Red
    Read-Host "Press ENTER to continue / Devam etmek için ENTER'a basın..."
    exit 1
}

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[!] ERROR: Node.js was not found in your system PATH." -ForegroundColor Red
    Write-Host "[!] HATA: Sisteminizde Node.js bulunamadı. Lütfen Node.js 20+ kurup PATH'e ekleyin." -ForegroundColor Red
    Read-Host "Press ENTER to continue / Devam etmek için ENTER'a basın..."
    exit 1
}

# Port 8000 control / Port 8000 kontrolü ve temizleme
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[!] Port 8000 is already in use (PID: $($port8000.OwningProcess))." -ForegroundColor Yellow
    Write-Host "[!] Port 8000 zaten kullanımda (PID: $($port8000.OwningProcess))." -ForegroundColor Yellow
    $kill = Read-Host "Would you like to terminate the existing backend process? / Eski backend'i kapatmak ister misiniz? (y/N - e/H)"
    if ($kill -eq "e" -or $kill -eq "E" -or $kill -eq "y" -or $kill -eq "Y") {
        Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "[+] Pre-existing backend terminated / Eski backend kapatıldı." -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
}

# 2. Backend .venv check / Sanal Ortam Kontrolü
$rootPath = $PSScriptRoot
Set-Location -Path $rootPath

if (-not (Test-Path -Path ".venv")) {
    Write-Host "[+] Python virtual environment (.venv) not found. Creating..." -ForegroundColor Cyan
    Write-Host "[+] Python sanal ortam (.venv) bulunamadı. Oluşturuluyor..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "-m venv .venv" -NoNewWindow -Wait
    
    Write-Host "[+] Installing backend dependencies... / Bağımlılıklar yükleniyor..." -ForegroundColor Cyan
    Start-Process -FilePath ".\.venv\Scripts\pip.exe" -ArgumentList "install -r backend/requirements.txt" -NoNewWindow -Wait
} else {
    Write-Host "[+] Python virtual environment (.venv) is ready / Python sanal ortamı hazır." -ForegroundColor Green
}

# 3. Frontend node_modules check / Frontend Bağımlılık Kontrolü
Set-Location -Path "$rootPath\frontend"
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "[+] Frontend dependencies (node_modules) not found. Installing..." -ForegroundColor Cyan
    Write-Host "[+] Frontend bağımlılıkları (node_modules) bulunamadı. Yükleniyor..." -ForegroundColor Cyan
    Start-Process -FilePath "npm" -ArgumentList "install" -NoNewWindow -Wait
} else {
    Write-Host "[+] Frontend dependencies are ready / Frontend bağımlılıkları hazır." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [+] Setup checks successful! Launching Argus..." -ForegroundColor Green
Write-Host "  [+] Tüm kontroller başarılı! Argus başlatılıyor..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

npm run electron:dev