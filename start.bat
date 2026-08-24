@echo off
<<<<<<< HEAD
REM ============================================================
REM Argus — Smart Setup & Launch Script
REM ============================================================

echo.
echo ============================================================
echo   Argus Diagnostics and Setup / Sistem Kontrol Asamasi
=======
SETLOCAL EnableDelayedExpansion
chcp 65001 >nul

echo.
echo ============================================================
echo   Argus Diagnostics ^& Setup / Sistem Kontrol Asamasi
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
echo ============================================================
echo.

cd /d "%~dp0"

<<<<<<< HEAD
IF EXIST ".venv\Scripts\python.exe" GOTO CHECK_NODE
IF EXIST "%USERPROFILE%\.local\bin\uv.exe" (
    echo [+] Python found via uv package manager. Creating .venv...
    "%USERPROFILE%\.local\bin\uv.exe" venv .venv
    GOTO CHECK_NODE
)

where python >nul 2>nul
IF %ERRORLEVEL% EQU 0 GOTO CHECK_NODE

echo [!] ERROR: Python was not found in your system PATH.
echo [!] HATA: Sisteminizde Python bulunamadi.
echo Please install Python 3.12+ and add it to PATH.
pause
exit /b 1

:CHECK_NODE
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Node.js was not found in your system PATH.
    echo [!] HATA: Sisteminizde Node.js bulunamadi.
=======
REM 1. Check if .venv already exists
if exist ".venv\Scripts\python.exe" (
    echo [+] Python sanal ortami venv hazir.
    goto check_node
)

REM 2. Check system python
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] Sistem Python bulundu. .venv olusturuluyor...
    python -m venv .venv
    call .venv\Scripts\pip install -r backend\requirements.txt
    goto check_node
)

REM 3. Check AppData local python
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    echo [+] Python 3.12 bulundu. .venv olusturuluyor...
    "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" -m venv .venv
    call .venv\Scripts\pip install -r backend\requirements.txt
    goto check_node
)

echo [!] HATA: Python bulunamadi. Lutfen Python 3.12+ kurun.
pause
exit /b 1

:check_node
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] HATA: Sistemde Node.js bulunamadi. Lutfen Node.js 20+ kurup PATH'e ekleyin.
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
    pause
    exit /b 1
)

<<<<<<< HEAD
IF NOT EXIST ".venv" (
    echo [+] Python virtual environment (.venv) not found. Creating...
    IF EXIST "%USERPROFILE%\.local\bin\uv.exe" (
        "%USERPROFILE%\.local\bin\uv.exe" venv .venv
    ) ELSE (
        python -m venv .venv
    )
    call .venv\Scripts\pip install -r backend\requirements.txt
) ELSE (
    echo [+] Python virtual environment (.venv) is ready.
)

cd /d "%~dp0frontend"
IF NOT EXIST "node_modules" (
    echo [+] Frontend dependencies (node_modules) not found. Installing...
    call npm install
) ELSE (
    echo [+] Frontend dependencies are ready.
=======
REM 4. Check frontend dependencies
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [+] Frontend bagimliliklari node_modules yukleniyor...
    call npm install
) else (
    echo [+] Frontend bagimliliklari hazir.
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
)

echo.
echo ============================================================
<<<<<<< HEAD
echo   [+] Setup check complete! Launching Argus...
=======
echo   [+] Tum kontroller basarili! Argus baslatiliyor...
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
echo ============================================================
echo.

call npm run electron:dev
pause