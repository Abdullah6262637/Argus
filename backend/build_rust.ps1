#!/usr/bin/env pwsh
# ─────────────────────────────────────────────────────────────
# Argus Rust Core — Build & Deploy Script
# ─────────────────────────────────────────────────────────────
# Rust crate'i derler ve .pyd dosyasini Python'un bulabilecegi
# dizine kopyalar. Kullanim:
#   .\build_rust.ps1           # release build
#   .\build_rust.ps1 -Debug    # debug build (hizli derleme)

param(
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

$RustCoreDir = Join-Path $PSScriptRoot "rust_core"
$ToolsDir    = Join-Path $PSScriptRoot "app\services\tools"
$VenvPython  = Join-Path (Split-Path $PSScriptRoot -Parent) ".venv\Scripts\python.exe"

# ── Rust kurulu mu? ──
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "❌ cargo bulunamadi. Rust'i kurmak icin: https://rustup.rs"
    exit 1
}

# ── PYO3_PYTHON ayarla ──
if (Test-Path $VenvPython) {
    $env:PYO3_PYTHON = $VenvPython
    Write-Host "🐍 PYO3_PYTHON = $VenvPython" -ForegroundColor Cyan
} else {
    Write-Warning "⚠️  .venv Python bulunamadi, sistem Python kullanilacak"
}

# ── Derle ──
Push-Location $RustCoreDir
try {
    if ($Debug) {
        Write-Host "🔨 Debug build baslatiliyor..." -ForegroundColor Yellow
        cargo build 2>&1
        $ProfileDir = "debug"
    } else {
        Write-Host "🚀 Release build baslatiliyor (LTO + strip)..." -ForegroundColor Green
        cargo build --release 2>&1
        $ProfileDir = "release"
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Rust derleme basarisiz (exit code: $LASTEXITCODE)"
        exit 1
    }

    # ── .dll → .pyd kopyala ──
    $DllPath = Join-Path $RustCoreDir "target\$ProfileDir\argus_core.dll"
    $PydPath = Join-Path $ToolsDir "argus_core.pyd"

    if (Test-Path $DllPath) {
        Copy-Item $DllPath $PydPath -Force
        $size = (Get-Item $PydPath).Length
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host ""
        Write-Host "✅ Argus Rust Core basariyla derlendi!" -ForegroundColor Green
        Write-Host "   📦 Boyut: $sizeMB MB" -ForegroundColor Cyan
        Write-Host "   📍 Konum: $PydPath" -ForegroundColor Cyan
        Write-Host ""

        # ── Hizli import testi ──
        & $env:PYO3_PYTHON -c "import sys; sys.path.insert(0, r'$ToolsDir'); import argus_core; print('   🦀 Python import testi: BASARILI -', len(dir(argus_core)), 'obje')"
    } else {
        Write-Error "❌ DLL bulunamadi: $DllPath"
        exit 1
    }
} finally {
    Pop-Location
}
