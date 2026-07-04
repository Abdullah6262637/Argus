# 03 — Ajan Oluşturma ve Yönetimi

## Ajan Nedir?

Her ajan, kendine özgü bir kimlik, rol, sistem promptu ve yeteneklere sahip bağımsız bir yapay zeka varlığıdır. Argus'ta aynı anda birden fazla ajan çalışabilir; her biri farklı bir LLM modeli ve sağlayıcı kullanabilir.

---

## Yeni Ajan Oluşturma

Sol paneldeki **"+ Yeni Ajan"** butonuna tıklayın veya `Ctrl+N` kısayolunu kullanın. 6 adımlı form açılır:

---

### Adım 1 — Temel Bilgiler

| Alan | Açıklama | Zorunlu |
|---|---|---|
| Ad | Ajanın görünen adı | ✅ |
| Rol | Kısa bir rol tanımı ("Senior Python Developer") | ✅ |
| Açıklama | Ajanın ne yaptığını anlatan kısa metin | — |
| Sistem Promptu | LLM'e gönderilen temel davranış talimatları | ✅ |
| Avatar | Emoji veya harf bazlı ikon | — |
| Renk | Kartın vurgu rengi | — |

**İyi bir sistem promptu şunları içermelidir:**
- Ajanın rolü ve uzmanlığı
- Tercih ettiği yaklaşım ve ton
- Sınırlar ve yapmaması gerekenler
- Çıktı formatı tercihi (Markdown, JSON, vb.)

**Örnek sistem promptu:**
```
Sen deneyimli bir Python geliştiricisisin. Kod yazarken PEP 8 standartlarına 
uyarsın, her fonksiyonu docstring ile belgelersin ve potansiyel hatalara karşı 
her zaman try/except bloğu kullanırsın. Yanıtlarını Markdown formatında ver.
```

---

### Adım 2 — LLM Yapılandırması

**Sağlayıcı Seçimi**

Mevcut sağlayıcılar:
- `openai` — GPT-4o, GPT-4o-mini, o1, o3, GPT-4 Turbo
- `anthropic` — Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- `gemini` — Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 1.5 Pro
- `openrouter` — 100+ model (OpenAI, Anthropic, Google, Meta, Mistral)
- `groq` — LLaMA 3.3, Mixtral, Gemma 2 (LPU hızlandırmalı)
- `deepseek` — DeepSeek-V3, DeepSeek-R1 (reasoning)
- `mistral` — Mistral Large, Mistral Medium, Codestral
- `xai` — Grok-4, Grok-2
- `local` — Ollama veya LM Studio (yerel model)

**API Anahtarı**

API anahtarını bu alana girebilir veya `.env` dosyasında saklayabilirsiniz:
- `.env`'deki anahtar varsa "**.env ile**" butonu görünür
- "**Bu key ile**" — forma girilen anahtarla test eder
- "**.env ile**" — `.env`'deki anahtarla test eder

**Bağlantı Testi**

"**Bağlantıyı Test Et**" butonuna basıldığında:
1. API anahtar format kontrolü (OpenAI `sk-`, Anthropic `sk-ant-`)
2. Güvenli HTTP istemcisi oluşturulur
3. Seçili modele `max_tokens: 32` ile test isteği gönderilir
4. Yanıt süresi (ms) ve örnek yanıt gösterilir

**SSL Sertifikası Doğrulama:** Kurumsal proxy veya self-signed sertifika kullanan ortamlarda bu seçeneği kapatabilirsiniz.

**Sıcaklık (Temperature)**

| Değer | Kullanım Alanı |
|---|---|
| 0.0 — 0.3 | Tutarlı, belirleyici yanıtlar (kod, SQL, analiz) |
| 0.4 — 0.7 | Dengeli yaratıcılık (çoğu görev) |
| 0.8 — 1.0 | Yüksek yaratıcılık (yaratıcı yazarlık, beyin fırtınası) |

---

### Adım 3 — Medya Yetenekleri

Ajanın görüntü, video ve ses işleyip işleyemeyeceğini yapılandırın:

- **Görüntü**: Ekran görüntüsü analizi, diagram okuma
- **Video**: Video içerik anlama (destekleyen modeller)
- **Ses**: Ses transkripsiyonu ve analizi

---

### Adım 4 — Davranış

- **Maksimum token**: Yanıt başına maksimum token sayısı
- **Geçmiş mesaj limiti**: Sohbet geçmişinden kaç mesaj gönderilsin
- **Planlama**: Çok adımlı görevlerde plan yapıp yapmayacağı
- **Yansıma**: Plan yürütüldükten sonra kendi çıktısını değerlendirip değerlendirmeceği

---

### Adım 5 — Yetkiler (İzinler)

Her ajan gruba ayrılmış izinlere sahiptir:

| İzin Grubu | İçerdiği Araçlar |
|---|---|
| `web_search` | web_search, open_url |
| `file_read` | read_file, list_dir, search_files |
| `file_write` | write_file, append_file, copy_file, move_file, delete_file |
| `code_execution` | python_eval, run_command, sandbox_execute |
| `system_commands` | system_info, open_app, shutdown |
| `ui_automation` | screenshot, click, type_text, key_press |
| `network_access` | http_request, download_file, ping_host |
| `memory_read` | recall_memory, list_memory, vector_search |
| `memory_write` | save_memory, delete_memory, vector_upsert |
| `browser_control` | browser_navigate, browser_click, browser_screenshot |

---

### Adım 6 — Plugins ve MCP

- Aktif plugin'leri seçin (yüklü plugin'ler listelenir)
- MCP (Model Context Protocol) sunucularına bağlantı ekleyin
- Her MCP sunucusu ek araçlar sağlar

---

## Ajan Şablonları

Kurulum sihirbazında veya ajan listesinde hazır şablonlardan hızlıca ajan oluşturabilirsiniz:

| Şablon | Provider | Model | Özellik |
|---|---|---|---|
| 🧑‍💻 Geliştirici | OpenAI | gpt-4o-mini | Kod, refaktör, debug |
| 🔍 Araştırmacı | OpenAI | gpt-4o-mini | Web araştırması |
| ✍️ Yazar | OpenAI | gpt-4o-mini | Uzun form içerik |
| 📢 Sosyal Medya | OpenAI | gpt-4o-mini | Kısa içerik |
| 🔧 DevOps | OpenAI | gpt-4o-mini | CI/CD, Docker |
| 📊 Veri Analisti | OpenAI | gpt-4o-mini | SQL, pandas |
| 📋 Proje Yöneticisi | OpenAI | gpt-4o-mini | Görev planı |
| 🎧 Müşteri Desteği | OpenAI | gpt-4o-mini | Empatik yanıt |
| 👁️ Kod Reviewer | OpenAI | gpt-4o-mini | PR incelemesi |
| 🌍 Çevirmen | OpenAI | gpt-4o-mini | Çeviri |
| 📣 Pazarlama | OpenAI | gpt-4o-mini | Kampanya metni |
| 🎓 Eğitmen | OpenAI | gpt-4o-mini | Öğretim |

---

## Ajan Listesi İşlemleri

Ajan listesinde her ajana sağ tıklayarak:

- **Düzenle** — Formu düzenleme modunda aç
- **Sil** — Onay sonrası sil
- **Kopyala** — Ajanı klonla
- **Dışa Aktar** — JSON formatında indir
- **Bağlantıyı Test Et** — LLM bağlantısını hızlı test et
- **Aktif/Pasif** — Ajanı devre dışı bırak (sohbet listesinden gizler)
- **Yeni Sohbet** — Bu ajan ile temiz sohbet başlat

---

## Toplu Sağlayıcı Güncelleme

Tüm ajanların LLM sağlayıcısını aynı anda değiştirmek için:

```
Ayarlar → Ajanlar → Toplu Sağlayıcı Güncelleme
```

Örnek API çağrısı:
```bash
curl -X POST http://localhost:8000/api/agents/bulk-update-provider \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "base_url": null, "agent_ids": [], "skip_ids": []}'
```

---

## JSON İçe/Dışa Aktarma

**Dışa Aktarma:**
- Ajan listesinde sağ tık → "Dışa Aktar"
- Veya `Ctrl+Shift+E` kısayolu

**İçe Aktarma:**
```bash
curl -X POST http://localhost:8000/api/agents \
  -H "Content-Type: application/json" \
  -d @agent_backup.json
```
