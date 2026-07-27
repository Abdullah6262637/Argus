Add-Type -AssemblyName System.Drawing
$src = "C:\Users\HP\.gemini\antigravity\brain\eab09da3-0b99-4ab9-a5c0-2cc32bf5b826\ui_screenshot.png"
$outDir = "docs\images"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
$dst = Join-Path $outDir "argus_ui_overview.png"

if (Test-Path $src) {
    $img = [System.Drawing.Image]::FromFile($src)
    $w = $img.Width
    $h = $img.Height
    # Masaüstü alt ve üst çubukları kırp
    $cropRect = New-Object System.Drawing.Rectangle(0, 35, $w, ($h - 85))
    $bmp = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "SUCCESS: Clean cropped UI screenshot saved to $dst"
} else {
    Write-Host "ERROR: Source file not found: $src"
}
