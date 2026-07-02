# 🔧 Sprint D — Tool Genişlemesi

> **Hedef:** 60+ tool'a ek olarak medya, bulut, akademik araştırma ve DevOps araçlarını entegre etmek.
> **Öncelik:** ORTA
> **Tahmini süre:** 2 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:243) — Bölüm 5.2/E.

---

## 1. Özet

Şu anki tool seti çekirdek operasyonlar için yeterli. Bu sprint sonunda araştırma, içerik üretimi ve devops senaryolarında "tam kapsamlı" hisset.

---

## 2. İş Listesi

### D.1 Medya & Multimodal *(sonraki sprint)*
- [ ] `screen_record` — ffmpeg/imageio ile ekran kaydı
- [ ] `audio_transcribe_long` — Whisper'ı uzun ses (>30s) için chunked
- [ ] `vision_describe_image` — GPT-4o-vision / Claude vision; image → açıklama
- [ ] `image_edit` — DALL-E 3 / Stable Diffusion ile düzenleme

### D.2 ✅ Akademik & Araştırma — TAMAMLANDI
- [x] `arxiv_search` — [`backend/app/services/tools/research_tools.py`](../backend/app/services/tools/research_tools.py:1) (httpx + XML regex)
- [x] `wikipedia_lookup` — Wikipedia REST API summary endpoint, dil parametreli
- [x] `youtube_search` — DuckDuckGo HTML scrape (API key gerekmez)
- [x] `youtube_transcript` — youtube-transcript-api wrapper (opsiyonel paket)
- [ ] `google_scholar_search` — scholarly paketi (sonraki sprint)

### D.3 Takvim & Planlama *(sonraki sprint — OAuth gerektiriyor)*
- [ ] `google_calendar_list` / `google_calendar_create`
- [ ] `outlook_calendar_*`
- [ ] `caldav_sync`

### D.4 ✅ Doküman & Yayınlama — TAMAMLANDI
- [x] `pdf_merge` / `pdf_split` — [`backend/app/services/tools/document_extra_tools.py`](../backend/app/services/tools/document_extra_tools.py:1) (pypdf)
- [x] `pptx_generate` — python-pptx ile slayt üretimi (title + bullets)
- [x] `markdown_to_html` — markdown + codehilite + tables + toc; opsiyonel HTML wrapping
- [ ] `excel_read_advanced` — formül, multi-sheet (sonraki sprint)
- [ ] `web_scrape_structured` — beautifulsoup4 (sonraki sprint)

### D.5 Modern Bilgi Yönetimi *(sonraki sprint — API key gerektiriyor)*
- [ ] `notion_search` / `notion_page_create`
- [ ] `airtable_*`
- [ ] `google_sheets_read` / `google_sheets_write`

### D.6 ✅ DevOps & Bulut — TAMAMLANDI (Docker + kubectl)
- [x] `docker_ps` / `docker_logs` — [`backend/app/services/tools/devops_tools.py`](../backend/app/services/tools/devops_tools.py:1)
- [x] `docker_run` / `docker_build` — **HITL onayı zorunlu** (`requires_confirmation = True`)
- [x] `kubectl_get` / `kubectl_logs` — düşük risk
- [x] `kubectl_apply` — **HITL onayı zorunlu**
- [ ] `aws_s3_*` / `azure_blob_*` / `gcp_gcs_*` (sonraki sprint — credentials gerektiriyor)
- [ ] `terraform_plan` / `terraform_apply` (sonraki sprint)

### D.7 ✅ Güvenlik & Ağ — TAMAMLANDI
- [x] `ssl_cert_check` — [`backend/app/services/tools/security_tools.py`](../backend/app/services/tools/security_tools.py:1) (yerleşik ssl modülü)
- [x] `dns_lookup` — dnspython opsiyonel + socket.getaddrinfo fallback
- [x] `whois_query` — python-whois opsiyonel paket
- [x] `port_scan` — **HITL onayı zorunlu** (max 200 port, asyncio paralel)

---

## 3. Tool Yazma Standartı

Her yeni tool için:
1. [`backend/app/services/tools/base.py`](../backend/app/services/tools/base.py:1) — `BaseTool` extend et
2. `name`, `description`, `parameters` (JSON Schema), `permission` ("none"/"file"/"shell"/"high")
3. `async def execute(args, context) -> ToolResult`
4. Risk yüksekse `risk_level = "high"` → otomatik HITL onay
5. [`backend/tests/test_<tool>.py`](../backend/tests/) — happy path + edge case + error
6. README'ye tool listesine ekle

---

## 4. Test/Kabul Kriterleri

- [x] **19 yeni tool** registry'de görünür ve çağrılabilir (4 research + 4 doküman + 7 devops + 4 security)
- [x] Tüm yeni tool'lar için smoke + schema + parameter validation testi: [`backend/tests/test_sprint_d_tools.py`](../backend/tests/test_sprint_d_tools.py:1)
- [x] HITL gerektirenler `HIGH_RISK_TOOLS` setine eklendi: `docker_run`, `docker_build`, `kubectl_apply`, `port_scan`
- [x] Schema validation: tüm tool'lar `to_openai_schema()` ve `to_anthropic_schema()` döndürebiliyor
- [x] Boş/eksik input → `ToolResult.ok=False` + açıklayıcı `error` mesajı

---

## 6. Yeni Eklenen Dosyalar

| Dosya | İçerik |
|---|---|
| [`backend/app/services/tools/research_tools.py`](../backend/app/services/tools/research_tools.py:1) | 4 tool: ArxivSearch, WikipediaLookup, YoutubeSearch, YoutubeTranscript |
| [`backend/app/services/tools/document_extra_tools.py`](../backend/app/services/tools/document_extra_tools.py:1) | 4 tool: PDFMerge, PDFSplit, PPTXGenerate, MarkdownToHtml |
| [`backend/app/services/tools/security_tools.py`](../backend/app/services/tools/security_tools.py:1) | 4 tool: DNSLookup, WhoisQuery, SSLCertCheck, PortScan (HIGH RISK) |
| [`backend/app/services/tools/devops_tools.py`](../backend/app/services/tools/devops_tools.py:1) | 7 tool: DockerPs/Logs/Run/Build, KubectlGet/Logs/Apply (3 HIGH RISK) |
| [`backend/tests/test_sprint_d_tools.py`](../backend/tests/test_sprint_d_tools.py:1) | Smoke + schema + risk integration test'leri |

## 7. Güncellenen Dosyalar

- [`backend/app/services/tools/registry.py`](../backend/app/services/tools/registry.py:1) — 19 yeni tool registry kaydı
- [`backend/app/services/approval_service.py`](../backend/app/services/approval_service.py:1) — `HIGH_RISK_TOOLS` setine 4 yeni eklendi

---

## 8. Bağımlılık Notları

Yeni tool'ların opsiyonel paketleri:

| Tool | Paket | Davranış (paket yoksa) |
|---|---|---|
| `youtube_transcript` | `youtube-transcript-api` | `ToolResult(ok=False, error="...")` |
| `pdf_merge` / `pdf_split` | `pypdf` | Hata + paket yükleme önerisi |
| `pptx_generate` | `python-pptx` | Hata + paket yükleme önerisi |
| `markdown_to_html` | `markdown`, `pygments` | Hata + paket yükleme önerisi |
| `whois_query` | `python-whois` | Hata + paket yükleme önerisi |
| `dns_lookup` | `dnspython` (opsiyonel) | `socket.getaddrinfo` fallback'i |

`docker_*`, `kubectl_*` tool'ları sistem CLI'larına ihtiyaç duyar (Docker Desktop, kubectl).

---

## 5. Sonraki Adım

Sprint E: UX iyileştirme.