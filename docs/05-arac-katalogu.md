# 05 — Araç Kataloğu (Tool Catalog)

## Araçlar Nasıl Çalışır?

Her araç (`BaseTool` sınıfından türetilen) LLM tarafından çağrılabilir bir fonksiyondur. Bir ajan görev yaparken LLM, araç listesinden ihtiyacına uygun aracı seçer, parametrelerle çağırır ve çıktıyı gözlemler.

**Araç çağrısı akışı:**
```
LLM → "web_search aracını çağır, query='Python async tutorial'"
         ↓
ToolRegistry.call("web_search", {"query": "Python async tutorial"})
         ↓
WebSearchTool.run(ctx, query="Python async tutorial")
         ↓
[{'title': '...', 'url': '...', 'snippet': '...'}, ...]
         ↓
LLM gözlemler → Bir sonraki adıma geçer
```

**İzin filtresi:** Her araç bir `PermissionKey` gerektirir. Ajan bu izne sahip değilse araç listelenmez bile.

---

## Araç Kategorileri

### 📁 Dosya Sistemi

| Araç | İzin | Açıklama |
|---|---|---|
| `read_file` | `file_read` | Dosya içeriğini okur |
| `write_file` | `file_write` | Dosyayı yazar/üzerine yazar |
| `append_file` | `file_write` | Dosyaya ekler |
| `list_dir` | `file_read` | Dizin içeriğini listeler |
| `copy_file` | `file_write` | Dosyayı kopyalar |
| `move_file` | `file_write` | Dosyayı taşır/yeniden adlandırır |
| `delete_file` | `file_write` | Dosyayı siler |
| `mkdir` | `file_write` | Klasör oluşturur |
| `search_files` | `file_read` | Dosya adı/içerik araması |
| `zip_files` | `file_write` | Dosyaları sıkıştırır |
| `unzip` | `file_write` | Arşivi açar |

---

### 🌐 Web ve Tarayıcı

| Araç | İzin | Açıklama |
|---|---|---|
| `web_search` | `web_search` | DuckDuckGo ile web araması |
| `open_url` | `web_search` | URL'yi sistem tarayıcısında açar |
| `read_webpage` | `network_access` | Sayfa HTML'ini metin olarak çeker |
| `read_webpage_markdown` | `network_access` | Sayfayı Markdown'a dönüştürür |
| `browser_navigate` | `browser_control` | Playwright ile URL'ye gider |
| `browser_click` | `browser_control` | CSS selector ile elemente tıklar |
| `browser_fill` | `browser_control` | Form alanını doldurur |
| `browser_get_text` | `browser_control` | Sayfa metnini alır |
| `browser_screenshot` | `browser_control` | Sayfanın ekran görüntüsünü alır |
| `generate_pdf_from_webpage` | `browser_control` | Web sayfasını PDF'e dönüştürür |
| `interactive_browser_click` | `browser_control` | Etkileşimli tıklama |
| `interactive_browser_type` | `browser_control` | Etkileşimli metin yazma |
| `interactive_browser_scroll` | `browser_control` | Sayfa kaydırma |

---

### 💻 Sistem ve İşlem

| Araç | İzin | Açıklama |
|---|---|---|
| `run_command` | `system_commands` | Allowlist'teki terminal komutları |
| `system_info` | `system_commands` | CPU, RAM, disk bilgisi |
| `list_processes` | `system_commands` | Çalışan işlem listesi |
| `kill_process` | `system_commands` | PID ile işlem sonlandırır |
| `open_app` | `system_commands` | Uygulama başlatır |
| `get_datetime` | — | Tarih ve saat |
| `shutdown` | `system_commands` | Sistemi kapatır |
| `lock_screen` | `system_commands` | Ekranı kilitler |
| `cancel_shutdown` | `system_commands` | Zamanlanmış kapanmayı iptal eder |
| `set_volume` | `system_commands` | Ses seviyesi ayarlar |

---

### 🖱️ UI Otomasyonu

| Araç | İzin | Açıklama |
|---|---|---|
| `screenshot` | `ui_automation` | Masaüstü ekran görüntüsü |
| `click` | `ui_automation` | X,Y koordinatına tıklar |
| `type_text` | `ui_automation` | Klavyeden metin gönderir |
| `key_press` | `ui_automation` | Özel tuş gönderir (Enter, F5, vb.) |
| `mouse_move` | `ui_automation` | Fareyi taşır |
| `list_windows` | `ui_automation` | Açık pencereleri listeler |
| `focus_window` | `ui_automation` | Pencereyi öne getirir |
| `minimize_window` | `ui_automation` | Pencereyi küçültür |
| `maximize_window` | `ui_automation` | Pencereyi büyütür |
| `close_window` | `ui_automation` | Pencereyi kapatır |
| `clipboard_get` | `ui_automation` | Pano içeriğini okur |
| `clipboard_set` | `ui_automation` | Panoya metin kopyalar |

---

### 🧬 AI ve ML

| Araç | Açıklama |
|---|---|
| `sentiment_analysis` | Metin duygusal analizi (pozitif/negatif/nötr) |
| `text_summarization` | Uzun metni özetler |
| `text_classification` | Metni kategorilere ayırır |
| `paraphrase_text` | Metni farklı kelimelerle yeniden yazar |
| `code_generation` | Spesifikasyondan kod üretir |
| `code_explanation` | Kodu Türkçe/İngilizce açıklar |
| `bug_detection` | Kodda hata tespit eder |
| `test_generation` | Kod için test senaryoları üretir |
| `documentation_generate` | Kod dokümantasyonu oluşturur |
| `sql_query_generate` | Doğal dilden SQL üretir |
| `regex_generate` | Doğal dilden regex üretir |
| `prompt_optimize` | LLM promptlarını iyileştirir |
| `question_answering` | Bağlam içinden soru yanıtlar |
| `data_validation_rules` | Veri doğrulama kuralları üretir |
| `huggingface_inference` | HuggingFace model çalıştırır |
| `openai_embedding` | Embedding vektörü üretir |
| `openai_moderation` | İçerik güvenlik kontrolü |

---

### 📊 Veri Bilimi

| Araç | Açıklama |
|---|---|
| `pandas_read_csv` | CSV dosyası okur, DataFrame bilgisi verir |
| `pandas_describe` | İstatistiksel özet (mean, std, quartiles) |
| `matplotlib_line_chart` | Çizgi grafik oluşturur |
| `matplotlib_bar_chart` | Çubuk grafik oluşturur |
| `matplotlib_scatter_plot` | Dağılım grafiği oluşturur |
| `linear_regression` | Doğrusal regresyon analizi |
| `kmeans_clustering` | K-means kümeleme |
| `correlation_analysis` | Korelasyon matrisi |
| `time_series_forecast` | Zaman serisi tahmini |

---

### 🔧 Git

| Araç | Açıklama |
|---|---|
| `git_init` | Yeni repository başlatır |
| `git_clone` | Repository klonlar |
| `git_status` | Değişen dosyaları gösterir |
| `git_diff` | Fark gösterir |
| `git_commit` | Değişiklikleri commit eder |
| `git_push` | Remote'a iter |
| `git_pull` | Remote'dan çeker |
| `git_log` | Commit geçmişi |
| `git_branch_list` | Dalları listeler |
| `git_branch_switch` | Dal değiştirir |

---

### 🐳 DevOps

| Araç | Açıklama |
|---|---|
| `docker_run` | Container başlatır |
| `docker_build` | Image oluşturur |
| `docker_ps` | Çalışan containerları listeler |
| `docker_logs` | Container loglarını okur |
| `kubectl_get` | Kubernetes resource listeler |
| `kubectl_apply` | YAML manifest uygular |
| `kubectl_logs` | Pod loglarını okur |

---

### 📧 İletişim

| Araç | Açıklama |
|---|---|
| `email_send` | SMTP ile e-posta gönderir |
| `email_read_inbox` | IMAP ile gelen kutusu okur |
| `telegram_send` | Telegram Bot API ile mesaj |
| `slack_send` | Slack Webhook ile mesaj |
| `discord_send` | Discord Webhook ile mesaj |

---

### 📄 Belge İşleme

| Araç | Açıklama |
|---|---|
| `read_document` | Word/PDF/metin dosyası okur |
| `pdf_generate` | HTML veya metinden PDF oluşturur |
| `xlsx_write` | Excel dosyası oluşturur |
| `pptx_generate` | PowerPoint sunumu oluşturur |
| `pdf_merge` | Birden fazla PDF birleştirir |
| `pdf_split` | PDF'i sayfa aralığına göre böler |
| `markdown_to_html` | Markdown'ı HTML'e çevirir |
| `parse_layout_document` | Belgenin sayfa düzenini çıkarır |

---

### 🧠 Bellek (Memory)

| Araç | İzin | Açıklama |
|---|---|---|
| `save_memory` | `memory_write` | Vektör belleğine kaydeder |
| `recall_memory` | `memory_read` | Anlam bazlı arama yapar |
| `list_memory` | `memory_read` | Tüm anıları listeler |
| `delete_memory` | `memory_write` | Anıyı siler |
| `vector_upsert` | `memory_write` | Vektör DB'ye ekler/günceller |
| `vector_search` | `memory_read` | Vektör benzerlik araması |
| `ingest_document` | `memory_write` | Belgeyi vektörize eder |
| `kg_add_entity` | `memory_write` | Bilgi grafiğine düğüm ekler |
| `kg_add_relation` | `memory_write` | KG'ya ilişki ekler |
| `kg_search` | `memory_read` | KG'da metin araması |
| `kg_query_neighbors` | `memory_read` | KG'da komşu düğümler |

---

### ☁️ Bulut Servisleri

| Araç | Açıklama |
|---|---|
| `aws_s3_list` | AWS S3 bucket içeriği |
| `aws_s3_upload` | S3'e dosya yükler |
| `aws_ec2_list` | EC2 instance listesi |
| `azure_blob_list` | Azure Blob Storage listesi |
| `gcp_storage_list` | Google Cloud Storage listesi |

---

### 🔐 Güvenlik ve Ağ

| Araç | İzin | Açıklama |
|---|---|---|
| `http_request` | `network_access` | HTTP/HTTPS GET/POST istekleri |
| `download_file` | `network_access` | Dosya indirir |
| `ping_host` | `network_access` | Sunucu erişilebilirlik testi |
| `port_scan` | `network_access` | Port tarama |
| `ssl_cert_check` | `network_access` | SSL sertifika geçerliliği |
| `dns_lookup` | `network_access` | DNS çözümleme |
| `whois_query` | `network_access` | Domain kayıt bilgisi |

---

### 🔬 Araştırma

| Araç | Açıklama |
|---|---|
| `arxiv_search` | Akademik makale araması |
| `wikipedia_lookup` | Wikipedia içeriği |
| `youtube_search` | YouTube video araması |
| `youtube_transcript` | Video altyazı/transkript |

---

### 🧪 Test ve QA

| Araç | Açıklama |
|---|---|
| `unit_test_generate` | Birim test kodu üretir |
| `unit_test_run` | Birim testleri çalıştırır |
| `integration_test` | Entegrasyon testi yapar |
| `api_test_generate` | API test senaryosu üretir |
| `api_test_run` | API testlerini çalıştırır |
| `ui_test_record` | UI etkileşimlerini kaydeder |
| `ui_test_playback` | Kaydedilen testi oynatır |
| `performance_test` | Yük ve performans testi |

---

### 🤖 Ajan Koordinasyonu

| Araç | Açıklama |
|---|---|
| `delegate_to_agent` | Başka bir ajana görev devreder |
| `agent_wait_for_approval` | Kullanıcıdan onay bekler |
| `blackboard_set` | Ajanlar arası paylaşılan veri yazar |
| `blackboard_get` | Paylaşılan veriyi okur |
| `agent_ask_user_question` | Kullanıcıya soru sorar |
| `agent_sleep` | Belirli süre bekler |

---

### ⚙️ Yardımcı Araçlar

| Araç | Açıklama |
|---|---|
| `python_eval` | Python kodu değerlendirir |
| `evaluate_math` | Matematiksel ifade hesaplar |
| `regex_match` | Regex eşleşme testi |
| `sandbox_execute_python` | İzole Python çalıştırır |
| `sandbox_execute_js` | İzole JavaScript çalıştırır |
| `sandbox_install_package` | Sandbox'a paket yükler |
| `docker_sandbox_run` | Docker'da izole çalıştırır |
| `uuid_generator` | UUID üretir |
| `hash_generator` | MD5/SHA hash üretir |
| `base64` | Base64 encode/decode |
| `text_stats` | Kelime/karakter sayısı |
| `weather` | Hava durumu |
| `get_ip_address` | Genel IP adresi |
| `generic_api_request` | Genel API isteği |
| `github_api` | GitHub REST API çağrısı |
| `install_dependency` | Proje bağımlılıkları yükler |
| `image_generate` | AI ile görüntü üretir |
| `image_ocr_read` | Görüntüden metin çıkarır |
| `text_to_speech` | Metni sese dönüştürür |
| `speech_to_text_file` | Ses dosyasını metne çevirir |
| `play_beep` | Sistem sesi çalar |
| `show_notification` | Masaüstü bildirimi gösterir |

---

## Yeni Araç Yazma

→ Detaylar için [12-gelistirici-rehberi.md](12-gelistirici-rehberi.md)
