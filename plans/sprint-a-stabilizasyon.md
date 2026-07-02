# 🛠️ Sprint A — Stabilizasyon

> **Hedef:** Mevcut özelliklerin "ilk açılışta hemen çalışan, güvenli ve UX'i pürüzsüz" hale gelmesi.
> **Öncelik:** EN YÜKSEK
> **Tahmini süre:** 3-5 gün
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:312) — Sprint A maddeleri.

---

## 1. Özet

İlk kullanıcı deneyimini ve güvenliği iyileştiren küçük ama kritik düzeltmeler. Tek satır kod yazmadan önce kullanıcının "hazır 12 ajan + güvenli key + kolay erişim" görmesi hedeflenir.

---

## 2. İş Listesi

### A.1 ✅ agents.yaml zenginleştirme — TAMAMLANDI
- 12 hazır şablon ajan eklendi (developer, researcher, writer, social_media, devops, data_analyst, project_manager, customer_support, code_reviewer, translator, marketing, tutor)
- Mevcut "SA" varsayılan ajan korundu
- Plain-text API key kaldırıldı; backend ilk yüklemede otomatik şifrelemeye çevirir

### A.2 ✅ API key encryption — TAMAMLANDI
- [`backend/app/services/agent_manager.py`](../backend/app/services/agent_manager.py:1) `secret_store.encrypt/decrypt` entegrasyonu yapıldı
- `to_yaml_dict()` ve `MediaCapability.to_yaml()` artık plaintext key'i Fernet ile şifreliyor
- `load()` metodu yaml'ı okurken decrypt; aynı anda plain-text varsa otomatik resave (auto-encrypt)

### A.3 ✅ Header'a Workflow butonu — TAMAMLANDI
- [`frontend/src/components/Header.tsx`](../frontend/src/components/Header.tsx:1) yeni `onOpenWorkflows` prop'u
- [`frontend/src/App.tsx`](../frontend/src/App.tsx:1) `WorkflowsModal` global mount edildi

### A.4 ✅ AgentInspector tab doğrulandı
- [`frontend/src/components/SystemPanel.tsx:53`](../frontend/src/components/SystemPanel.tsx:53) — 'tasks' | 'logs' | 'inspector' üçü de mevcut
- Seçili ajanın detayları sağ panelde gösteriliyor

### A.5 ✅ VoiceButton ChatWindow entegrasyonu doğrulandı
- [`frontend/src/components/ChatWindow.tsx:293`](../frontend/src/components/ChatWindow.tsx:293) — VoiceButton input alanında

### A.6 ✅ MCP servers.yaml örnek konfigürasyonu doğrulandı
- [`backend/agents/mcp_servers.yaml`](../backend/agents/mcp_servers.yaml:1) — filesystem, github, sqlite, brave-search örnekleri (enabled:false)

---

## 3. Tamamlanan Maddeler

### A.7 ✅ Onboarding sihirbazı zenginleştirme — TAMAMLANDI
- Backend: [`backend/app/routers/system.py`](../backend/app/routers/system.py:1) `GET/POST /api/system/env` endpoint'leri eklendi (whitelist: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_BASE_URL`, `ANTHROPIC_BASE_URL`; secret'lar maskeli döner).
- Frontend: [`frontend/src/components/Onboarding.tsx`](../frontend/src/components/Onboarding.tsx:1) içine **Anahtar** slaytı entegre edildi — kullanıcı OpenAI/Anthropic API key + base URL'i UI'dan girip "Kaydet" diyebiliyor; mevcut anahtarlar maskelenmiş gösteriliyor.
- Yeni **Sablonlar** slaytı: 12 hazır şablon ajanı kart olarak listeler, kullanıcı tıklayarak hangilerinin aktif kalacağını seçer; "Tümünü seç / kaldır" kısayolları mevcut. Bitirirken seçilmeyen şablonlar `is_active: false` olarak güncellenir.

### A.8 ✅ Settings modal'ında API key yönetimi — TAMAMLANDI
- [`frontend/src/components/SettingsModal.tsx`](../frontend/src/components/SettingsModal.tsx:1) içine yeni **API Anahtarları** sekmesi eklendi.
- Anahtarlar maskeli görünüyor (örn. `sk-a***-xyz`), her satırda **göster/gizle** ve **sil** butonu var.
- Provider/Model seçip **Test Et** butonu ile mevcut .env anahtarıyla gerçek istek atılarak doğrulanıyor (latency + örnek response gösterimi).
- Yeni endpoint'ler: [`api.getEnv()`](../frontend/src/api/client.ts:154) ve [`api.updateEnv()`](../frontend/src/api/client.ts:160).

### A.9 ✅ Workflow editor — TAMAMLANDI
- Backend: [`backend/app/routers/workflows.py`](../backend/app/routers/workflows.py:1) CRUD endpoint'leri eklendi:
  - `GET /api/workflows/{name}/raw` — YAML kaynağı döner.
  - `PUT /api/workflows/{name}` — YAML doğrulayıp dosyaya yazar (overwrite flag).
  - `DELETE /api/workflows/{name}` — Workflow dosyasını siler.
  - Ad whitelist: `[a-zA-Z0-9_\-]+`, en az bir `steps` listesi zorunlu.
- Frontend: [`frontend/src/components/WorkflowsModal.tsx`](../frontend/src/components/WorkflowsModal.tsx:1) iki sekmeye bölündü — **Çalıştır** ve **Editor**.
  - Editor'de YAML textarea, `{{ inputs.x }}` / `{{ steps.id.result }}` ipucu, hazır şablon, listeden düzenleme & silme.
  - Çalıştır sekmesinde her workflow için inline **düzenle / sil** ikonları.

### A.10 ✅ Tool izin matrisi UI — TAMAMLANDI
- [`frontend/src/components/AgentForm.tsx`](../frontend/src/components/AgentForm.tsx:1) **Yetkiler** adımı yenilendi.
- 4 kategori (`file_system` / `terminal_cmd` / `web_search` / `system_admin`) tek tek aç/kapat, her birinin altında o kategoriye ait gerçek tool isimlerinden örnek chip'ler ve `title` ile tooltip.
- "Tümünü aç / kapat" kısayolu, "+N daha" expand butonu, kategori sayacı eklendi.

---

## 4. Test/Kabul Kriterleri

- [x] Yeni kurulum: `agents.yaml` ilk yüklemede 13 ajan listeler (1 SA + 12 template)
- [x] API key plaintext kaydedilirse 1 sn içinde Fernet ile şifrelenir
- [x] Header'da "⚡ Workflow" butonu görünür ve modal'ı açar
- [x] SystemPanel "Inspector" sekmesi seçili ajanı gösterir
- [x] ChatWindow input'unda mikrofon butonu çalışır
- [x] Onboarding'de OpenAI/Anthropic API key UI'dan kaydedilebiliyor
- [x] Onboarding'de 12 şablonun aktif/pasif seçimi yapılabiliyor
- [x] Ayarlar → API Anahtarları sekmesinde key güncelleme + test çalışıyor
- [x] WorkflowsModal Editor sekmesinde yeni YAML workflow oluşturulup kaydedilebiliyor
- [x] AgentForm Yetkiler adımında tool listeleri tooltip ile görünüyor

---

## 5. Sonraki Adım

Sprint B: Test & CI altyapısı.