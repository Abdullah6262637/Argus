@echo off
SETLOCAL EnableDelayedExpansion
REM ============================================================
REM Argus — Akıllı Kurulum ve Başlatma Betiği (Windows)
REM ============================================================

echo.
echo ============================================================
echo   👁️ Argus Kurulum ve Sistem Kontrol Aşaması (Doctor Mode)
echo ============================================================
echo.

REM 1. Gereksinim Kontrolleri
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] HATA: Sisteminizde Python bulunamadı. Lütfen Python 3.12+ kurup PATH'e ekleyin.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] HATA: Sisteminizde Node.js bulunamadı. Lütfen Node.js 20+ kurup PATH'e ekleyin.
    pause
    exit /b 1
)

REM 2. Backend .venv ve requirements Kontrolü
cd /d "%~dp0"
if not exist ".venv" (
    echo [+] Python sanal ortam (.venv) bulunamadı. Oluşturuluyor...
    python -m venv .venv
    if !ERRORLEVEL! neq 0 (
        echo [!] HATA: Sanal ortam oluşturulurken bir hata oluştu.
        pause
        exit /b 1
    )
    echo [+] Sanal ortam oluşturuldu. Bağımlılıklar yükleniyor...
    call .venv\Scripts\pip install -r backend\requirements.txt
) else (
    echo [+] Python sanal ortamı (.venv) hazır.
)

REM 3. Frontend node_modules Kontrolü
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [+] Frontend bağımlılıkları (node_modules) bulunamadı. Yükleniyor...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [!] HATA: npm install çalıştırılırken bir hata oluştu.
        pause
        exit /b 1
    )
) else (
    echo [+] Frontend bağımlılıkları hazır.
)

echo.
echo ============================================================
echo   [+] Tüm kontroller başarılı! Argus başlatılıyor...
echo ============================================================
echo.

call npm run electron:dev
pause