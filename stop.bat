@echo off
REM Argus guvenli durdurma scripti.
REM Sadece Argus'un kullandigi port'lari (8000, 5173) tutan process'leri
REM ve Argus baslikli pencereleri sonlandirir. Diger python/node/electron
REM uygulamalarina dokunmaz.

echo Argus kapatiliyor (guvenli mod)...

REM 1) Port 8000 (backend) ve 5173 (vite) uzerindeki LISTENING process'leri PID-bazli oldur.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports=@(8000,5173); foreach($p in $ports){ try { $procs = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach($pid in $procs){ try { $proc = Get-Process -Id $pid -ErrorAction Stop; if ($proc.ProcessName -match 'python|uvicorn|node') { Write-Host ('Port ' + $p + ' (PID ' + $pid + ', ' + $proc.ProcessName + ') -> kill'); Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } } catch {} } } catch {} }"

REM 2) Argus baslikli pencereleri kapat (electron desktop).
taskkill /F /FI "WINDOWTITLE eq Argus*" 2>NUL

echo Argus kapatildi.