# 01 — Genel Bakış ve Mimari

## Argus Nedir?

**Argus**, yerel makinenizde çalışan, üretim kalitesinde bir **çoklu ajan sistemi (Multi-Agent System)**'dir. Birden fazla yapay zeka ajanını eş zamanlı olarak çalıştırmanıza, birbirleriyle iletişim kurmasına ve karmaşık görevleri adım adım yürütmesine olanak tanır.

Adı Yunan mitolojisindeki yüz gözlü devden gelir: **Aynı anda her şeyi gören sistem.**

---

## Temel Bileşenler

```
┌─────────────────────────────────────────────────────────┐
│                     KULLANICI ARAYÜZÜ                   │
│              React 19 + TypeScript + Vite               │
│         (http://localhost:5173)                         │
└───────────────────────┬─────────────────────────────────┘
                        │  HTTP REST / SSE / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│                    FASTAPI BACKEND                       │
│              Python 3.12 + uvicorn                      │
│         (http://localhost:8000)                         │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Agent   │  │   Chat   │  │  Tools   │  │  MCP   │  │
│  │  Loop    │  │ Service  │  │ Registry │  │ Bridge │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  Memory  │  │Scheduler │  │ Planning │  │Browser │  │
│  │ (Chroma) │  │  (APSch) │  │  Engine  │  │(Playwright)│
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    VERİTABANI KATMANI                   │
│         SQLite (aiosqlite + SQLAlchemy async)           │
│         ChromaDB (vektör belleği)                       │
│         JSON (bilgi grafiği)                            │
└─────────────────────────────────────────────────────────┘
```

---

## Proje Dizin Yapısı

```
argus/
│
├── backend/                    # Python 3.12 + FastAPI
│   ├── app/
│   │   ├── main.py             # Uygulama giriş noktası
│   │   ├── config.py           # Ayarlar (.env okuma)
│   │   ├── database.py         # Async SQLite bağlantısı
│   │   ├── models/             # SQLAlchemy ORM modelleri
│   │   ├── schemas/            # Pydantic istek/yanıt şemaları
│   │   ├── routers/            # API endpoint grupları (14 router)
│   │   └── services/
│   │       ├── agent_loop.py   # ReAct döngüsü
│   │       ├── agent_manager.py
│   │       ├── chat_service.py # SSE streaming
│   │       ├── scheduler.py    # APScheduler
│   │       ├── workflow.py     # İş akışı yürütücüsü
│   │       ├── coordinator.py  # Ajan koordinasyonu
│   │       ├── llm/            # LLM sağlayıcı katmanı
│   │       ├── tools/          # 200+ araç
│   │       ├── memory/         # ChromaDB + KG
│   │       ├── mcp/            # MCP köprüsü
│   │       ├── browser/        # Playwright otomasyonu
│   │       ├── planning/       # Planlama motoru
│   │       ├── security/       # Sandbox + rate limiting
│   │       └── observability/  # Loglama + trace
│   ├── agents/                 # Ajan YAML konfigürasyonları
│   └── data/                   # SQLite DB + ChromaDB
│
├── frontend/                   # React 19 + TypeScript
│   └── src/
│       ├── App.tsx             # Ana koordinatör
│       ├── components/         # 28 UI bileşeni
│       ├── hooks/              # 9 custom hook
│       ├── api/                # API istemcisi
│       └── types/              # TypeScript türleri
│
├── plugins/                    # Harici plugin sistemi
├── docs/                       # Bu dokümantasyon
├── logo/                       # Uygulama logoları
├── start.bat                   # Windows başlatma
└── start.ps1                   # PowerShell başlatma
```

---

## Yaşam Döngüsü

Uygulama başladığında şu adımlar sırayla gerçekleşir:

1. **`init_db()`** — SQLite tabloları oluşturulur (migrations otomatik)
2. **`agent_manager.load()`** — Kayıtlı ajanlar belleğe yüklenir
3. **`start_scheduler_with_db()`** — Zamanlanmış görevler başlatılır
4. **`plugin_loader.load_all()`** — Harici plugin'ler yüklenir
5. **`mcp_bridge.connect_all()`** — MCP sunucu bağlantıları kurulur
6. **Chromium yükleme** — Playwright için arkaplanda Chromium indirilir

Kapatılırken:
1. APScheduler durdurulur
2. Playwright tarayıcısı kapatılır
3. MCP bağlantıları kapatılır
4. LLM HTTP istemcileri kapatılır

---

## Veri Akışı (Tam Döngü)

```
Kullanıcı mesajı yazar
        ↓
React UI → POST /api/chat/{agent_id}
        ↓
ChatService mesajı veritabanına kaydeder
        ↓
AgentLoop başlatılır (ReAct döngüsü)
        ↓
┌─────────────────────────────────────┐
│  DÜŞÜN: LLM'e sistem promptu +     │
│  geçmiş mesajlar + araç listesi    │
│  gönderilir.                       │
│         ↓                          │
│  KARAR: LLM araç çağrısı mı        │
│  yoksa direkt yanıt mı?           │
│         ↓                          │
│  ARAÇ ÇAĞIRmak istiyorsa:         │
│  Tool Registry aracı çalıştırır   │
│  Sonuç LLM'e geri iletilir        │
│         ↓                          │
│  GÖZLEMLE: Araç çıktısını işle    │
│  (max 7 adım, sonra dur)          │
└─────────────────────────────────────┘
        ↓
SSE stream → React UI (gerçek zamanlı token akışı)
        ↓
WebSocket güncelleme → Durum paneli
```

---

## Teknoloji Yığını

| Katman | Teknoloji | Sürüm |
|---|---|---|
| Backend framework | FastAPI | 0.115+ |
| ASGI sunucusu | uvicorn | — |
| Performans Motoru | Rust Core (argus_core via PyO3) | — |
| ORM | SQLAlchemy (async) | 2.x |
| Veritabanı | SQLite / aiosqlite | — |
| Vektör DB | ChromaDB | — |
| LLM istemcisi | openai / anthropic / httpx | — |
| Görev zamanlayıcı | APScheduler | 3.x |
| Tarayıcı otomasyonu | Playwright | — |
| Ayar yönetimi | pydantic-settings | — |
| Frontend framework | React | 19 |
| Dil | TypeScript | 5.x |
| Build aracı | Vite | 6.x |
| CSS | Tailwind CSS | 3.x |

