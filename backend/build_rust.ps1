#!/usr/bin/env pwsh
# Argus Rust Core - Build & Deploy Script
param([switch]$Debug)

$RustCoreDir = Join-Path $PSScriptRoot "rust_core"
$ToolsDir    = Join-Path $PSScriptRoot "app\services\tools"
$VenvPython  = Join-Path (Split-Path $PSScriptRoot -Parent) ".venv\Scripts\python.exe"

# Rust kurulu mu?
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "[FAIL] cargo bulunamadi. Rust kurmak icin: https://rustup.rs" -ForegroundColor Red
    exit 1
}

# PYO3_PYTHON ayarla
if (Test-Path $VenvPython) {
    $env:PYO3_PYTHON = $VenvPython
    Write-Host "[INFO] PYO3_PYTHON = $VenvPython" -ForegroundColor Cyan
} else {
    Write-Host "[WARN] .venv Python bulunamadi, sistem Python kullanilacak" -ForegroundColor Yellow
}

# Derle
Push-Location $RustCoreDir
try {
    if ($Debug) {
        Write-Host "[BUILD] Debug build baslatiliyor..." -ForegroundColor Yellow
        $buildOut = cargo build 2>&1
        $ProfileDir = "debug"
    } else {
        Write-Host "[BUILD] Release build baslatiliyor (LTO + strip)..." -ForegroundColor Green
        $buildOut = cargo build --release 2>&1
        $ProfileDir = "release"
    }

    # cargo ciktisini goster (stderr dahil)
    $buildOut | ForEach-Object { Write-Host $_ }

    # .dll -> .pyd kopyala
    $DllPath = Join-Path $RustCoreDir "target\$ProfileDir\argus_core.dll"
    $PydPath = Join-Path $ToolsDir "argus_core.pyd"

    if (Test-Path $DllPath) {
        Copy-Item $DllPath $PydPath -Force
        $size = (Get-Item $PydPath).Length
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host ""
        Write-Host "[OK] Argus Rust Core basariyla derlendi!" -ForegroundColor Green
        Write-Host "     Boyut: $sizeMB MB" -ForegroundColor Cyan
        Write-Host "     Konum: $PydPath" -ForegroundColor Cyan
        Write-Host ""

        # Hizli import testi
        $tmpPy = Join-Path $env:TEMP "argus_rust_test.py"
        $pyCode = @'
import sys, os
sys.path.insert(0, os.path.normpath(TOOLS_DIR_PLACEHOLDER))
import argus_core
print("[TEST] Python import: OK -", len(dir(argus_core)), "obje")
'@
        $pyCode = $pyCode.Replace("TOOLS_DIR_PLACEHOLDER", "'$($ToolsDir.Replace('\','/'))'")
        Set-Content -Path $tmpPy -Value $pyCode -Encoding UTF8
        & $env:PYO3_PYTHON $tmpPy
        Remove-Item $tmpPy -ErrorAction SilentlyContinue
    } else {
        Write-Host "[FAIL] DLL bulunamadi: $DllPath" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}
