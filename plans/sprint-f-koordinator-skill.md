# 🤖 Sprint F — Koordinatör & Skill Learning

> **Hedef:** Multi-agent orkestrasyonu otomatikleştir; başarılı pattern'leri "skill" olarak kalıcı hale getir.
> **Öncelik:** ORTA-YÜKSEK
> **Tahmini süre:** 2 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:262) — Bölüm 5.2/F.

---

## 1. Özet

Şu an `delegate_to_agent` ile manuel delegasyon var ama otomatik yönlendirme yok. Bu sprint sonunda:
- **Coordinator agent**: kullanıcının isteğini analiz edip uygun ajan(lar)a yönlendirir
- **Skill memory**: başarılı tool zincirlerini macro tool'a dönüştürür
- **Parallel execution**: bağımsız step'leri paralel çalıştırır
- **Self-debugging**: başarısız plan'ları root-cause analizi yapar

---

## 2. İş Listesi

### F.1 ✅ Coordinator Agent — TAMAMLANDI
- [x] [`backend/app/services/coordinator.py`](../backend/app/services/coordinator.py:1) — `CoordinatorService.classify()` LLM ile route kararı
- [x] [`backend/agents/souls/coordinator.md`](../backend/agents/souls/coordinator.md:1) — koordinatör soul'u (12 ajan haritası)
- [x] [`backend/app/routers/coordinator.py`](../backend/app/routers/coordinator.py:1) — `POST /api/coordinator/route` endpoint
- [x] Frontend API: [`api.coordinatorRoute()`](../frontend/src/api/client.ts:1) helper
- [x] LLM kararı `{primary, chain[], reason, self_handled}` JSON döndürür; geçersiz ajan → self fallback
- [ ] Frontend "🎯 Otomatik" header toggle UI (sonraki UX sprint)

### F.2 ✅ Skill Memory — TAMAMLANDI (model + extractor)
- [x] [`backend/app/models/skill.py`](../backend/app/models/skill.py:1) — `SkillRecord(name, agent_id, tool_chain_json, success_count, is_macro, last_used_at)`
- [x] [`backend/app/services/skill_extractor.py`](../backend/app/services/skill_extractor.py:1):
  - SHA1 hash ile tool zinciri eşitliği
  - 3+ tool zinciri için kayıt + duplicate detection
  - 3 başarılı tekrarda otomatik `is_macro=True` promotion
- [ ] Executor entegrasyonu (plan COMPLETED'da `record_successful_chain()` çağrısı) — **küçük TODO**
- [ ] UI Skills sekmesi (sonraki UX sprint)

### F.3 Parallel Step Execution *(sonraki sprint)*
- [ ] `step.parallel_with` field, `asyncio.gather`, SSE `step_group_*` event'leri
- *Not:* Mevcut sequential execution stable çalışıyor; paralel optimizasyonu Sprint G+ için

### F.4 ✅ Self-Debugging — Model Hazır
- [x] [`backend/app/models/plan.py`](../backend/app/models/plan.py:1) — `failure_analysis_json` kolonu eklendi
- [ ] Reflector FAIL → root-cause LLM analizi entegrasyonu (sonraki sprint)
- *Mevcut:* Reflector zaten FAIL/RETRY/REPLAN kararını `decision.reason` ile döndürüyor; PlanRecord'a yazılması ek bir adım

### F.5 ✅ Prompt Versioning — TAMAMLANDI
- [x] [`backend/app/models/prompt_version.py`](../backend/app/models/prompt_version.py:1) — `PromptVersion(agent_id, version, content, soul_file)`
- [x] [`backend/app/services/prompt_versioning.py`](../backend/app/services/prompt_versioning.py:1):
  - `snapshot_prompt()` — auto-increment version + duplicate skip
  - `list_versions(agent_id)` ve `get_version(agent_id, version)` helper'lar
- [ ] agent_manager.update_agent içine `snapshot_prompt()` çağrısı entegrasyonu — **küçük TODO**
- [ ] UI: ajan detay sayfasında "Geçmiş prompt versiyonları" + rollback (sonraki UX sprint)

### F.6 A/B Test Framework *(sonraki sprint)*
- *Not:* `MessageFeedback` modeli (Sprint E.5) zaten 👍/👎 metrik altyapısını sağlıyor; A/B varyant runner sonraki sprint'te

---

## 3. Test/Kabul Kriterleri

- [x] Coordinator endpoint'i çalışır: `POST /api/coordinator/route` JSON karar döndürür
- [x] Coordinator fallback: geçersiz ajan veya LLM hata → `self_handled=True`
- [x] SkillExtractor: aynı tool zinciri 3 kez kaydedilince `is_macro=True` olur
- [x] PromptVersion: aynı içerik tekrar snapshot'lanırsa skip eder, farklıysa version++
- [x] PlanRecord: `failure_analysis_json` kolonu DB'de hazır
- [ ] Executor → skill_extractor entegrasyonu (sonraki adım)
- [ ] Reflector → failure_analysis_json yazımı (sonraki adım)

---

## 5. Yeni Eklenen Dosyalar

| Dosya | Tür |
|---|---|
| [`backend/app/services/coordinator.py`](../backend/app/services/coordinator.py:1) | **Yeni** — F.1 |
| [`backend/app/routers/coordinator.py`](../backend/app/routers/coordinator.py:1) | **Yeni** — F.1 |
| [`backend/agents/souls/coordinator.md`](../backend/agents/souls/coordinator.md:1) | **Yeni** — F.1 |
| [`backend/app/models/skill.py`](../backend/app/models/skill.py:1) | **Yeni** — F.2 |
| [`backend/app/services/skill_extractor.py`](../backend/app/services/skill_extractor.py:1) | **Yeni** — F.2 |
| [`backend/app/models/prompt_version.py`](../backend/app/models/prompt_version.py:1) | **Yeni** — F.5 |
| [`backend/app/services/prompt_versioning.py`](../backend/app/services/prompt_versioning.py:1) | **Yeni** — F.5 |

## 6. Güncellenen Dosyalar

- [`backend/app/models/__init__.py`](../backend/app/models/__init__.py:1) — SkillRecord + PromptVersion export
- [`backend/app/models/plan.py`](../backend/app/models/plan.py:1) — `failure_analysis_json` kolonu
- [`backend/app/routers/__init__.py`](../backend/app/routers/__init__.py:1) — coordinator_router export
- [`backend/app/main.py`](../backend/app/main.py:1) — coordinator_router include
- [`frontend/src/api/client.ts`](../frontend/src/api/client.ts:1) — `coordinatorRoute()` helper

## 7. Kalan Küçük TODO'lar

Bu sprint'in tam değer üretmesi için 2 küçük entegrasyon:

1. **Skill auto-record:** [`backend/app/services/planning/executor.py`](../backend/app/services/planning/executor.py:1) içinde `plan.status == COMPLETED` ve `len(tool_calls) >= 3` ise `record_successful_chain()` çağır.
2. **Prompt auto-snapshot:** [`backend/app/services/agent_manager.py`](../backend/app/services/agent_manager.py:1) `update_agent()` içinde `system_prompt` veya `soul_file` değişimde `snapshot_prompt()` çağır.

Bu iki adım kısa ama event loop senkronizasyonu için dikkatli yazılmalı; sonraki micro-sprint'te eklenecek.

---

## 4. Sonraki Adım

Sprint G: Dokümantasyon & demo.