# 🔐 Code Signing — UmtalAgent

> Sprint C.8 — Production paketlerinin sertifikalı imzalanması rehberi.

Bu doküman opsiyonel ama **şiddetle önerilir**. Sertifikasız imza Windows'ta SmartScreen, macOS'ta Gatekeeper uyarısı ile sonuçlanır.

---

## 1. Windows — Authenticode

### Maliyet
- **OV (Organization Validated):** $80–250/yıl (DigiCert, Sectigo, SSL.com)
- **EV (Extended Validation):** $250–500/yıl — SmartScreen reputation hızlıca kazanır

### Adımlar

1. CA'dan `.pfx` dosyası al (parola korumalı).
2. Yerel sertifika için ortam değişkenleri:
   ```powershell
   $env:CSC_LINK = "C:\path\to\cert.pfx"
   $env:CSC_KEY_PASSWORD = "parolaniz"
   ```
3. Build:
   ```powershell
   cd frontend
   npm run build
   npx electron-builder --win --x64 --publish=never
   ```
4. CI'da: GitHub Secrets'a `CSC_LINK_BASE64` (base64'lü pfx) ve `CSC_KEY_PASSWORD` ekle.

### Doğrulama
```powershell
Get-AuthenticodeSignature .\release\UmtalAgent-Setup.exe
# Status: Valid
```

---

## 2. macOS — Apple Developer ID

### Maliyet
- **Apple Developer Program:** $99/yıl

### Adımlar

1. Apple Developer hesabı aç.
2. Xcode → Preferences → Accounts ile sertifika indir (Developer ID Application).
3. `~/.zshenv` veya CI secret'larına:
   ```bash
   export APPLE_ID="apple@example.com"
   export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
   export APPLE_TEAM_ID="ABCD1234"
   export CSC_NAME="Developer ID Application: Your Name (ABCD1234)"
   ```
4. `frontend/package.json` `build.mac` config'i (zaten hazır):
   ```json
   "hardenedRuntime": true,
   "gatekeeperAssess": false
   ```
5. Build:
   ```bash
   cd frontend
   npm run build
   npx electron-builder --mac --x64 --arm64
   ```
6. **Notarization** (Gatekeeper için zorunlu, otomatik yapılır):
   - electron-builder, sertifika varsa otomatik `xcrun notarytool` çağırır.
   - 5–15 dakika sürer.

### Doğrulama
```bash
spctl -a -vv UmtalAgent.app
# accepted, source=Notarized Developer ID
```

---

## 3. Linux — GPG Signature (opsiyonel)

### Adımlar

1. GPG key oluştur:
   ```bash
   gpg --full-generate-key
   gpg --list-secret-keys --keyid-format LONG
   gpg --export-secret-keys <KEY_ID> > private.key
   ```
2. AppImage / .deb için detached signature:
   ```bash
   gpg --detach-sign --armor UmtalAgent.AppImage
   ```
3. `.sig` dosyasını release ile birlikte yayınla.

### Doğrulama
```bash
gpg --verify UmtalAgent.AppImage.asc UmtalAgent.AppImage
```

---

## 4. CI/CD Entegrasyonu

[`.github/workflows/release.yml`](../.github/workflows/release.yml:1) zaten tag push'unda `electron-builder` çağırıyor. Sertifika eklemek için:

```yaml
- name: Build and sign
  env:
    CSC_LINK: ${{ secrets.CSC_LINK_BASE64 }}
    CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  working-directory: frontend
  run: npx electron-builder --win --mac --linux --publish=never
```

---

## 5. Sertifikasız İmzalı Test Yapısı (Geliştirme)

İmzasız build hala çalışır:
- **Windows:** "Run anyway" tıklamak gerekir (SmartScreen uyarısı)
- **macOS:** `xattr -cr UmtalAgent.app` ile quarantine attribute'u kaldırılabilir
- **Linux:** AppImage `chmod +x` sonrası direkt çalışır

---

## 6. Sertifika Maliyeti Özeti

| Platform | Tip | Yıllık Maliyet | SmartScreen Reputation |
|---|---|---|---|
| Windows | OV | $80–250 | Yavaş kazanır (haftalar) |
| Windows | EV | $250–500 | Anında |
| macOS | Apple Developer ID | $99 | N/A — Gatekeeper Notarization |
| Linux | GPG (self) | Ücretsiz | Manuel doğrulama |

---

## 7. Sertifikasız Yayın İçin Notlar

İlk sürümler için sertifikasız yayın kabul edilebilir; `README.md`'de kullanıcıya aşağıdaki bilgi verilmeli:

> ⚠️ **İlk sürümler imzasız.** Windows'ta SmartScreen "Daha fazla bilgi → Yine de çalıştır" tıklamanız gerekebilir. macOS'ta sağ tık → "Aç" yapıp ilk seferde onaylamanız yeterlidir.