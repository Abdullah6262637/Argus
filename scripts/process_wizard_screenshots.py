import os
from PIL import Image

uploaded_files = [
    ("media__1785157352318.png", "wizard_step1.png"),
    ("media__1785157386385.png", "wizard_step2.png"),
    ("media__1785157406294.png", "wizard_step3.png"),
    ("media__1785157425210.png", "wizard_step4.png"),
    ("media__1785157434994.png", "wizard_step5.png"),
]

brain_dir = r"C:\Users\HP\.gemini\antigravity\brain\e6346b68-c61a-4581-92d2-ab307f74b85e\.user_uploaded"
out_dir = os.path.join("docs", "images")
os.makedirs(out_dir, exist_ok=True)

for src_name, dst_name in uploaded_files:
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(out_dir, dst_name)
    if os.path.exists(src_path):
        img = Image.open(src_path)
        w, h = img.size
        # Trim bottom 40px taskbar
        cropped = img.crop((0, 0, w, h - 40))
        cropped.save(dst_path, format="PNG", compress_level=0)
        print(f"Processed {dst_name}: {cropped.size}")
    else:
        print(f"File not found: {src_path}")
