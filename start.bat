@echo off
REM ============================================================
REM Argus — Smart Setup & Launch Script
REM ============================================================

echo.
echo ============================================================
echo   Argus Diagnostics and Setup / Sistem Kontrol Asamasi
echo ============================================================
echo.

cd /d "%~dp0"

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
    pause
    exit /b 1
)

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
)

echo.
echo ============================================================
echo   [+] Setup check complete! Launching Argus...
echo ============================================================
echo.

call npm run electron:dev
pause