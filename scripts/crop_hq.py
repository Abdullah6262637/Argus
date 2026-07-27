import os
from PIL import Image

src = r"C:\Users\HP\.gemini\antigravity\brain\e6346b68-c61a-4581-92d2-ab307f74b85e\.user_uploaded\media__1785156512311.png"
out_dir = os.path.join("docs", "images")
os.makedirs(out_dir, exist_ok=True)

dst1 = os.path.join(out_dir, "argus_app_gui.png")
dst2 = os.path.join(out_dir, "argus_ui_overview.png")

if os.path.exists(src):
    img = Image.open(src)
    w, h = img.size
    print(f"Original image dimensions: {w}x{h}")
    
    # Sadece alt Windows görev çubuğunu (yaklaşık 40px) hassas şekilde kırp, üst başlık çubuğunu VE alt kontrol butonlarını KORU!
    # Top: 0 (Üst başlık çubuğu "Argus - Çoklu Ajan Sistemi" ve X/-/_ butonları tam korunsun)
    # Bottom: h - 40 (Sadece Windows masaüstü görev çubuğu kırpılsın)
    crop_box = (0, 0, w, h - 40)
    cropped = img.crop(crop_box)
    
    # En yüksek kalitede (Lossless PNG, optimize=False, PNG 100% kalite) kaydet
    cropped.save(dst1, format="PNG", compress_level=0)
    cropped.save(dst2, format="PNG", compress_level=0)
    print(f"SUCCESS: High Quality 4K Cropped Image Saved to {dst1} and {dst2} (Size: {cropped.size})")
else:
    print(f"ERROR: Source file not found: {src}")
