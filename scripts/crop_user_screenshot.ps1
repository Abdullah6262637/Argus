Add-Type -AssemblyName System.Drawing

$src = "C:\Users\HP\.gemini\antigravity\brain\e6346b68-c61a-4581-92d2-ab307f74b85e\.user_uploaded\media__1785156512311.png"
$outDir = "docs\images"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

if (Test-Path $src) {
    $img = [System.Drawing.Image]::FromFile($src)
    $w = $img.Width
    $h = $img.Height

    # Üst pencere başlık çubuğunu (32px) ve alt Windows görev çubuğunu (40px) kırp
    $cropRect = New-Object System.Drawing.Rectangle(0, 32, $w, ($h - 72))
    $bmp = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)

    $dst1 = Join-Path $outDir "argus_ui_overview.png"
    $dst2 = Join-Path $outDir "argus_app_gui.png"

    $bmp.Save($dst1, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($dst2, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()

    Write-Host "SUCCESS: Clean cropped real Argus GUI image saved to $dst1 and $dst2"
} else {
    Write-Host "ERROR: Source image not found: $src"
}
