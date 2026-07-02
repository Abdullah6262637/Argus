# 📚 Sprint G — Dokümantasyon & Demo

> **Hedef:** Yeni gelen birinin 10 dakikada projeyi anlayıp ilk ajanı çalıştırması.
> **Öncelik:** ORTA
> **Tahmini süre:** 1 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:351) — Sprint G maddeleri.

---

## 1. Özet

Mevcut README v1 dönemini anlatıyor. v3 özellikleri (plan-driven, HITL, MCP, workflow, memory) doküman'a yansıtılmamış. Bu sprint sonunda:
- README v3
- docs/user-guide.md genişletilmiş
- docs/dev-guide.md genişletilmiş
- docs/tool-yazma.md, docs/provider-ekleme.md, docs/soul-yazma.md (yeni)
- 3 demo video / GIF
- API reference (OpenAPI'den otomatik)

---

## 2. İş Listesi

### G.1 README v3
- [ ] [`README.md`](../README.md) tamamen yeniden yaz:
  - Hero banner + ekran görüntüsü
  - "What is UmtalAgent?" 3 cümle
  - Özellikler matrix: ChatGPT vs Claude vs UmtalAgent
  - Quickstart: `npm install && npm run dev` (5 satır)
  - Mimari diyagramı (mermaid)
  - Demo GIF / video link
  - Contributing + License

### G.2 User Guide genişlet
- [ ] [`docs/user-guide.md`](../docs/user-guide.md):
  - Kurulum (Windows/Mac/Linux)
  - İlk açılış (onboarding)
  - Ajan oluşturma (şablon vs. sıfırdan)
  - Sohbet ve plan-driven mod
  - HITL onay sistemi
  - Workflow çalıştırma
  - Memory ve knowledge graph
  - MCP server bağlama
  - Voice (STT/TTS)
  - Ses & ekran kayıtları
  - Sorun giderme

### G.3 Developer Guide genişlet
- [ ] [`docs/dev-guide.md`](../docs/dev-guide.md):
  - Geliştirme ortamı kurulumu
  - Mimari overview (backend/frontend)
  - Yeni feature ekleme akışı
  - Test çalıştırma
  - Debug (VSCode launch.json örnekleri)
  - Database migration (Alembic)
  - WebSocket event protokolü
  - SSE event protokolü
  - Plan/Reflect lifecycle

### G.4 Yeni kılavuzlar
- [ ] [`docs/tool-yazma.md`](../docs/tool-yazma.md) — örnek `weather_tool` adım-adım
- [ ] [`docs/provider-ekleme.md`](../docs/provider-ekleme.md) — yeni LLM provider entegrasyonu
- [ ] [`docs/soul-yazma.md`](../docs/soul-yazma.md) — etkili soul prompt şablonu
- [ ] [`docs/workflow-tasarimi.md`](../docs/workflow-tasarimi.md) — YAML pipeline best practices
- [ ] [`docs/mcp-entegrasyon.md`](../docs/mcp-entegrasyon.md) — popüler MCP server'ları kurma
- [ ] [`docs/security.md`](../docs/security.md) — HITL, audit, sandbox, secrets

### G.5 Demo materyali
- [ ] Video 1: "30 saniyede ilk ajan" — onboarding'den sohbete
- [ ] Video 2: "Plan-driven mod" — kompleks görev + plan oluşturma + tool zincirini gösterme
- [ ] Video 3: "Workflow ile haber özeti otomasyonu" — daily_news workflow live çalıştırma
- [ ] GIF: HITL onay diyaloğu
- [ ] GIF: Knowledge graph görseli

### G.6 API Reference
- [ ] FastAPI Swagger UI'ı `docs/api/` altına export
- [ ] [`docs/api-reference.md`](../docs/api-reference.md) — endpoint listesi + örnek isteğe-cevap

### G.7 Architecture Decision Records (ADR)
- [ ] [`docs/adr/`](../docs/adr/) klasörü
- [ ] ADR-001: Neden FastAPI + Electron?
- [ ] ADR-002: Neden ChromaDB + NetworkX?
- [ ] ADR-003: Plan-driven mod ile ReAct karşılaştırması
- [ ] ADR-004: HMAC audit chain neden HMAC-SHA256?

---

## 3. Test/Kabul Kriterleri

- [ ] Yeni geliştirici 10 dakikada `npm run dev` ile çalıştırır
- [ ] Yeni kullanıcı 5 dakikada ilk ajanı oluşturur ve mesaj gönderir
- [ ] Tool yazma kılavuzunu takiben 30 dakikada yeni tool eklenebilir
- [ ] README'de tüm özellikler güncel ve link'ler çalışır

---

## 4. Sonuç

Bu sprint sonunda UmtalAgent kamuya açık alpha/beta yayınlanmaya hazır. Topluluk katılımı için tüm engeller kalkmış olur.