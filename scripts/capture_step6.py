"""Playwright script to open Argus wizard and capture Step 6 (Plugins ve MCP)."""
import os
import time
from playwright.sync_api import sync_playwright

def main():
    out_dir = os.path.join("docs", "images")
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, "wizard_step6.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False) # Headless False for reliability
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        
        try:
            page.goto("http://localhost:5173", timeout=5000)
            time.sleep(2)
            
            # Click "Yeni Ajan" button
            page.click("button:has-text('Yeni Ajan')")
            time.sleep(1)
            
            # Click "İleri" 5 times to reach Step 6
            for _ in range(5):
                page.click("button:has-text('İleri')")
                time.sleep(0.5)
                
            time.sleep(1)
            page.screenshot(path=dst)
            print(f"SUCCESS: Captured Wizard Step 6 to {dst}")
        except Exception as e:
            print(f"Error capturing step 6 via browser: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
