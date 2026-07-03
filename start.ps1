# ============================================================
# Argus — Akıllı Kurulum ve Başlatma Betiği (PowerShell)
# ============================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  👁️ Argus Kurulum ve Sistem Kontrol Aşaması (Doctor Mode)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Gereksinim Kontrolleri
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck -and -not (Test-Path -Path ".venv\Scripts\python.exe")) {
    Write-Host "[!] HATA: Sisteminizde Python bulunamadı. Lütfen Python 3.12+ kurup PATH'e ekleyin." -ForegroundColor Red
    Read-Host "Devam etmek için ENTER'a basın..."
    exit 1
}

$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[!] HATA: Sisteminizde Node.js bulunamadı. Lütfen Node.js 20+ kurup PATH'e ekleyin." -ForegroundColor Red
    Read-Host "Devam etmek için ENTER'a basın..."
    exit 1
}

# Port 8000 kontrolü ve temizleme
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[!] Port 8000 zaten kullanımda (PID: $($port8000.OwningProcess))." -ForegroundColor Yellow
    $kill = Read-Host "Önceki backend'i kapatmak ister misiniz? (e/H)"
    if ($kill -eq "e" -or $kill -eq "E") {
        Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "[+] Eski backend kapatıldı." -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
}

# 2. Backend .venv ve requirements Kontrolü
$rootPath = $PSScriptRoot
Set-Location -Path $rootPath

if (-not (Test-Path -Path ".venv")) {
    Write-Host "[+] Python sanal ortam (.venv) bulunamadı. Oluşturuluyor..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "-m venv .venv" -NoNewWindow -Wait
    
    Write-Host "[+] Sanal ortam oluşturuldu. Bağımlılıklar yükleniyor..." -ForegroundColor Cyan
    Start-Process -FilePath ".\.venv\Scripts\pip.exe" -ArgumentList "install -r backend/requirements.txt" -NoNewWindow -Wait
} else {
    Write-Host "[+] Python sanal ortamı (.venv) hazır." -ForegroundColor Green
}

# 3. Frontend node_modules Kontrolü
Set-Location -Path "$rootPath\frontend"
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "[+] Frontend bağımlılıkları (node_modules) bulunamadı. Yükleniyor..." -ForegroundColor Cyan
    Start-Process -FilePath "npm" -ArgumentList "install" -NoNewWindow -Wait
} else {
    Write-Host "[+] Frontend bağımlılıkları hazır." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  [+] Tüm kontroller başarılı! Argus başlatılıyor..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

npm run electron:dev