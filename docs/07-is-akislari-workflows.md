# 07 — İş Akışları (Workflows)

## Workflow Nedir?

İş akışları, birden fazla ajan adımını görsel olarak birbirine bağlayarak oluşturulan otomasyon zincirleridir. Kod yazmadan karmaşık süreçleri tanımlayabilirsiniz.

**Örnek senaryolar:**
- Web'de araştırma yap → Özet çıkar → E-posta gönder
- Kod üret → Test et → Hata varsa düzelt → PR oluştur
- Veri topla → Temizle → Analiz et → Rapor oluştur

---

## Workflow Editörünü Açma

1. Üst menüde **"İş Akışları"** butonuna tıklayın
2. **"+ Yeni Workflow"** ile yeni bir akış başlatın
3. Mevcut workflow'u düzenlemek için üzerine tıklayın

---

## Node Türleri

### Ajan Nodu
Bir ajanı belirli bir girdiyle çağırır.

```
{
    type: "agent",
    agent_id: "agent-123",
    input_template: "Şu konuyu araştır: {{input}}",
    output_variable: "research_result"
}
```

### Araç Nodu
Bir aracı doğrudan çağırır (ajan gerektirmez).

```
{
    type: "tool",
    tool_name: "web_search",
    params: {"query": "{{topic}}"},
    output_variable: "search_results"
}
```

### Koşul Nodu
Çıktıya göre farklı dallara yönlendirir.

```
{
    type: "condition",
    condition: "{{result}} contains 'error'",
    true_branch: "error_handler",
    false_branch: "success_handler"
}
```

### Döngü Nodu
Bir adımı birden fazla girdi için tekrar eder.

```
{
    type: "loop",
    items: "{{url_list}}",
    item_variable: "current_url",
    body: ["scrape_node", "save_node"]
}
```

### Bekleme Nodu
Bir sonraki adıma geçmeden önce bekler.

```
{
    type: "wait",
    duration_seconds: 30
}
```

### Çıktı Nodu
Workflow sonucunu tanımlar.

```
{
    type: "output",
    value: "{{final_report}}"
}
```

---

## Değişken Sistemi

Node'lar arasında veri geçişi `{{variable_name}}` sözdizimi ile yapılır:

```
Web Search Nodu → output_variable: "results"
          ↓
Summary Nodu → input_template: "Şunları özetle: {{results}}"
          ↓
Email Nodu → body: "Özet: {{summary}}"
```

### Yerleşik Değişkenler

| Değişken | Açıklama |
|---|---|
| `{{input}}` | Workflow'a gelen başlangıç girdisi |
| `{{timestamp}}` | Çalıştırma zamanı |
| `{{workflow_id}}` | Aktif workflow ID'si |
| `{{iteration}}` | Döngü sayacı |

---

## Workflow Çalıştırma

### Manuel Çalıştırma
1. Workflow editöründe **▶ Çalıştır** butonuna basın
2. Gerekli girdi parametrelerini girin
3. Her node sırayla yürütülür (ilerleme görsel olarak takip edilir)

### Zamanlanmış Çalıştırma (APScheduler)

Workflow'u belirli aralıklarla otomatik çalıştırın:

```bash
# API üzerinden zamanlama
POST /api/tasks
{
    "name": "Günlük Araştırma",
    "workflow_id": "wf-123",
    "schedule": "0 9 * * *",   # Her gün saat 09:00
    "input": {"topic": "AI haberleri"}
}
```

**Cron formatı:**
```
*  *  *  *  *
│  │  │  │  └─ Haftanın günü (0-6)
│  │  │  └──── Ay (1-12)
│  │  └─────── Gün (1-31)
│  └────────── Saat (0-23)
└───────────── Dakika (0-59)
```

Sık kullanılan zamanlamalar:
```
0 * * * *      → Her saat başı
0 9 * * 1-5   → Hafta içi her sabah 09:00
*/30 * * * *  → Her 30 dakika
0 0 * * *     → Her gece yarısı
```

---

## Workflow Şablonları

Argus, hazır workflow şablonları sunar:

### 🔍 Araştırma ve Raporlama
```
Web Arama → İçerik Okuma → Özetleme → PDF Rapor → E-posta
```

### 💻 Kod Gözden Geçirme
```
Git Diff Al → Kod Analizi → Review Yazma → PR Yorum
```

### 📊 Veri Analizi Hattı
```
CSV Oku → Temizle → İstatistik → Grafik → Rapor
```

### 📧 İçerik Yayın Hattı
```
Konu Al → Blog Yaz → SEO Optimize → WordPress'e Gönder
```

### 🛡️ Güvenlik Tarama
```
Port Tara → SSL Kontrol → DNS Sorgula → Whois → Risk Raporu
```

---

## API Referansı

```bash
# Workflow listele
GET /api/workflows

# Workflow oluştur
POST /api/workflows
Body: {"name": "...", "nodes": [...], "edges": [...]}

# Workflow güncelle
PUT /api/workflows/{id}

# Workflow sil
DELETE /api/workflows/{id}

# Workflow çalıştır
POST /api/workflows/{id}/run
Body: {"input": "...", "variables": {}}

# Çalıştırma durumu
GET /api/workflows/{id}/runs

# Zamanlanmış çalıştırma ekle
POST /api/tasks
Body: {"workflow_id": "...", "schedule": "0 * * * *"}
```

---

## Zamanlı Görev Yönetimi

Tüm zamanlanmış görevler sistem panelinde görüntülenir:

- **Aktif görevler**: Bir sonraki çalışma zamanı
- **Geçmiş çalışmalar**: Son 10 çalışmanın sonucu
- **Duraklatma/Sürdürme**: Görev geçici olarak devre dışı bırakılabilir
- **Silme**: Görev tamamen kaldırılabilir

```bash
# Görev listesi
GET /api/tasks

# Görev duraklatma
POST /api/tasks/{id}/pause

# Görev sürdürme
POST /api/tasks/{id}/resume

# Görev silme
DELETE /api/tasks/{id}
```
