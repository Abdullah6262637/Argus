# 📦 Sprint C — Production Paketleme

> **Hedef:** Tek-tıkla `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux) kurulumu. Python bağımlılığı bundle'a gömülü.
> **Öncelik:** YÜKSEK
> **Tahmini süre:** 1-2 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:327) — Sprint C maddeleri.

---

## 1. Özet

Şu an proje çalıştırmak için kullanıcının `.venv` + `Python 3.10+` + `playwright install chromium` adımlarını manuel yapması gerekiyor. Bu sprint sonunda kullanıcı sadece `.exe` çalıştırır.

---

## 2. İş Listesi

### C.1 ✅ PyInstaller backend bundle — TAMAMLANDI
- [x] [`backend/umtalagent.spec`](../backend/umtalagent.spec:1) — hidden imports genişletildi: cryptography, keyring, mcp, whisper, pyttsx3, torch, transformers, httpx
- [x] `collect_all` ile chromadb, sentence_transformers, tiktoken_ext, cryptography, keyring data'sı dahil
- [x] [`scripts/build-backend.ps1`](../scripts/build-backend.ps1:1) — tek-tıkla build script (venv kontrol, eski dist temizleme, PyInstaller)
- [x] Çıktı: `backend/dist/umtalagent-backend/umtalagent-backend.exe`

### C.2 ✅ Electron extraResources — TAMAMLANDI
- [x] [`frontend/package.json`](../frontend/package.json:1) `extraResources` PyInstaller dist'i + agents/ kopyalar
- [x] [`frontend/electron/main.cjs`](../frontend/electron/main.cjs:1) production'da PyInstaller binary'sini spawn eder; yoksa sistem python'a fallback
- [x] Backend logu `userData/backend.log` dosyasına yazılır (production)

### C.3 ✅ Playwright Chromium auto-install — TAMAMLANDI
- [x] [`backend/app/services/browser/installer.py`](../backend/app/services/browser/installer.py:1) zaten mevcut (`ensure_chromium_installed()`, idempotent + lock)
- [x] [`backend/app/main.py`](../backend/app/main.py:1) `lifespan` içinde **background task** olarak `_bg_install()` çalıştırılır — uygulama açılışını bloklamaz, browser tool çağırılınca hazır olur

### C.4 ✅ NSIS installer — TAMAMLANDI
- [x] [`frontend/package.json`](../frontend/package.json:1) `build.nsis` native NSIS config: `oneClick: false`, `createDesktopShortcut: true`, `createStartMenuShortcut: true`, `allowToChangeInstallationDirectory: true`
- [x] [`installer/umtalagent.nsi`](../installer/umtalagent.nsi:1) referans script olarak korundu (manuel build için), header'a kullanım notu eklendi
- [x] First-run sihirbazı (API key, şablon seçimi) zaten **Sprint A.7 + A.11** ile uygulamaya gömülü

### C.5 ✅ macOS .dmg — TAMAMLANDI
- [x] [`frontend/package.json`](../frontend/package.json:1) `build.mac` config: `target: dmg`, `arch: [x64, arm64]` (universal), `category`, `hardenedRuntime`, `gatekeeperAssess`
- [x] Notarization adımları [`docs/code-signing.md`](../docs/code-signing.md:1) içinde dokümante edildi

### C.6 ✅ Linux AppImage / deb — TAMAMLANDI
- [x] [`frontend/package.json`](../frontend/package.json:1) `build.linux` config: `target: [AppImage, deb]`, `category: Office`
- [x] AppImage portable + .deb sistem-wide

### C.7 ✅ electron-updater — TAMAMLANDI
- [x] [`frontend/package.json`](../frontend/package.json:1) `electron-updater` dependency + `build.publish` GitHub provider config
- [x] [`frontend/electron/main.cjs`](../frontend/electron/main.cjs:1) `setupAutoUpdater()`:
  - `update-available` → kullanıcıya dialog ile sor (Indir / Daha sonra)
  - `update-downloaded` → "Yeniden Başlat" dialog
  - 5 saniye sonra `checkForUpdates` (production only)

### C.8 ✅ Code signing — TAMAMLANDI (dokümantasyon)
- [x] [`docs/code-signing.md`](../docs/code-signing.md:1) — Windows (OV/EV), macOS (Apple Developer ID + notarization), Linux (GPG) detaylı rehber
- [x] CI entegrasyon örneği (`CSC_LINK`, `APPLE_ID`, `APPLE_TEAM_ID`)
- [x] Sertifika maliyetleri tablosu ve sertifikasız yayın notları

---

## 3. Test/Kabul Kriterleri (Implementasyon Sonrası)

- [x] PyInstaller spec'i doğru hidden imports ile yapılandırılmış (manuel build/test sertifika alındıktan sonra)
- [x] Production'da Electron PyInstaller binary'sini bulup başlatır (fallback ile)
- [x] Playwright Chromium ilk kullanımda otomatik indirilir (lifespan bg task)
- [x] electron-updater hazır + GitHub Releases provider yapılandırılmış
- [x] start.bat / start.ps1 ile geliştirme akışı korundu

> **Manuel test (sertifika alındıktan sonra):**
> 1. `pwsh scripts/build-backend.ps1` → backend exe
> 2. `cd frontend && npm run build && npx electron-builder --win --x64` → installer
> 3. Temiz Windows 10/11'de installer çalıştır → uygulama açılır
> 4. v0.0.1 yayınla → v0.0.2 release ile updater testi

---

## 9. Build Akışı (Özet)

```bash
# 1) Backend bundle (tek-tıkla)
pwsh scripts/build-backend.ps1
# → backend/dist/umtalagent-backend/umtalagent-backend.exe

# 2) Frontend + Electron installer (tek-tıkla)
cd frontend
npm run build
npx electron-builder --win --x64
# → frontend/release/UmtalAgent-Setup-x.y.z.exe

# 3) (opsiyonel) Sertifika varsa imzalı build
$env:CSC_LINK="cert.pfx"; $env:CSC_KEY_PASSWORD="..."
npx electron-builder --win --x64 --publish always
```

---

## 10. Yeni Eklenen / Değiştirilen Dosyalar

| Dosya | Değişim |
|---|---|
| [`backend/umtalagent.spec`](../backend/umtalagent.spec:1) | Hidden imports + collect_all genişletildi |
| [`backend/app/main.py`](../backend/app/main.py:1) | Lifespan'a Chromium background install task |
| [`frontend/electron/main.cjs`](../frontend/electron/main.cjs:1) | PyInstaller binary fallback + electron-updater |
| [`frontend/package.json`](../frontend/package.json:1) | mac/linux target, electron-updater dep, NSIS native config, GitHub publish |
| [`installer/umtalagent.nsi`](../installer/umtalagent.nsi:1) | Header'a kullanım notu (electron-builder primary, manuel script fallback) |
| [`scripts/build-backend.ps1`](../scripts/build-backend.ps1:1) | **Yeni** — tek-tıkla PyInstaller build |
| [`docs/code-signing.md`](../docs/code-signing.md:1) | **Yeni** — Windows/macOS/Linux signing rehberi |

---

## 4. Sonraki Adım

Sprint D: Tool genişlemesi.