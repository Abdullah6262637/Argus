# 🎨 Sprint E — UX İyileştirme

> **Hedef:** Kullanıcı deneyimini "iyi → mükemmel" seviyesine çıkarmak.
> **Öncelik:** ORTA
> **Tahmini süre:** 1-2 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:271) — Bölüm 5.2/G.

---

## 1. Özet

Mevcut UI fonksiyonel ama "smooth" değil. Bu sprint sonunda:
- Şablondan ajan oluşturma (12 hazır template)
- Workflow drag-drop editör
- Multi-conversation tab desteği
- Konuşma export/search/reactions
- Tool izin matrisi UI
- Custom tema renkleri

---

## 2. İş Listesi

### E.1 ✅ Soul template galerisi — TAMAMLANDI (Sprint A.11.3 ile)
- [x] Backend: `GET /api/agents/souls` — `souls/*.md` listesi (name, preview, size, is_system)
- [x] Backend: `GET /agents/souls/{name}` — tam içerik
- [x] Backend: `POST /agents/souls` — yeni soul oluştur
- [x] AgentForm "Davranış" adımında soul dropdown + "yeni soul kaydet" modalı

### E.2 Workflow editor (drag-drop) *(sonraki sprint — büyük lib gerektiriyor)*
- [ ] react-flow / rete.js
- [ ] Node tipleri, bağlantılar, save/load
- *Not:* Sprint A.9'da YAML metin editörü mevcut, drag-drop sonraya bırakıldı

### E.3 Soul.md WYSIWYG editor *(sonraki sprint)*
- [ ] @uiw/react-md-editor veya benzeri
- *Not:* Şu an inline textarea + soul dropdown ile fonksiyonel akış mevcut

### E.4 ✅ Tool izin matrisi UI — TAMAMLANDI (Sprint A.10 + A.11.2 ile)
- [x] AgentForm'da 4 kategori bloğu (file_system / terminal_cmd / web_search / system_admin)
- [x] Her tool için chip + `title` ile tooltip
- [x] 5 hazır preset (Salt-okunur / Araştırmacı / Yazar / Geliştirici / Tam yetkili) + Özel modu

### E.5 ✅ Konuşma yönetimi — TAMAMLANDI (export + reaction)
- [x] **Konuşma export**: [`backend/app/routers/chat.py`](../backend/app/routers/chat.py:1) `GET /chat/{id}/export?format=md|json` — PlainTextResponse / JSON
- [x] [`frontend/src/api/client.ts`](../frontend/src/api/client.ts:1) `exportConversationUrl()` helper
- [x] **Mesaj reaksiyon**: [`backend/app/models/feedback.py`](../backend/app/models/feedback.py:1) `MessageFeedback(message_id, rating, comment)` modeli + `POST /chat/messages/{id}/feedback` endpoint
- [x] [`frontend/src/api/client.ts`](../frontend/src/api/client.ts:1) `rateMessage()` helper
- [ ] Multi-tab + sidebar + in-conversation search *(sonraki sprint)*

### E.6 ✅ Tema & görünüm — TAMAMLANDI
- [x] [`frontend/src/hooks/useAppearance.ts`](../frontend/src/hooks/useAppearance.ts:1) — `density` (compact/cozy/comfortable) + `fontSize` (sm/md/lg) hook'u
- [x] [`frontend/src/index.css`](../frontend/src/index.css:1) — `[data-density]` ve `[data-font-size]` CSS değişkenleri (runtime swap)
- [x] [`frontend/src/components/SettingsModal.tsx`](../frontend/src/components/SettingsModal.tsx:1) — Tema sekmesinde 2 yeni bölüm: yazı boyutu (3 buton) + UI yoğunluğu (3 buton)
- [x] localStorage persistence
- [ ] Custom accent renk picker *(sonraki sprint)*

### E.7 ✅ Klavye kısayolları — TAMAMLANDI
- [x] [`frontend/src/components/CommandPalette.tsx`](../frontend/src/components/CommandPalette.tsx:1) — fuzzy search + grup başlık + ↑↓ navigasyon + ESC + Türkçe karakter normalize
- [x] **Ctrl+K** → komut paleti aç/kapat
- [x] **Ctrl+N** → yeni sohbet
- [x] **Ctrl+,** → ayarlar
- [x] [`frontend/src/components/Header.tsx`](../frontend/src/components/Header.tsx:1) — Ctrl+K kısayol butonu
- [x] Komutlar: yeni ajan, yeni sohbet, ajan değiştir (her ajan), ayarlar, workflow, ajanları yenile

### E.8 Bildirimler *(sonraki sprint — Electron native API)*
- [ ] Sistem tray notification
- [ ] Plan tamamlandığında bip + flash
- *Not:* WebSocket üzerinden plan_completed event mevcut; UI'da banner yapılabilir

---

## 3. Test/Kabul Kriterleri (Implementasyon Sonrası)

- [x] Şablondan ajan oluşturma: AgentForm'da soul dropdown ile 12 sistem soul'u prefill
- [x] Konuşma export: `/api/chat/{id}/export?format=md|json` çalışıyor
- [x] Tema modalı: yazı boyutu + density seçimi anlık uygulanıyor
- [x] Tüm modallar Esc ile kapanır
- [x] Klavye kısayolları çalışır (Ctrl+K, Ctrl+N, Ctrl+,)
- [x] Komut paleti fuzzy search Türkçe karakter desteğiyle çalışıyor
- [ ] Multi-tab + bildirim sistemi (sonraki sprint)

---

## 5. Yeni Eklenen / Değişen Dosyalar

| Dosya | Değişim |
|---|---|
| [`backend/app/models/feedback.py`](../backend/app/models/feedback.py:1) | **Yeni** — MessageFeedback modeli |
| [`backend/app/models/__init__.py`](../backend/app/models/__init__.py:1) | MessageFeedback / FeedbackRating export |
| [`backend/app/routers/chat.py`](../backend/app/routers/chat.py:1) | `GET /export` + `POST /messages/{id}/feedback` |
| [`frontend/src/hooks/useAppearance.ts`](../frontend/src/hooks/useAppearance.ts:1) | **Yeni** — density + fontSize hook'u |
| [`frontend/src/components/CommandPalette.tsx`](../frontend/src/components/CommandPalette.tsx:1) | **Yeni** — Ctrl+K komut paleti |
| [`frontend/src/index.css`](../frontend/src/index.css:1) | density + font-size CSS değişkenleri |
| [`frontend/src/components/SettingsModal.tsx`](../frontend/src/components/SettingsModal.tsx:1) | Tema sekmesinde 2 yeni bölüm |
| [`frontend/src/components/Header.tsx`](../frontend/src/components/Header.tsx:1) | Ctrl+K butonu |
| [`frontend/src/App.tsx`](../frontend/src/App.tsx:1) | CommandPalette + global hotkey listener + useAppearance bağı |
| [`frontend/src/api/client.ts`](../frontend/src/api/client.ts:1) | `exportConversationUrl`, `rateMessage` |

---

## 4. Sonraki Adım

Sprint F: Koordinatör & Skill Learning.