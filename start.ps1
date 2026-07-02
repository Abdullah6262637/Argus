# UmtalAgent — Tek tikla baslatma scripti (PowerShell)
# Backend + Vite + Electron'u tek seferde baslatir

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UmtalAgent baslatiliyor..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Port 8000 kontrolu (opsiyonel)
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "[!] Port 8000 zaten kullanimda (PID: $($port8000.OwningProcess))." -ForegroundColor Yellow
    $kill = Read-Host "Onceki backend'i kapatmak ister misin? (e/H)"
    if ($kill -eq "e" -or $kill -eq "E") {
        Stop-Process -Id $port8000.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "[+] Eski backend kapatildi." -ForegroundColor Green
        Start-Sleep -Seconds 1
    }
}

Set-Location -Path "$PSScriptRoot\frontend"
npm run electron:dev