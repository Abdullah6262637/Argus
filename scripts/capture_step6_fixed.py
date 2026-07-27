import os
import time
from playwright.sync_api import sync_playwright

def main():
    out_dir = os.path.join("docs", "images")
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, "wizard_step6.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 850})
        
        try:
            page.goto("http://localhost:5173", timeout=10000)
            time.sleep(2)
            
            # 1. "Yeni Ajan" butonuna bas
            page.click("button:has-text('Yeni Ajan')")
            time.sleep(1)
            
            # 2. Step 1'deki "Yazilim Gelistirici" veya "Yazılım Geliştirici" kartsına tikla
            page.click("text=Yazılım Geliştirici")
            time.sleep(1)
            
            # 3. Step 1 -> Step 2 -> Step 3 -> Step 4 -> Step 5 -> Step 6 (Ileri ASCII)
            for step_idx in range(5):
                page.click("button:has-text('Ileri')")
                time.sleep(0.8)
                
            time.sleep(1.5)
            page.screenshot(path=dst)
            print(f"SUCCESS: Captured Wizard Step 6 to {dst}")
        except Exception as e:
            print(f"Error capturing step 6: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
