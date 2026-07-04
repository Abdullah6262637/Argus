# 06 — Bellek Sistemi ve Bilgi Grafiği

## Bellek Türleri

Argus, ajanlar için iki birbirini tamamlayan bellek sistemine sahiptir:

| Tür | Teknoloji | Kullanım |
|---|---|---|
| **Vektör Belleği** | ChromaDB | Anlam bazlı uzun süreli bellek |
| **Bilgi Grafiği** | JSON grafik | Yapılandırılmış ilişkisel bilgi |

Her ajan kendi izole bellek alanına sahiptir. Bir ajanın anıları diğer ajanlarla otomatik olarak paylaşılmaz (ancak `blackboard` ile paylaşılabilir).

---

## Vektör Belleği

### Nasıl Çalışır?

```
Ajan "save_memory" aracını çağırır
          ↓
Metin → Embedding modeli → Vektör (384 boyutlu sayı dizisi)
          ↓
ChromaDB'ye (vektör + metin + metadata) kaydedilir
          ↓
Daha sonra "recall_memory" ile:
"Python async konusunu ne öğrenmiştim?" → Vektörize edilir
          ↓
Cosine similarity ile en yakın anılar bulunur → LLM'e gönderilir
```

### Embedding Sağlayıcıları

**Yerel (Varsayılan)**
```env
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL_LOCAL=sentence-transformers/all-MiniLM-L6-v2
```
- İnternet bağlantısı gerektirmez
- İlk yüklemede model (~90MB) indirilir
- 384 boyutlu vektörler
- Çoğu kullanım için yeterli kalite

**OpenAI**
```env
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL_OPENAI=text-embedding-3-small
OPENAI_API_KEY=sk-...
```
- 1536 boyutlu vektörler
- Daha yüksek semantik kalite
- Her embedding için küçük maliyet

### Vektör Belleği Araçları

**`save_memory`** — Belleğe kaydet
```python
# Ajan şöyle çağırır:
{
    "tool": "save_memory",
    "params": {
        "content": "Python'da async/await kullanımı için asyncio kütüphanesi gereklidir.",
        "category": "python",
        "tags": ["python", "async", "programlama"]
    }
}
```

**`recall_memory`** — Anlamsal arama
```python
{
    "tool": "recall_memory",
    "params": {
        "query": "Python asenkron programlama",
        "top_k": 5,
        "min_score": 0.7
    }
}
# Döner: [{"content": "...", "score": 0.92, "created_at": "..."}, ...]
```

**`list_memory`** — Tüm anılar
```python
{
    "tool": "list_memory",
    "params": {
        "agent_id": "agent-123",
        "category": "python",
        "limit": 20
    }
}
```

**`delete_memory`** — Anı sil
```python
{
    "tool": "delete_memory",
    "params": {"memory_id": "mem-abc123"}
}
```

### Gelişmiş Vektör Araçları

**`ingest_document`** — Belge vektörize etme
```python
# Büyük belgeleri otomatik parçalara bölerek vektörize eder
{
    "tool": "ingest_document",
    "params": {
        "file_path": "/path/to/document.pdf",
        "chunk_size": 512,
        "overlap": 50
    }
}
```

**`vector_upsert`** — Ham vektör ekleme
```python
{
    "tool": "vector_upsert",
    "params": {
        "collection": "custom_collection",
        "text": "Bu bir test metnidir.",
        "metadata": {"source": "manual", "topic": "test"}
    }
}
```

**`vector_search`** — Ham vektör arama
```python
{
    "tool": "vector_search",
    "params": {
        "collection": "custom_collection",
        "query": "test",
        "top_k": 3
    }
}
```

### Vektör Verisi Nerede Saklanır?

```
backend/data/chroma/          ← ChromaDB dosyaları
    ├── chroma.sqlite3
    └── [collection-id]/
```

Yolu değiştirmek için:
```env
CHROMA_PATH=/custom/path/to/chroma
```

---

## Bilgi Grafiği (Knowledge Graph)

Bilgi grafiği, varlıklar (düğümler) ve aralarındaki ilişkileri (kenarlar) saklar. Vektör belleğinden farkı: anlam değil, **yapılandırılmış ilişkiler** saklar.

### Örnek Kullanım

```python
# Şirket varlığı ekle
kg_add_entity(
    name="Acme Corp",
    entity_type="company",
    properties={"sektör": "teknoloji", "çalışan": 500}
)

# Kişi varlığı ekle
kg_add_entity(
    name="Ahmet Yılmaz",
    entity_type="person",
    properties={"pozisyon": "CTO", "deneyim_yıl": 15}
)

# İlişki ekle
kg_add_relation(
    source="Ahmet Yılmaz",
    relation="çalışıyor_at",
    target="Acme Corp",
    properties={"başlangıç": "2019"}
)

# Sorgula
kg_query_neighbors(entity="Acme Corp", max_depth=2)
# Döner: Acme Corp ile bağlantılı tüm varlıklar

# Arama
kg_search(query="teknoloji şirketi")
# Döner: eşleşen varlıklar
```

### Bilgi Grafiği Görselleştirici

Arayüzde üst sağ köşede **"KG"** butonuna tıklayarak bilgi grafiğini görsel olarak inceleyebilirsiniz:

- Düğümler türe göre renklendirme (person, company, concept, vb.)
- Kenarlar ilişki tipini gösterir
- Tıklayarak düğüm detayları görülebilir
- Yakınlaştırma/uzaklaştırma ve sürükleme desteği

### Bilgi Grafiği Verisi Nerede Saklanır?

```
backend/data/knowledge_graph.json
```

Yolu değiştirmek için:
```env
KNOWLEDGE_GRAPH_PATH=/custom/path/knowledge_graph.json
```

---

## Bellek vs. Sohbet Geçmişi

| Özellik | Sohbet Geçmişi | Vektör Belleği |
|---|---|---|
| Saklama yeri | SQLite | ChromaDB |
| Erişim yöntemi | Kronolojik sıra | Semantik benzerlik |
| Kapsam | Oturum + geçmiş mesajlar | Kalıcı uzun vadeli |
| Kapasite | `MAX_HISTORY_MESSAGES` ile sınırlı | Sınırsız |
| Kullanım | Her mesajda otomatik | Manuel `save_memory` çağrısı |
| Arama | Yok | Anlam bazlı arama |

---

## Önerilen Bellek Stratejisi

```
Görev sırasında:
├── Öğrenilen önemli bilgiler → save_memory
├── Proje bağlamı → save_memory (category: "proje-X")
└── Kişi bilgileri → kg_add_entity + kg_add_relation

Görev başında:
└── recall_memory("proje X neydi?") → Bağlamı yükle

Araştırma sonrası:
└── ingest_document("araştırma_raporu.pdf") → Tüm belgeyi vektörize et
```

---

## API Endpoint'leri

```bash
# Bellek listele
GET /api/memory/{agent_id}

# Bellek ekle
POST /api/memory/{agent_id}
Body: {"content": "...", "category": "...", "tags": [...]}

# Bellek sil
DELETE /api/memory/{memory_id}

# KG görüntüle
GET /api/memory/{agent_id}/knowledge-graph
```
