Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Win32 API for finding and bringing Argus window to foreground
$code = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
"@
Add-Type -TypeDefinition $code

$outDir = "docs\images"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$dst = Join-Path $outDir "argus_app_gui.png"

# Argus veya Electron penceresini ara
$hwnd = [Win32]::FindWindow($null, "Argus")
if ($hwnd -eq [IntPtr]::Zero) {
    # Başlık eşleşmezse tüm ekranın görünür alanını al
    Write-Host "[!] Argus penceresi aranıyor... Ekran görüntüsü yakalanıyor."
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bmp = New-Object System.Drawing.Bitmap($bounds.Width, ($bounds.Height - 40))
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen(0, 0, 0, 0, $bmp.Size)
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "SUCCESS: Captured screen to $dst"
} else {
    [Win32]::SetForegroundWindow($hwnd)
    Start-Sleep -Milliseconds 500
    $rect = New-Object Win32+RECT
    [Win32]::GetWindowRect($hwnd, [ref]$rect)
    $w = $rect.Right - $rect.Left
    $h = $rect.Bottom - $rect.Top
    
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "SUCCESS: Captured Argus Application Window to $dst"
}
