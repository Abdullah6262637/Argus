# 02 — Kurulum ve İlk Çalıştırma

## Gereksinimler

| Gereksinim | Minimum Sürüm | Kontrol |
|---|---|---|
| Python | 3.12+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | — | `git --version` |

> **Not:** Playwright için Chromium otomatik indirilir. Ekstra kurulum gerekmez.

---

## Adım 1 — Depoyu Klonlayın

```bash
git clone https://github.com/Abdullah6262637/Argus.git
cd Argus
```

---

## Adım 2 — Backend Kurulumu

```bash
cd backend

# Sanal ortam oluştur
python -m venv .venv

# Sanal ortamı etkinleştir
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

### Bağımlılık Sorunları

```bash
# pip'i güncelle
python -m pip install --upgrade pip

# Tekrar dene
pip install -r requirements.txt
```

---

## Adım 3 — Frontend Kurulumu

```bash
cd frontend
npm install
```

---

## Adım 4 — Ortam Dosyası

```bash
# Kök dizinde (Argus/)
cp backend/.env.example backend/.env
```

Ardından `backend/.env` dosyasını bir metin editörüyle açın ve en az bir API anahtarı ekleyin:

```env
OPENAI_API_KEY=sk-...
```

> Hangi anahtarların gerekli olduğu → [04-llm-saglayicilar.md](04-llm-saglayicilar.md)

---

## Adım 4.5 — Rust Performans Motoru Derleme (Opsiyonel)

Kripto, sıkıştırma, dosya arama ve metin işlemlerini native (C/C++) hızında çalıştırmak için Rust core motorunu derleyin:

```powershell
# Proje kök dizinindeyken:
powershell -ExecutionPolicy Bypass -File "backend\build_rust.ps1"
```

*Not: Eğer bilgisayarınızda Rust derleyicisi (`cargo`) yoksa, sistem otomatik olarak Python fallback (geriye uyumlu alternatif) kodunu çalıştıracaktır.*

---

## Adım 5 — Başlatma

### Windows — Command Prompt veya Çift Tıklama (Önerilen)

```cmd
start.bat
```

`start.bat` dosyasına çift tıklayabilir veya klasik CMD terminalinden çalıştırabilirsiniz.

### Windows — PowerShell

PowerShell, güvenlik önlemleri nedeniyle geçerli dizindeki betikleri doğrudan çalıştırmaz. Bu yüzden başına `.\` eklemelisiniz:

```powershell
.\start.bat
# veya
.\start.ps1
```

### Manuel Başlatma (İki Terminal)

**Terminal 1 — Backend:**
```bash
cd backend
.venv\Scripts\activate    # Windows
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

---

## Adım 6 — İlk Açılış

Tarayıcınızda `http://localhost:5173` adresini açın.

İlk açılışta **Kurulum Sihirbazı** otomatik olarak başlar:

### Sihirbaz Adımları

**Adım 1 — Sistem Kontrolü**
- Python, Node.js ve SQLite versiyonları otomatik kontrol edilir
- Tüm sistemler yeşil gösterildikten sonra ileri geçilebilir

**Adım 2 — API Anahtarları**
- Kullanmak istediğiniz LLM sağlayıcıların API anahtarlarını girin
- En az bir anahtar girmek önerilir (OpenAI veya Anthropic ile başlayın)
- Anahtarlar `.env` dosyasına güvenli şekilde kaydedilir

**Adım 3 — Hazır Ajan Şablonları**
- 12 hazır ajan şablonundan istediklerinizi seçin (Developer, Researcher, Writer, vb.)
- Toplu sağlayıcı seçimi yapabilirsiniz (tüm ajanlar aynı provider ile)

**Adım 4 — Tema Seçimi**
- Mono / Midnight / Sunset / Forest temalarından birini seçin
- Her temada renk paleti önizlemesi gösterilir

**Bitiş → Splash Screen**
Kurulum tamamlandığında animasyonlu bir boot ekranı açılır:
- Argus logosu görünür
- Sistem bileşenleri sırayla başlatılır (veritabanı, ajanlar, servisler)
- Yaklaşık 6 saniye sonra ana ekrana geçilir

---

## Sık Karşılaşılan Sorunlar

### "Python bulunamadı" Hatası

```bash
# Python'u PATH'e ekleyin
# Windows: python.exe yolunu Sistem Değişkenlerine ekleyin

# Kontrol:
python --version
# veya
python3 --version
```

### "Port 8000 kullanımda" Hatası

```powershell
# Windows PowerShell — portu kullanan işlemi kapat:
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```

### npm Yükleme Hatası

```bash
# npm önbelleğini temizle
npm cache clean --force
npm install
```

### Playwright Chromium İndirme Hatası

```bash
cd backend
python -m playwright install chromium
```

### Uygulama Açılmıyor (Boş Ekran)

- Backend'in çalıştığından emin olun: `http://localhost:8000/api/health`
- Konsolda hata mesajı var mı kontrol edin (F12)

---

## Durdurma

```bash
# stop.bat (Windows) — tek tıkla durdur
stop.bat

# veya terminalden Ctrl+C
```

---

## Versiyon Güncelleme

```bash
git pull origin main

# Backend bağımlılıklarını güncelle
cd backend && pip install -r requirements.txt

# Frontend bağımlılıklarını güncelle
cd frontend && npm install

# Yeniden başlat
start.bat
```
