# 📖 UmtalAgent — Kullanıcı Kılavuzu

> **Sürüm:** v3.0 · Otonom AI Agent Sistemi
> **Hedef Kitle:** Son kullanıcı (geliştirici olmayanlar dahil)

---

## 1. Kurulum

### 1.1 Gereksinimler

| Gereken | Versiyon |
|---|---|
| **Python** | 3.10 veya üzeri |
| **Node.js** | 18 veya üzeri |
| **OS** | Windows 10+ / macOS 12+ / Linux |
| **RAM** | 4 GB (8 GB önerilir) |
| **Disk** | 2 GB boş alan |

### 1.2 İlk Çalıştırma (Windows)

```powershell
# 1) Backend bağımlılıkları
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# 2) Frontend bağımlılıkları
cd ..\frontend
npm install

# 3) Hepsini birden başlat
cd ..
.\start.bat
```

İlk açılışta **Onboarding Sihirbazı** açılır:
- Tema seçimi (açık / koyu)
- İlk ajanı oluşturma yönlendirmesi
- API key giriş alanı

### 1.3 İlk Ajanı Oluştur

İlk açılışta **`agents.yaml` zaten 12 hazır şablon ajanla gelir**:
geliştirici, araştırmacı, yazar, sosyal medya, devops, veri analisti,
proje yöneticisi, müşteri desteği, kod gözden geçirici, çevirmen,
pazarlama, eğitmen. Sol panelden birini seçip hemen sohbete başlayabilirsiniz.

Yeni ajan eklemek için:

1. Sağ üst köşedeki ➕ butonu → **Yeni Ajan**
2. **Şablon seç** (12+ hazır şablon vardır):
   - 🔬 Researcher — web araştırması
   - 💻 Developer — kod yazma/inceleme
   - ✍️ Writer — içerik üretme
   - 📊 Data Analyst — veri analizi
   - 🌐 Translator — çeviri
   - 📣 Marketing — pazarlama stratejisi
   - 🎓 Tutor — özel öğretmen
   - 🛠️ DevOps — sistem yönetimi
   - ...
3. **Provider seç**: OpenAI, Anthropic, Gemini, Ollama, Groq, Mistral, DeepSeek, xAI veya OpenRouter
4. **API key** gir (yerel Ollama için gerekmez)
5. **Modeli seç** (örn: `gpt-4o-mini`, `claude-3-5-sonnet`, `gemini-2.5-pro`)
6. **İzinleri ayarla**: dosya, terminal, web, sistem yönetimi
7. **Kaydet** ve sohbete başla

---

## 2. Sohbet Etme

### 2.1 Plan-Driven Mod (varsayılan)

Karmaşık bir istek yazdığında:
1. **TaskPlanner** isteğini 1-7 adıma böler
2. Üst kısımda 📋 **Plan Paneli** açılır, adımlar canlı güncellenir
3. Her adımda kullanılan tool'lar gerçek zamanlı görünür
4. **Reflector** her adımı değerlendirir: ✅ pass / 🔁 retry / 🔄 replan / ❌ fail

### 2.2 Tool Kullanımı (Otomatik)

UmtalAgent **70+ tool** ile gelir. Ajan kendi karar verir:
- "Masaüstündeki txt dosyalarını listele" → `list_dir`
- "google.com'u aç" → `open_url`
- "Notepad'i çalıştır" → `open_app`
- "Bu PDF'i özetle" → `read_document`
- "Şu konuyu araştır" → `web_search` + `read_webpage`

### 2.3 HITL (Human-in-the-Loop) Onay

Riskli komutlarda (örn: `run_command`, `delete_file`, `email_send`, `db_execute`)
sağ alt köşede **🛡️ Onay Penceresi** açılır:
- Tool adı + tüm argümanlar gösterilir
- Risk seviyesi (low / medium / high)
- ✓ **Onayla** veya ✗ **Reddet** + (opsiyonel) sebep

5 dakika içinde karar verilmezse otomatik **timeout** olur.

### 2.4 Sesli Mesaj

Mesaj kutusunun yanındaki 🎤 butonu:
- Tıkla → mikrofon açılır (kırmızı animasyon)
- Konuş → tıkla durdur
- **Whisper STT** transkripsiyonu input'a yazar

> Not: `pip install -r backend/requirements-voice.txt` ile aktifleşir.

### 2.5 Dosya Yükleme (📎)

ChatWindow başlığındaki 📎 → drag-drop alanı açılır.
PDF / DOCX / XLSX / CSV / HTML / TXT / MD dosyalarını sürükle:
- Otomatik chunk + embed → vector store'a yazılır
- Sonraki sohbetlerde ajan **otomatik hatırlar** (vector search ile)

---

## 3. Plan, Reflection ve Inspector

### 3.1 Plan Paneli (📋)

```
🎯 Hedef: "Web'de X konusunu araştır ve PDF rapor üret"

📋 Plan (3/4)
  ✓ #1 Web'de X araştır            → 🤔 pass: "Yeterli kaynak bulundu"
  ✓ #2 Bilgileri özetle             → 🤔 pass: "Net özet üretildi"
  🔄 #3 PDF üret                    (çalışıyor)
  ○ #4 Email gönder                  (bekleniyor)
```

### 3.2 Sağ Panel Tabs

- **📋 Görevler** — zamanlanmış cron tabanlı görevler
- **📊 Loglar** — son 50 log girdisi
- **🔍 Inspector** — seçili ajanın istatistikleri:
  - Tool kullanım sayıları + ortalama süreler
  - Son hatalar
  - Memory chunk sayısı

---

## 4. Otomasyon

### 4.1 Zamanlanmış Görevler

Sağ panelde **Görevler** tab'ında **+ Yeni** ile cron-tabanlı görev ekle:

```
Ajan: Researcher
İsim: Günlük teknoloji haberleri
Cron: 0 9 * * *   (her gün 09:00)
Prompt: Son 24 saatteki AI haberlerini özetle ve email at.
```

### 4.2 Workflow'lar (⚡)

Hazır workflow'lar (`backend/agents/workflows/`):
- `research_and_report` — araştır → PDF → email
- `daily_news_digest` — günlük bülten + Slack
- `code_review_pipeline` — git pull → diff → review → PDF
- `example.yaml` — basit örnek

⚡ butonu **iki yerde** mevcut:
- **Header'da** (sol üst tarafta) — global Workflow modal açar
- **ChatWindow başlığında** — seçili ajanla birlikte workflow çalıştırır

Workflow seç → JSON inputs gir → çalıştır.

### 4.3 MCP (Model Context Protocol) Server'ları

`backend/agents/mcp_servers.yaml` içinde 4 örnek MCP server tanımı bulunur:

```yaml
servers:
  - name: filesystem      # @modelcontextprotocol/server-filesystem
  - name: github          # @modelcontextprotocol/server-github
  - name: sqlite          # @modelcontextprotocol/server-sqlite
  - name: brave-search    # @modelcontextprotocol/server-brave-search
```

Etkinleştirmek için:
1. `pip install mcp` (Python SDK)
2. İlgili server'da `enabled: true` yap
3. Gerekiyorsa `env:` altında API key gir
4. Backend'i yeniden başlat → tool'lar `mcp_<server>_<tool>` olarak görünür

### 4.3 Knowledge Graph (🕸️)

Ajan `kg_add_entity` ve `kg_add_relation` tool'larıyla bilgi grafiği oluşturur.
Header'daki 🕸️ → KG modal açılır:
- Tüm node'ları görüntüle
- Search ile filtrele
- İlişkileri (edge) listele

---

## 5. Bellek

### 5.1 Otomatik Hatırlama

Her N mesajda bir konuşma otomatik özetlenir + embedding'lenir. Yeni bir konuşmada:
- LLM **vector search** ile ilgili eski özetleri bulur
- Sistem prompt'a `<memory>` bloğu olarak eklenir
- Ajan eski bilgileri "hatırlıyormuş gibi" cevap verir

### 5.2 Bellek Yönetimi

- **Drag-drop dosya** → kalıcı bellek
- `vector_search` tool'u ile arama
- `vector_upsert` ile manuel ekleme
- Inspector tab'ında chunk sayısı

---

## 6. SSS

**S: API key'lerim güvende mi?**
C: Evet. `cryptography` (Fernet) + OS keyring ile şifrelenir. `agents.yaml`
içine düz metin yazsanız bile backend ilk yüklemede otomatik olarak
`enc::...` formatına çevirir. Master key OS keyring'de
(`umtalagent` servis adı altında) ya da fallback olarak
`backend/data/.master_key` (0600 izin) içinde saklanır.

**S: İnternet olmadan çalışır mı?**
C: Ollama provider ile evet. Yerel modellerde tool calling sınırlı olabilir.

**S: Birden fazla ajanı birlikte çalıştırabilir miyim?**
C: Evet — Workflow YAML veya `delegate_to_agent` tool'u ile.

**S: Veriler nereye saklanıyor?**
C: `backend/data/umtalagent.db` (SQLite) ve `backend/data/chroma/` (vector).

**S: Tüm verilerimi silmek istersem?**
C: Ayarlar → "Sistemi Sıfırla" → **SIFIRLA** yaz → onayla.

---

## 7. Sorun Giderme

| Belirti | Çözüm |
|---|---|
| Backend başlamıyor | `pip install -r backend/requirements.txt` çalıştır |
| WebSocket "kopuk" | `start.bat`'i kapat, tekrar aç |
| API key reddedildi | Ajan ayarları → API key yenile |
| Tool çalışmıyor | İzinler kapalı olabilir, ajan ayarlarına bak |
| Memory boş | `pip install chromadb sentence-transformers` |
| Voice çalışmıyor | `pip install -r backend/requirements-voice.txt` |
| PDF üretilmiyor | `pip install reportlab` veya `fpdf2` |
| Excel yazılmıyor | `pip install openpyxl` |
| Image üretilmiyor | OPENAI_API_KEY gerekli |