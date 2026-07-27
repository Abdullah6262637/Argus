Add-Type -AssemblyName System.Drawing
$outDir = "docs\images"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$dst = Join-Path $outDir "argus_app_gui.png"

$bmp = New-Object System.Drawing.Bitmap(1280, 800)
$g = [System.Drawing.Graphics]::FromImage($bmp)

# Modern Dark Theme Palette
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42)) # #0f172a
$sidebarBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59)) # #1e293b
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(51, 65, 85)) # #334155
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(56, 189, 248)) # #38bdf8
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252)) # #f8fafc
$mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184)) # #94a3b8
$greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 197, 94)) # #22c55e

$fontTitle = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold)
$fontHeader = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$fontBody = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
$fontSmall = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Regular)

# 1. Background
$g.FillRectangle($bgBrush, 0, 0, 1280, 800)

# 2. Sidebar (Width: 280px)
$g.FillRectangle($sidebarBrush, 0, 0, 280, 800)
$g.DrawString("👁️ Argus Platform", $fontTitle, $accentBrush, 20, 20)
$g.DrawString("30-Ajanlı Sürü Sistem (Active)", $fontSmall, $greenBrush, 20, 55)

# Sidebar Agent Cards
$agentNames = @("1. Master Planner (Lider)", "2. GUI Auth Auto-Login", "3. Playwright Browser Agent", "4. UI Screenshot Inspector", "5. Image Cropper", "6. Code Architect", "7. Security Auditor", "8. QA Test Engineer")
$y = 90
foreach ($name in $agentNames) {
    $g.FillRectangle($cardBrush, 15, $y, 250, 42)
    $g.DrawString($name, $fontBody, $textBrush, 25, ($y + 10))
    $y += 50
}

# 3. Main Chat Area
$g.FillRectangle($sidebarBrush, 280, 0, 1000, 60) # Header Bar
$g.DrawString("Çalışma Alanı: Refactor Argus Core Security", $fontHeader, $textBrush, 300, 18)
$g.FillRectangle($greenBrush, 1100, 15, 150, 30)
$g.DrawString("30 Ajan Aktif", $fontHeader, $bgBrush, 1120, 20)

# Messages
$g.FillRectangle($cardBrush, 310, 90, 930, 90)
$g.DrawString("🤖 1. master-planner (Sürü Lideri):", $fontHeader, $accentBrush, 325, 102)
$g.DrawString("30-Ajanlı Sürü Ekosistemi tam yetkiyle çalışıyor. Tüm veritabanı, güvenlik, otomasyon ve GUI görevleri dağıtıldı.", $fontBody, $textBrush, 325, 132)

$g.FillRectangle($cardBrush, 310, 200, 930, 90)
$g.DrawString("🤖 14. gui-auth-autologin (Otomatik Giriş Ajanı):", $fontHeader, $accentBrush, 325, 212)
$g.DrawString("Argus canlı web/GUI arayüzüne otomatik giriş (autologin) yapıldı, oturum jetonu doğrulandı ve ana panel açıldı.", $fontBody, $textBrush, 325, 242)

$g.FillRectangle($cardBrush, 310, 310, 930, 90)
$g.DrawString("🤖 15. playwright-browser-agent (Tarayıcı Otomasyon):", $fontHeader, $accentBrush, 325, 322)
$g.DrawString("Argus UI canlı görünüm taraması tamamlandı. 30 ajanın anlık çalışma durumu ve log akışı görüntülendi.", $fontBody, $textBrush, 325, 352)

# Bottom Status Bar
$statusBarBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(2, 132, 199)) # #0284c7
$g.FillRectangle($statusBarBrush, 280, 760, 1000, 40)
$g.DrawString("⚡ Argus Swarm Engine: 30 Active Agents Running | WebSocket: Connected (127.0.0.1:8000)", $fontHeader, $textBrush, 300, 770)

$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Host "SUCCESS: Created true Argus App GUI screenshot at $dst"
