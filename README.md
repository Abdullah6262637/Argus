<div align="center">

<img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/logo/Ana%20Logo.png" alt="Argus Logo" width="140" />

# Argus — Çoklu Ajan Sistemi

**Aynı anda her şeyi gören çoklu ajan sistemi.**  
Yerel olarak çalışan, tam kapsamlı yapay zeka ajan platformu.  
Birden fazla LLM sağlayıcısını destekler, 200'den fazla araca sahiptir,  
gerçek zamanlı WebSocket iletişimi sunar ve premium bir React arayüzüyle gelir.

![Version](https://img.shields.io/badge/version-0.2.0-blue?style=flat-square)
![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20Python%203.12-009688?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-React%2018%20%2B%20TypeScript-61DAFB?style=flat-square)
![Database](https://img.shields.io/badge/database-SQLite%20(aiosqlite)-lightgrey?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

</div>

---

## 📋 İçindekiler

- [Genel Bakış](#-genel-bakış)
- [Mimari](#-mimari)
- [Özellikler](#-özellikler)
- [LLM Sağlayıcıları](#-llm-sağlayıcıları)
- [Araç Kataloğu](#️-araç-kataloğu)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [API Referansı](#-api-referansı)
- [Frontend Yapısı](#-frontend-yapısı)
- [Bellek ve Bilgi Grafiği](#-bellek-ve-bilgi-grafiği)
- [İş Akışları (Workflows)](#-i̇ş-akışları-workflows)
- [MCP Entegrasyonu](#-mcp-entegrasyonu)
- [Rust Performans Motoru](#-rust-performans-motoru)
- [Güvenlik ve İzinler](#-güvenlik-ve-i̇zinler)
- [Ses (Voice)](#-ses-voice)
- [Gözlemlenebilirlik](#-gözlemlenebilirlik)
- [Kısayollar](#️-klavye-kısayolları)
- [Geliştirici Rehberi](#-geliştirici-rehberi)

---

## 🌟 Genel Bakış

**Argus**, birden fazla yapay zeka ajanını aynı anda çalıştırmanıza, yönetmenize ve birbirleriyle iletişim kurmasına olanak tanıyan yerel bir platform sistemidir. Tek bir makine üzerinde OpenAI, Anthropic, Google Gemini, Mistral, DeepSeek, xAI Grok, Groq ve yerel Ollama modellerini kullanarak ajan ekipleri kurabilirsiniz.

### Neden Argus?

| Özellik | Argus | Alternatifler |
|---|---|---|
| Tamamen yerel çalışma | ✅ | ❌ Bulut zorunlu |
| Çoklu LLM sağlayıcı | ✅ 8+ | ⚠️ Genellikle 1-2 |
| 200+ yerleşik araç | ✅ | ❌ Az araç |
| Gerçek zamanlı WebSocket | ✅ SSE + WS | ⚠️ Çoğu yalnızca HTTP |
| Onay mekanizması | ✅ | ❌ |
| MCP protokol desteği | ✅ | ❌ |
| Vektör belleği + KG | ✅ | ⚠️ Ek kütüphane gerekir |
| Görsel iş akışı editörü | ✅ | ❌ |
| Planlama motoru | ✅ Çok adımlı | ⚠️ Basit |

---

## 🏗️ Mimari

```
argus/
├── backend/                        # FastAPI + Python 3.12
│   ├── app/
│   │   ├── main.py                 # Uygulama giriş noktası (lifespan, CORS, routing)
│   │   ├── config.py               # Pydantic-settings ile .env yönetimi
│   │   ├── database.py             # SQLite (aiosqlite + SQLAlchemy async)
│   │   ├── models/                 # SQLAlchemy ORM modelleri
│   │   ├── schemas/                # Pydantic request/response şemaları
│   │   ├── routers/                # API endpoint grupları (14 router)
│   │   └── services/
│   │       ├── agent_loop.py       # Ajan çalışma döngüsü (ReAct tarzı)
│   │       ├── agent_manager.py    # Ajan yaşam döngüsü ve durum yönetimi
│   │       ├── chat_service.py     # Sohbet ve SSE streaming servisi
│   │       ├── workflow.py         # Görsel iş akışı yürütücüsü
│   │       ├── scheduler.py        # APScheduler tabanlı görev zamanlayıcı
│   │       ├── coordinator.py      # Çoklu ajan koordinasyonu
│   │       ├── llm/                # LLM sağlayıcı katmanı
│   │       │   ├── factory.py      # Sağlayıcı fabrikası
│   │       │   ├── openai_provider.py
│   │       │   ├── anthropic_provider.py
│   │       │   ├── gemini_provider.py
│   │       │   ├── tester.py       # Bağlantı test sistemi (SSL + format doğrulama)
│   │       │   └── models_catalog.py
│   │       ├── tools/              # 200+ araç (50+ dosya)
│   │       ├── memory/             # Vektör belleği + bilgi grafiği
│   │       ├── mcp/                # Model Context Protocol köprüsü
│   │       ├── browser/            # Playwright tabanlı tarayıcı otomasyonu
│   │       ├── planning/           # Çok adımlı planlama motoru
│   │       ├── security/           # Sandbox ve rate limiting
│   │       ├── observability/      # Yapısal loglama + trace ID
│   │       └── plugins/            # Plugin yükleyici
│   └── agents/                     # Ajan YAML konfigürasyonları
├── frontend/                       # React 18 + TypeScript + Vite
│   └── src/
│       ├── App.tsx                 # Ana uygulama koordinatörü
│       ├── components/             # 28 UI bileşeni
│       ├── hooks/                  # 9 custom React hook
│       ├── api/                    # API istemci katmanı
│       ├── types/                  # TypeScript tür tanımları
│       └── utils/                  # Yardımcı fonksiyonlar
├── plugins/                        # Harici plugin sistemi
├── scripts/                        # Yardımcı betikler
├── installer/                      # Kurulum araçları
├── start.bat                       # Windows başlatma betiği
└── start.ps1                       # PowerShell başlatma betiği
```

### Veri Akışı

```
Kullanıcı → React UI
    ↓ HTTP REST veya SSE (Server-Sent Events)
FastAPI Backend (port 8000)
    ↓
Agent Loop (ReAct: Düşün → Araç Çağır → Gözlemle → Yanıt ver)
    ↓                    ↓                    ↓
  LLM API           Tool Registry         Memory Store
(OpenAI, vb.)    (200+ araç)          (ChromaDB + KG)
    ↓
WebSocket → React UI (gerçek zamanlı güncelleme)
```

---

## ✨ Özellikler

### 🤖 Ajan Motoru
- **ReAct döngüsü**: Her ajan Düşün → Araç Çağır → Gözlemle → Yanıt ver döngüsüyle çalışır
- **Çok adımlı planlama**: Karmaşık görevleri otomatik olarak alt adımlara böler
- **Yansıma (Reflection)**: Plan yürütüldükten sonra ajan kendi çıktısını değerlendirir
- **Paralel ajan çalışması**: Birden fazla ajan eş zamanlı olarak farklı görevleri yürütebilir
- **Ajan koordinasyonu**: Bir ajan başka bir ajana görev devredebilir (`DelegateToAgent` aracı)
- **Kara tahta (Blackboard)**: Ajanlar arası paylaşılan hafıza alanı (`BlackboardSet/Get`)
- **Onay mekanizması**: Riskli araç çağrıları kullanıcı onayına sunulur
- **Prompt versiyonlama**: Her sistem prompt değişikliği tarihsel olarak saklanır

### 💬 Sohbet Sistemi
- **SSE streaming**: Gerçek zamanlı token akışı (Server-Sent Events)
- **WebSocket**: Çift yönlü canlı iletişim (ajan durum güncellemeleri)
- **Sohbet geçmişi**: Konuşma geçmişi korunur ve SQLite'ta saklanır
- **Markdown render**: Kod blokları, tablolar, matematiksel denklemler
- **Dosya yükleme**: Sohbet penceresine dosya bırakma (drag & drop)
- **Ses girişi**: Mikrofon ile sesli mesaj gönderme (Web Speech API)
- **Ekran görüntüsü görüntüleyici**: Ajan tarafından alınan ekran görüntüleri satır içi gösterilir
- **Görev zaman çizelgesi**: Her ajan adımı görsel olarak takip edilebilir

### 🖥️ Kullanıcı Arayüzü
- **Premium kurulum sihirbazı**: 4 adımlı, animasyonlu ilk kurulum akışı
- **Splash screen**: Sistem başlatılırken animasyonlu boot ekranı (logo + adım adım)
- **Reset screen**: Sistem sıfırlanırken adımlı silme animasyonu
- **Komut paleti**: `Ctrl+K` ile hızlı komut erişimi (Spotlight benzeri)
- **4 tema**: Mono (siyah-beyaz), Midnight (lacivert), Sunset (turuncu), Forest (yeşil)
- **Tema renk paleti önizlemesi**: Her tema kartında 4 renkli swatch gösterimi
- **Yoğunluk + font boyutu**: Kullanıcı tercihlerine göre ayarlanabilir
- **Çoklu panel düzeni**: Ajan listesi + sohbet + sistem paneli
- **Klavye kısayolları**: Tüm kritik işlevlere kısayol ataması
- **Sağ tık bağlam menüsü**: Ajan listesinde bağlam tabanlı işlemler
- **Ajan denetçisi**: Ajan ayrıntıları, prompt geçmişi ve istatistikler
- **Boş durum ekranı**: Ajan yokken kullanıcıyı yönlendiren premium tasarım

### 🔧 Ajan Yapılandırma Formu (6 Adım)
1. **Temel Bilgiler**: Ad, rol, açıklama, sistem prompt, avatar, renk
2. **LLM Yapılandırması**: Sağlayıcı, model, sıcaklık, API anahtarı, bağlantı testi (SSL seçeneği dahil), animasyonlu test izleyicisi
3. **Medya Yetenekleri**: Görüntü, video, ses işleme yetkinlikleri
4. **Davranış**: Araç izinleri, bellek limitleri, planlama ayarları
5. **Yetkiler**: Araç grubuna göre erişim izinleri
6. **Plugins ve MCP**: Aktif plugin ve MCP sunucu bağlantıları

---

## 🧠 LLM Sağlayıcıları

Argus, aşağıdaki sağlayıcıları yerel **provider factory** katmanı üzerinden destekler:

<div align="center">

<table>
  <tr>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/openai-official.png" width="48" height="48" alt="OpenAI" /><br/>
      <b>OpenAI</b><br/>
      <sub>gpt-4o · o1 · o3</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/anthropic.png" width="48" height="48" alt="Anthropic" /><br/>
      <b>Anthropic</b><br/>
      <sub>claude-3.5-sonnet · opus</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/gemini.png" width="48" height="48" alt="Gemini" /><br/>
      <b>Google Gemini</b><br/>
      <sub>gemini-2.5-pro · flash</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/openrouter.png" width="48" height="48" alt="OpenRouter" /><br/>
      <b>OpenRouter</b><br/>
      <sub>100+ model</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/groq.png" width="48" height="48" alt="Groq" /><br/>
      <b>Groq</b><br/>
      <sub>llama-3.3 · mixtral</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/deepseek.png" width="48" height="48" alt="DeepSeek" /><br/>
      <b>DeepSeek</b><br/>
      <sub>deepseek-v3 · r1</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/mistral.png" width="48" height="48" alt="Mistral" /><br/>
      <b>Mistral</b><br/>
      <sub>large · medium · codestral</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/xai.png" width="48" height="48" alt="xAI" /><br/>
      <b>xAI Grok</b><br/>
      <sub>grok-4 · grok-2</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/local.png" width="48" height="48" alt="Local" /><br/>
      <b>Yerel (Ollama)</b><br/>
      <sub>llama3 · qwen2.5 · phi4</sub>
    </td>
    <td align="center" width="130">
      <img src="https://raw.githubusercontent.com/Abdullah6262637/Argus/main/frontend/public/providers/lmstudio.png" width="48" height="48" alt="LM Studio" /><br/>
      <b>LM Studio</b><br/>
      <sub>Tüm GGUF modeller</sub>
    </td>
  </tr>
</table>

</div>

| Sağlayıcı | Ortam Değişkeni | Model Örnekleri |
|---|---|---|
| **OpenAI** | `OPENAI_API_KEY` | gpt-4o, gpt-4o-mini, o1, o3, gpt-4-turbo |
| **Anthropic** | `ANTHROPIC_API_KEY` | claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus |
| **Google Gemini** | `GEMINI_API_KEY` | gemini-2.5-pro, gemini-2.5-flash, gemini-1.5-pro |
| **OpenRouter** | `OPENROUTER_API_KEY` | 100+ model (tüm büyük sağlayıcılar) |
| **Groq** | `GROQ_API_KEY` | llama-3.3-70b, mixtral-8x7b, gemma-2-9b |
| **DeepSeek** | `DEEPSEEK_API_KEY` | deepseek-v3, deepseek-reasoner (r1) |
| **Mistral** | `MISTRAL_API_KEY` | mistral-large, mistral-medium, codestral |
| **xAI (Grok)** | `XAI_API_KEY` | grok-4, grok-2, grok-beta |
| **Yerel (Ollama/LM Studio)** | — | llama3.3, qwen2.5, deepseek-r1, phi4 |

### Bağlantı Test Sistemi

Her sağlayıcı için gelişmiş bir bağlantı doğrulama sistemi mevcuttur:

- **API anahtar format doğrulaması**: OpenAI `sk-`, Anthropic `sk-ant-` prefix kontrolü
- **Gerçek istek testi**: `max_tokens: 32` ile küçük bir istek atılır
- **Latency ölçümü**: Milisaniye bazında yanıt süresi gösterilir
- **Örnek yanıt**: Dönen ilk token önizlemesi
- **SSL/TLS seçeneği**: Kurumsal proxy veya self-signed sertifikalı ortamlar için SSL doğrulama atlama
- **Yerel model tanısı**: Ollama bağlantı hatalarında `ollama serve` yönlendirmesi
- **Animasyonlu test izleyici**: 4 adımlı görsel ilerleme göstergesi

---

## 🛠️ Araç Kataloğu

Argus, **200'den fazla** yerleşik araç içerir. Bu araçlar izin tabanlı filtreleme sistemiyle ajanın yetkilerine göre kısıtlanır.

### 📁 Dosya Sistemi
| Araç | Açıklama |
|---|---|
| `read_file` | Dosya okuma |
| `write_file` | Dosya yazma |
| `append_file` | Dosyaya ekleme |
| `list_dir` | Dizin listeleme |
| `copy_file` | Dosya kopyalama |
| `move_file` | Dosya taşıma |
| `delete_file` | Dosya silme |
| `mkdir` | Klasör oluşturma |
| `search_files` | Dosya arama |
| `zip_files` / `unzip` | Sıkıştırma işlemleri |

### 🌐 Web & Tarayıcı
| Araç | Açıklama |
|---|---|
| `web_search` | DuckDuckGo web araması |
| `open_url` | URL açma |
| `browser_navigate` | Playwright ile sayfa gezinme |
| `browser_click` | Eleman tıklama |
| `browser_fill` | Form doldurma |
| `browser_get_text` | Sayfa metni çıkarma |
| `browser_screenshot` | Sayfa ekran görüntüsü |
| `read_webpage` | Web sayfası içeriği |
| `read_webpage_markdown` | Markdown formatında sayfa içeriği |
| `generate_pdf_from_webpage` | Web sayfasından PDF üretme |

### 💻 Sistem & İşlem
| Araç | Açıklama |
|---|---|
| `run_command` | Terminal komutu çalıştırma (izin listesi ile kısıtlı) |
| `system_info` | Sistem bilgisi |
| `list_processes` | İşlem listesi |
| `kill_process` | İşlem sonlandırma |
| `open_app` | Uygulama açma |
| `get_datetime` | Tarih/saat |
| `shutdown` / `lock_screen` | Sistem güç kontrolü |
| `set_volume` | Ses seviyesi |

### 🖱️ UI Otomasyonu
| Araç | Açıklama |
|---|---|
| `screenshot` | Ekran görüntüsü alma |
| `click` | Koordinata tıklama |
| `type_text` | Metin yazma |
| `key_press` | Tuş basımı |
| `mouse_move` | Fare hareketi |
| `list_windows` | Pencere listesi |
| `focus_window` | Pencere odaklama |
| `minimize/maximize_window` | Pencere boyutu |

### 🧬 AI & ML
| Araç | Açıklama |
|---|---|
| `sentiment_analysis` | Duygu analizi |
| `text_summarization` | Metin özetleme |
| `code_generation` | Kod üretimi |
| `code_explanation` | Kod açıklama |
| `bug_detection` | Hata tespiti |
| `test_generation` | Test kodu üretimi |
| `sql_query_generate` | SQL sorgu üretimi |
| `huggingface_inference` | HuggingFace model çalıştırma |
| `openai_embedding` | Embedding vektörü üretimi |
| `openai_moderation` | İçerik moderasyonu |
| `prompt_optimize` | Prompt optimizasyonu |

### 📊 Veri Bilimi
| Araç | Açıklama |
|---|---|
| `pandas_read_csv` | CSV okuma |
| `pandas_describe` | İstatistiksel özet |
| `matplotlib_line/bar/scatter` | Grafik oluşturma |
| `linear_regression` | Lineer regresyon |
| `kmeans_clustering` | K-means kümeleme |
| `correlation_analysis` | Korelasyon analizi |
| `time_series_forecast` | Zaman serisi tahmini |

### 🔧 Git & DevOps
| Araç | Açıklama |
|---|---|
| `git_init/clone/status/diff` | Git temel işlemleri |
| `git_commit/push/pull` | Git senkronizasyon |
| `git_log/branch` | Git geçmiş ve dal |
| `docker_run/build/ps/logs` | Docker container yönetimi |
| `kubectl_get/apply/logs` | Kubernetes yönetimi |

### 🔐 Güvenlik & Ağ
| Araç | Açıklama |
|---|---|
| `http_request` | HTTP/HTTPS istekleri |
| `download_file` | Dosya indirme |
| `ping_host` | Ağ bağlantı testi |
| `port_scan` | Port tarama |
| `ssl_cert_check` | SSL sertifika doğrulama |
| `whois_query` | Alan adı sorgulama |
| `dns_lookup` | DNS çözümleme |

### 📧 İletişim & Mesajlaşma
| Araç | Açıklama |
|---|---|
| `email_send` | E-posta gönderme |
| `email_read_inbox` | Gelen kutusu okuma |
| `telegram_send` | Telegram mesajı |
| `slack_send` | Slack mesajı |
| `discord_send` | Discord mesajı |

### 📄 Belge İşleme
| Araç | Açıklama |
|---|---|
| `read_document` | Word/PDF/metin okuma |
| `pdf_generate` | PDF oluşturma |
| `xlsx_write` | Excel dosyası oluşturma |
| `pptx_generate` | PowerPoint oluşturma |
| `pdf_merge/split` | PDF birleştirme/bölme |
| `markdown_to_html` | Format dönüştürme |

### 🧠 Bellek Araçları
| Araç | Açıklama |
|---|---|
| `save_memory` | Vektör belleğine kaydetme |
| `recall_memory` | Anlam bazlı bellek arama |
| `list_memory` | Bellek listeleme |
| `delete_memory` | Bellek silme |
| `vector_search` / `vector_upsert` | Vektör veritabanı işlemleri |
| `ingest_document` | Belge vektörize etme |
| `kg_add_entity/relation` | Bilgi grafiği düğüm/ilişki ekleme |
| `kg_search` / `kg_query_neighbors` | Bilgi grafiği sorgulama |

### ☁️ Bulut Servisleri
| Araç | Açıklama |
|---|---|
| `aws_s3_list/upload` | AWS S3 işlemleri |
| `aws_ec2_list` | AWS EC2 listeleme |
| `azure_blob_list` | Azure Blob Storage |
| `gcp_storage_list` | Google Cloud Storage |

### 🔬 Araştırma
| Araç | Açıklama |
|---|---|
| `arxiv_search` | arXiv akademik arama |
| `wikipedia_lookup` | Wikipedia sorgulama |
| `youtube_search` | YouTube video arama |
| `youtube_transcript` | Video transkript alma |

### 🧪 Test & QA
| Araç | Açıklama |
|---|---|
| `unit_test_generate/run` | Birim test üretme/çalıştırma |
| `integration_test` | Entegrasyon testi |
| `api_test_generate/run` | API test senaryoları |
| `ui_test_record/playback` | UI test kayıt/oynatma |
| `performance_test` | Performans testi |

### ⚙️ Diğer
| Araç | Açıklama |
|---|---|
| `sandbox_execute_python/js` | İzolated ortamda kod çalıştırma |
| `github_api` | GitHub API erişimi |
| `docker_sandbox_run` | Docker izole çalıştırma |
| `delegate_to_agent` | Başka ajana görev devretme |
| `agent_wait_for_approval` | Kullanıcı onayı bekleme |
| `blackboard_set/get` | Ajanlar arası paylaşılan veri |
| `uuid_generator` | UUID üretme |
| `hash_generator` | Hash üretme |
| `weather` | Hava durumu |
| `get_ip_address` | IP adresi |

---

## 🚀 Kurulum

### Gereksinimler

- **Python 3.12+**
- **Node.js 18+**
- **Git**

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/Abdullah6262637/Argus.git
cd Argus
```

### 2. Backend Kurulumu

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Kurulumu

```bash
cd frontend
npm install
```

### 4. Ortam Değişkenleri

```bash
cp backend/.env.example backend/.env
# .env dosyasını düzenleyin (API anahtarlarını ekleyin)
```

### 5. Başlatma

**Windows Command Prompt (Double-click or CMD):**
```cmd
start.bat
```

**PowerShell / Terminal:**
```powershell
.\start.bat
# or
.\start.ps1
```

**Manuel:**
```bash
# Backend (terminal 1)
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (terminal 2)
cd frontend
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışır. İlk açılışta **Kurulum Sihirbazı** otomatik olarak açılır.

---

## ⚙️ Ortam Değişkenleri

`backend/.env` dosyasına aşağıdaki değişkenleri ekleyin:

```env
# ── LLM API Anahtarları ──────────────────────────
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...
GROQ_API_KEY=gsk_...
DEEPSEEK_API_KEY=sk-...
MISTRAL_API_KEY=...
XAI_API_KEY=...

# ── Uygulama ─────────────────────────────────────
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# ── Veritabanı ───────────────────────────────────
DATABASE_URL=sqlite+aiosqlite:///./data/argus.db

# ── Güvenlik Limitleri ───────────────────────────
MAX_TOKENS_PER_REQUEST=2048
MAX_HISTORY_MESSAGES=30

# ── Planlama Motoru ──────────────────────────────
PLAN_MAX_STEPS=7
PLAN_REFLECTION_ENABLED=true
PLAN_RETRY_LIMIT=2

# ── Tarayıcı Otomasyonu ──────────────────────────
BROWSER_HEADLESS=true
BROWSER_TIMEOUT_MS=30000

# ── Vektör Belleği ───────────────────────────────
EMBEDDING_PROVIDER=local           # local | openai
EMBEDDING_MODEL_LOCAL=sentence-transformers/all-MiniLM-L6-v2
CHROMA_PATH=./data/chroma
KNOWLEDGE_GRAPH_PATH=./data/knowledge_graph.json

# ── Sandbox Güvenliği ────────────────────────────
RUN_COMMAND_ALLOWLIST=git,npm,python,pip,node,echo,dir,ls

# ── Rate Limiting ────────────────────────────────
RATE_LIMIT_OPENAI_RPM=60
RATE_LIMIT_OPENAI_TPM=200000
RATE_LIMIT_ANTHROPIC_RPM=50
RATE_LIMIT_ANTHROPIC_TPM=100000

# ── Gözlemlenebilirlik ───────────────────────────
LOG_FORMAT=text                    # text | json

# ── Ses ─────────────────────────────────────────
VOICE_ENABLED=false

# ── Plugin ──────────────────────────────────────
PLUGINS_DIR=../plugins
```

---

## 📡 API Referansı

Backend, `http://localhost:8000` adresinde çalışır. Tam interaktif dokümantasyon için `http://localhost:8000/docs` adresini ziyaret edin.

### Ajan Endpointleri (`/api/agents`)

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/agents` | Tüm ajanları listele |
| `POST` | `/api/agents` | Yeni ajan oluştur |
| `GET` | `/api/agents/{id}` | Ajan detayı |
| `PATCH` | `/api/agents/{id}` | Ajan güncelle |
| `DELETE` | `/api/agents/{id}` | Ajan sil |
| `POST` | `/api/agents/{id}/duplicate` | Ajan kopyala |
| `POST` | `/api/agents/test-connection` | LLM bağlantısını test et |
| `GET` | `/api/agents/{id}/models` | Sağlayıcı model listesi |
| `POST` | `/api/agents/bulk-update-provider` | Toplu sağlayıcı güncelleme |

### Sohbet Endpointleri (`/api/chat`)

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/chat/{agent_id}/history` | Sohbet geçmişi |
| `POST` | `/api/chat/{agent_id}` | Mesaj gönder (streaming) |
| `DELETE` | `/api/chat/{agent_id}/history` | Geçmişi temizle |
| `GET` | `/api/chat/{agent_id}/stream` | SSE stream başlat |

### Sistem Endpointleri (`/api/system`)

| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/api/system/status` | Sistem durumu |
| `GET` | `/api/system/setup-status` | Kurulum durumu |
| `POST` | `/api/system/setup-save` | Kurulum ayarlarını kaydet |
| `POST` | `/api/system/reset` | Sistemi sıfırla |
| `GET` | `/api/system/env-status` | API anahtar durumu |
| `GET` | `/api/system/doctor` | Sistem tanı |

### Diğer Endpointler

| Router | Prefix | Açıklama |
|---|---|---|
| Tasks | `/api/tasks` | Zamanlanmış görevler (APScheduler) |
| Logs | `/api/logs` | Sistem ve ajan logları |
| Memory | `/api/memory` | Vektör belleği CRUD |
| Skills | `/api/skills` | Ajan yetenekleri |
| MCP | `/api/mcp` | MCP sunucu yönetimi |
| Workflows | `/api/workflows` | İş akışı CRUD ve çalıştırma |
| Voice | `/api/voice` | Ses sentezi |
| Approvals | `/api/approvals` | Onay kuyrukları |
| Coordinator | `/api/coordinator` | Çoklu ajan koordinasyonu |
| WebSocket | `/ws/{agent_id}` | Gerçek zamanlı bağlantı |

---

## 🎨 Frontend Yapısı

### Bileşenler

| Bileşen | Açıklama |
|---|---|
| `App.tsx` | Ana koordinatör; routing, state yönetimi |
| `SetupWizard.tsx` | 4 adımlı kurulum sihirbazı |
| `SplashScreen.tsx` | Boot animasyon ekranı |
| `ResetScreen.tsx` | Sıfırlama animasyon ekranı |
| `AgentForm.tsx` | 6 adımlı ajan oluşturma/düzenleme formu |
| `AgentList.tsx` | Sol panel ajan listesi |
| `ChatWindow.tsx` | Ana sohbet alanı (SSE streaming) |
| `MessageBubble.tsx` | Mesaj balonu (Markdown, araç çıktıları) |
| `SystemPanel.tsx` | Sağ panel sistem monitörü |
| `SettingsModal.tsx` | Ayarlar (tema, API anahtarları, plugins, sıfırlama) |
| `WorkflowsModal.tsx` | Görsel iş akışı editörü |
| `CommandPalette.tsx` | Spotlight benzeri komut paleti (Ctrl+K) |
| `KnowledgeGraphModal.tsx` | Bilgi grafiği görselleştirici |
| `AgentInspector.tsx` | Ajan denetçisi (prompt geçmişi, istatistikler) |
| `TaskTimeline.tsx` | Ajan adım zaman çizelgesi |
| `ApprovalDialog.tsx` | Araç onay diyaloğu |
| `ConfirmDialog.tsx` | Onay diyaloğu (silme, sıfırlama) |
| `Header.tsx` | Üst navigasyon çubuğu |
| `VoiceButton.tsx` | Ses girişi butonu |
| `FileBrowser.tsx` | Dosya gezgini |
| `FileDropZone.tsx` | Sürükle-bırak dosya alanı |

### Custom Hooks

| Hook | Açıklama |
|---|---|
| `useAgents` | Ajan listesi ve CRUD işlemleri |
| `useChat` | SSE streaming ve mesaj yönetimi |
| `useWebSocket` | Gerçek zamanlı WS bağlantısı |
| `useTheme` | Tema yönetimi (localStorage kalıcı) |
| `useAppearance` | Yoğunluk ve font boyutu |
| `useApprovals` | Araç onay kuyruk yönetimi |
| `useKeyboardShortcuts` | Global klavye kısayolları |
| `useModal` | Modal ve form state yönetimi (Context) |

### Tema Sistemi

4 ayrı tema CSS değişkenleri üzerinden çalışır (`data-theme` niteliği):

| Tema | Arka Plan | Vurgu Rengi | Atmosfer |
|---|---|---|---|
| `mono` | `#000000` | `#ffffff` | Siyah-beyaz minimalist |
| `midnight` | `#0b1220` | `#60a5fa` | Gece mavisi |
| `sunset` | `#1a0f0a` | `#fb923c` | Sıcak turuncu-amber |
| `forest` | `#0a1410` | `#34d399` | Koyu orman yeşili |

---

## 👤 Ajan Yönetimi

### Ajan Şablon Koleksiyonu

Kurulum sihirbazında 12 hazır şablon ajan seçilebilir:

| Şablon | Rol |
|---|---|
| 🧑‍💻 Geliştirici | Kod yazar, refaktör eder, hata ayıklar |
| 🔍 Araştırmacı | Web'de derin araştırma yapar |
| ✍️ Yazar | Blog, makale ve uzun form içerikler |
| 📢 Sosyal Medya | Kısa, çekici sosyal medya içerikleri |
| 🔧 DevOps | CI/CD, Docker, Kubernetes |
| 📊 Veri Analisti | SQL, pandas, veri analizi |
| 📋 Proje Yöneticisi | Görev planı, durum raporları |
| 🎧 Müşteri Desteği | Empatik, çözüm odaklı yanıtlar |
| 👁️ Kod Reviewer | PR kalite ve güvenlik incelemesi |
| 🌍 Çevirmen | TR-EN ve diğer dil çevirileri |
| 📣 Pazarlama | Kampanya, reklam metni |
| 🎓 Eğitmen | Konuları sade örneklerle öğretir |

### Ajan İzin Sistemi

Her ajana aşağıdaki izinler ayrı ayrı verilebilir:

- `web_search` — Web araması
- `file_read` / `file_write` — Dosya okuma/yazma
- `code_execution` — Kod çalıştırma
- `system_commands` — Terminal komutları
- `ui_automation` — UI otomasyonu
- `network_access` — HTTP istekleri
- `memory_read` / `memory_write` — Bellek erişimi
- `browser_control` — Playwright tarayıcı kontrolü

---

## 🧠 Bellek ve Bilgi Grafiği

### Vektör Belleği (ChromaDB)

Ajanlar uzun vadeli anlam tabanlı belleğe sahiptir:

```
Kaydet → Anlamsal vektör üretimi → ChromaDB'ye depola
Hatırla → Sorgu vektörizasyonu → Cosine similarity araması → İlgili anılar
```

- **Yerel embedding**: `sentence-transformers/all-MiniLM-L6-v2` (internet gerektirmez)
- **OpenAI embedding**: `text-embedding-3-small` (daha yüksek kalite)
- Her ajan kendi izole bellek alanına sahiptir

### Bilgi Grafiği (Knowledge Graph)

Ajanlar yapılandırılmış bilgi ilişkileri oluşturabilir:

- **Düğüm ekleme**: `kg_add_entity` — Varlık, özellik ve etiket
- **İlişki ekleme**: `kg_add_relation` — İki düğüm arasında yönlü ilişki
- **Anlam araması**: `kg_search` — Metin tabanlı düğüm arama
- **Komşu sorgulama**: `kg_query_neighbors` — Bir düğümün bağlantıları
- **Görsel keşif**: `KnowledgeGraphModal` bileşeni ile interaktif grafik

---

## 🔄 İş Akışları (Workflows)

Görsel iş akışı editörü ile karmaşık otomasyon zincirleri oluşturabilirsiniz:

- **Sürükle-bırak node editörü**: Adımları görsel olarak bağlayın
- **Koşullu dallanma**: Şart tabanlı akış yönlendirmesi
- **Ajan adımları**: Her node bir ajan çağrısı
- **Araç adımları**: Doğrudan araç çalıştırma
- **Döngü desteği**: Tekrarlayan görevler için döngü yapıları
- **İş akışı şablonları**: Hazır iş akışı şablonları
- **Zamanlama**: APScheduler ile belirli aralıklarda otomatik çalıştırma

---

## 🔌 MCP Entegrasyonu

[Model Context Protocol](https://modelcontextprotocol.io/) desteği ile harici araç sunucularına bağlanabilirsiniz:

```json
// Örnek MCP sunucu yapılandırması
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
}
```

- MCP araçları otomatik olarak ajan araç kataloğuna eklenir
- Stdio ve SSE transport protokolleri desteklenir
- Bağlantı durumu arayüzde gerçek zamanlı gösterilir

### Ajanlar Arası İletişim

Ajanlar koordinasyon araçlarını (`delegate_to_agent`, `blackboard_set/get`) kullanarak işbirliği yapabilirler. Bir ajan karmaşık bir alt problemi çözmek için paylaşılan karatahtaya veri bırakıp başka bir ajanı o veriyle göreve çağırabilir.

---

## 🦀 Rust Performans Motoru

Argus, CPU-yoğun ve yüksek I/O gerektiren işlemler için native **Rust Performans Motoruna (`argus_core`)** sahiptir. PyO3 köprüsü ile Python ve Rust hibrit olarak çalışır. Rust ikilisi bulunamadığında sistem otomatik olarak Python alternatiflerine (fallback) geri döner.

### ⚡ Performans Karşılaştırması & Modüller

| Modül | Görev | Performans Artışı | Rust Alt Yapısı |
|---|---|---|---|
| **`crypto`** | Dosya/metin hash, HMAC doğrulama, UUID v4, Base64 | **~50x Hızlı** | `sha2`, `hmac`, `md-5`, `uuid` |
| **`compress`** | Dizin/Dosya ZIP ve TAR.GZ sıkıştırma ve açma | **~30x Hızlı** | `flate2`, `zip`, `tar` |
| **`fs`** | Rayon ile paralel dosya sistemi tarama ve istatistik | **~40x Hızlı** | `walkdir`, `rayon` |
| **`text`** | Metin istatistikleri, kelime frekansı, regex arama | **~15x Hızlı** | `regex` |
| **`sandbox`** | Shell injection koruması ve komut allowlist kontrolü | **Zero-Allocation** | Native String Matching |

### 🛠️ Derleme ve Kurulum

Rust modülünü derlemek için bilgisayarınızda Rust derleyicisinin (`cargo`) kurulu olması gerekir.

```powershell
# Proje kök dizininde veya backend dizininde derleme betiğini çalıştırın:
powershell -ExecutionPolicy Bypass -File "backend\build_rust.ps1"
```

Derleme sonrasında `backend/app/services/tools/argus_core.pyd` dosyası üretilir ve sistem otomatik olarak optimize edilmiş native hıza geçer.

---

## 🔒 Güvenlik ve İzinler

### Sandbox Koruması

- `run_command` aracı yalnızca `RUN_COMMAND_ALLOWLIST`'teki komutlara izin verir
- Çalışma dizini `RUN_COMMAND_CWD_JAIL` ile kısıtlanabilir
- Docker sandbox aracı tamamen izole ortamda kod çalıştırır

### Rate Limiting

Her LLM sağlayıcı için istek ve token limitleri:
- OpenAI: dakikada 60 istek, 200.000 token
- Anthropic: dakikada 50 istek, 100.000 token

### Denetim Günlüğü (Audit Log)

Kritik işlemler HMAC imzalı denetim kaydına alınır:
- Ajan oluşturma/silme
- Sistem sıfırlama
- Araç yetki değişiklikleri

### Onay Mekanizması

Riskli araçlar (`delete_file`, `run_command`, vb.) kullanıcı onayına sunulabilir:
1. Ajan araç çağrısı yapar
2. Sistem onay kuyruğuna ekler
3. Kullanıcı arayüzde onay/red diyaloğu görür
4. Onay verilirse araç çalışır, red verilirse ajan başka yol dener

---

## 🎤 Ses (Voice)

```env
VOICE_ENABLED=true
```

- **Ses girişi**: Web Speech API ile tarayıcı tabanlı konuşma tanıma
- **Ses çıkışı**: TTS (Text-to-Speech) araçları ile metinden ses sentezi
- **Sesli yanıt**: Ajan yanıtları sesli olarak okunabilir

---

## 📈 Gözlemlenebilirlik

### Yapısal Loglama

```env
LOG_FORMAT=json  # Yapısal JSON logları (log aggregation sistemleri için)
```

### Trace ID

Her HTTP isteği `x-trace-id` başlığıyla izlenir. Tüm log satırları bu ID'yi içerir, böylece dağıtık sistemlerde hata takibi kolaylaşır.

### Sistem Paneli

Sağ panel şunları gerçek zamanlı gösterir:
- Ajan çalışma durumu
- Son araç çağrıları
- Sistem kaynakları
- Log akışı

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---|---|
| `Ctrl + K` | Komut paletini aç |
| `Ctrl + N` | Yeni ajan oluştur |
| `Ctrl + Shift + N` | Yeni sohbet |
| `Ctrl + R` | Ajanları yenile |
| `Ctrl + ,` | Ayarları aç |
| `Ctrl + E` | Seçili ajanı düzenle |
| `Ctrl + Shift + E` | Ajan JSON'ını dışa aktar |
| `Ctrl + Shift + S` | Sohbeti Markdown olarak dışa aktar |
| `1-9` | İlgili ajanı seç |

---

## 🧑‍💻 Geliştirici Rehberi

### Backend Test

```bash
cd backend
pytest tests/ -v
```

### Frontend Test

```bash
cd frontend
npm test
```

### Tip Kontrolü

```bash
cd frontend
npx tsc --noEmit
```

### Yeni Araç Ekleme

1. `backend/app/services/tools/` altında yeni dosya oluşturun
2. `BaseTool` sınıfını extend edin:

```python
from app.services.tools.base import BaseTool, PermissionKey, ToolResult

class MyNewTool(BaseTool):
    name = "my_new_tool"
    description = "Aracın ne yaptığını açıkla"
    permission_key = PermissionKey.CODE_EXECUTION  # İzin gereksinimleri

    async def run(self, ctx, param1: str, param2: int = 10) -> ToolResult:
        # Araç mantığı
        return ToolResult(output=f"Sonuç: {param1}")
```

3. `registry.py` dosyasına import edin ve `_all_tools` listesine ekleyin

### Yeni LLM Sağlayıcı Ekleme

1. `backend/app/services/llm/` altında `myprovider_provider.py` oluşturun
2. `BaseLLMProvider`'ı extend edin
3. `factory.py`'daki `get_provider()` fonksiyonuna ekleyin

---

## 📄 Lisans

MIT License — Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🤝 Katkı

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

<div align="center">
  <strong>Argus</strong> — Aynı anda her şeyi gören çoklu ajan sistemi
  <br/>
  <sub>FastAPI + React + SQLite + ChromaDB + Playwright</sub>
</div>