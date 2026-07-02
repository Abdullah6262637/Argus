@echo off
REM Argus — Tek tikla baslatma scripti (Windows)
REM Backend + Vite + Electron'u tek seferde baslatir
cd /d "%~dp0frontend"
echo.
echo ========================================
echo   Argus baslatiliyor...
echo ========================================
echo.
echo Eger port 8000 kullanimda ise once:
echo   taskkill /F /IM python.exe /T
echo komutunu calistir.
echo.
call npm run electron:dev
pause