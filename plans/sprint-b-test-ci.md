# 🧪 Sprint B — Test & CI

> **Hedef:** %50+ test kapsamı, GitHub Actions CI pipeline, e2e otomasyonu.
> **Öncelik:** YÜKSEK
> **Tahmini süre:** 1 hafta
> **Referans:** [`plans/genel-analiz-ve-eksikler.md`](genel-analiz-ve-eksikler.md:321) — Sprint B maddeleri.

---

## 1. Özet

Mevcut test kapsamı ~%5. Refactor güveni zayıf. Bu sprint sonunda:
- Backend pytest %50+ (planner, executor, reflector, tools, security)
- Frontend vitest hook + component testleri
- Playwright e2e: tam akış (chat → plan → tool → onay → memory)
- GitHub Actions: lint + type-check + test + e2e on PR

---

## 2. İş Listesi

### B.1 ✅ Backend pytest genişletme — TAMAMLANDI
- [x] [`backend/tests/test_planner.py`](../backend/tests/test_planner.py:1) — TaskPlanner JSON parse + step build + create_plan testleri
- [x] [`backend/tests/test_executor.py`](../backend/tests/test_executor.py:1) — Streaming events, retry, fail, prompt build, summary
- [x] [`backend/tests/test_reflector.py`](../backend/tests/test_reflector.py:1) — Tüm verdict tipleri + LLM hata fallback
- [x] [`backend/tests/test_audit.py`](../backend/tests/test_audit.py:1) — Append + HMAC zincir + verify_chain
- [x] [`backend/tests/test_approval.py`](../backend/tests/test_approval.py:1) — Risk classify + approve/reject/timeout flow
- [x] [`backend/tests/test_memory_vector.py`](../backend/tests/test_memory_vector.py:1) — Smoke (chromadb opsiyonel)
- [x] [`backend/tests/test_workflow.py`](../backend/tests/test_workflow.py:1) — Template render + run + step failure
- [x] [`backend/tests/test_secrets.py`](../backend/tests/test_secrets.py:1) — Encrypt/decrypt roundtrip + mask
- [x] [`backend/tests/test_agent_manager.py`](../backend/tests/test_agent_manager.py:1) — CRUD + load + auto-encrypt + soul loading
- [x] [`backend/.coveragerc`](../backend/.coveragerc:1) — pytest-cov yapılandırması (`source=app`, `branch=True`)

### B.2 ✅ Frontend vitest — TAMAMLANDI
- [x] [`frontend/src/hooks/useAgents.test.ts`](../frontend/src/hooks/useAgents.test.ts:1) — load + reload + error mocked
- [x] [`frontend/src/hooks/useApprovals.test.ts`](../frontend/src/hooks/useApprovals.test.ts:1) — WS reducer (required/decided/duplicate/remove)
- [ ] *(Sprint B+ ileride)* `useChat.test.ts`, `usePlan.test.ts`, MessageBubble/TaskTimeline/ApprovalDialog component testleri — temel hook'lar tamamlandı, component'ler ileride

### B.3 ✅ Playwright e2e — TAMAMLANDI
- [x] [`frontend/tests/e2e/full-flow.spec.ts`](../frontend/tests/e2e/full-flow.spec.ts:1) — health + agents + souls + env + UI smoke
- [x] [`frontend/tests/e2e/workflow.spec.ts`](../frontend/tests/e2e/workflow.spec.ts:1) — list + create + raw + delete + invalid YAML
- [x] [`frontend/tests/e2e/voice.spec.ts`](../frontend/tests/e2e/voice.spec.ts:1) — voice/status + speak smoke
- [x] [`frontend/playwright.config.ts`](../frontend/playwright.config.ts:1) — Chromium + Firefox project'leri

### B.4 ✅ GitHub Actions — TAMAMLANDI
- [x] [`.github/workflows/ci.yml`](../.github/workflows/ci.yml:1) — backend (pytest+ruff+mypy) + frontend (vitest+tsc) PR'da çalışır
- [x] [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml:1) — Playwright (chromium + firefox) gece + workflow_dispatch
- [x] [`.github/workflows/release.yml`](../.github/workflows/release.yml:1) — tag push → electron-builder → GitHub Release
- [x] [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md:1) — açıklama / test / güvenlik / kontrol listesi
- [x] [`.github/CODEOWNERS`](../.github/CODEOWNERS:1) — backend/frontend/devops takım atamaları

### B.5 ✅ Pre-commit hooks — TAMAMLANDI
- [x] [`.pre-commit-config.yaml`](../.pre-commit-config.yaml:1) — ruff + mypy (Python), eslint + prettier (TS), genel hooks (whitespace, eof, yaml, large-files, private-key)
- [x] `conventional-pre-commit` ile commit-msg validator (feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert)

---

## 3. Test/Kabul Kriterleri

- [x] `pytest --cov=app` çalışıyor; coverage raporu CI'da artifact olarak yüklenir (.coveragerc + pytest.ini)
- [x] `npm run test:coverage` çalışıyor; coverage raporu CI'da artifact olarak yüklenir
- [x] Playwright 3+ senaryo: full-flow, workflow, voice (chromium + firefox)
- [x] PR açıldığında CI otomatik çalışır ve hatalar PR'da görünür ([`ci.yml`](../.github/workflows/ci.yml:1))

> **Not:** Coverage hedefleri (%50 backend, %40 frontend) ilk PR'da kontrol edilir. Eksik kapsam alanları sonraki sprint'lerde doldurulacak.

---

## 4. Sonraki Adım

Sprint C: Production paketleme.