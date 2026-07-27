@echo off
SETLOCAL EnableDelayedExpansion
REM ============================================================
REM Argus — Smart Setup & Launch Script / Akıllı Kurulum Betiği
REM ============================================================

echo.
echo ============================================================
echo   👁️ Argus Diagnostics & Setup / Sistem Kontrol Aşaması
echo ============================================================
echo.

REM 1. Requirement Checks / Gereksinim Kontrolleri
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist ".venv\Scripts\python.exe" (
        set "PYTHON_CMD=.venv\Scripts\python.exe"
    ) else if exist "%USERPROFILE%\.local\bin\uv.exe" (
        echo [+] Python found via uv package manager.
        set "PYTHON_CMD=%USERPROFILE%\.local\bin\uv.exe"
    ) else (
        echo [!] ERROR: Python was not found in your system PATH.
        echo [!] HATA: Sisteminizde Python bulunamadı.
        echo Please install Python 3.12+ and add it to PATH / Lütfen Python 3.12+ kurup PATH'e ekleyin.
        pause
        exit /b 1
    )
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] ERROR: Node.js was not found in your system PATH.
    echo [!] HATA: Sisteminizde Node.js bulunamadı.
    echo Please install Node.js 20+ and add it to PATH / Lütfen Node.js 20+ kurup PATH'e ekleyin.
    pause
    exit /b 1
)

REM 2. Backend .venv and requirements check / Sanal Ortam ve Bağımlılık Kontrolü
cd /d "%~dp0"
if not exist ".venv" (
    echo [+] Python virtual environment (.venv) not found. Creating...
    echo [+] Python sanal ortamı (.venv) bulunamadı. Oluşturuluyor...
    python -m venv .venv
    if !ERRORLEVEL! neq 0 (
        echo [!] ERROR: Failed to create virtual environment / Sanal ortam oluşturulamadı.
        pause
        exit /b 1
    )
    echo [+] Sanal ortam oluşturuldu. Installing backend requirements / Bağımlılıklar yükleniyor...
    call .venv\Scripts\pip install -r backend\requirements.txt
) else (
    echo [+] Python virtual environment (.venv) is ready / Python sanal ortamı hazır.
)

REM 3. Frontend node_modules check / Frontend Bağımlılık Kontrolü
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [+] Frontend dependencies (node_modules) not found. Installing...
    echo [+] Frontend bağımlılıkları (node_modules) bulunamadı. Yükleniyor...
    call npm install
    if !ERRORLEVEL! neq 0 (
        echo [!] ERROR: Failed to install npm dependencies / npm install başarısız oldu.
        pause
        exit /b 1
    )
) else (
    echo [+] Frontend dependencies are ready / Frontend bağımlılıkları hazır.
)

echo.
echo ============================================================
echo   [+] Setup check complete! Launching Argus...
echo   [+] Tüm kontroller başarılı! Argus başlatılıyor...
echo ============================================================
echo.

call npm run electron:dev
pause