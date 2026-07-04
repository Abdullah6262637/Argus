# 09 — Güvenlik, Sandbox ve İzin Sistemi

## Güvenlik Mimarisi

Argus, yerel bir sistem olmasına rağmen ajanların sistem üzerindeki etkisini sınırlamak için katmanlı bir güvenlik mimarisi kullanır:

```
Kullanıcı → Ajan İzinleri → Araç Filtresi → Sandbox → Sistem
```

1. **Ajan İzinleri** — Ajan hangi araç gruplarını kullanabilir?
2. **Araç Filtresi** — İzinsiz araçlar LLM'e bile gösterilmez
3. **Sandbox** — Komut çalıştırma, allowlist ile kısıtlı
4. **Onay Mekanizması** — Riskli işlemler kullanıcıya sorulur

---

## İzin Sistemi

### İzin Grupları

Her ajan, aşağıdaki izin anahtarlarının açık/kapalı kombinasyonuyla çalışır:

| İzin Anahtarı | Kapsadığı Araçlar | Risk |
|---|---|---|
| `web_search` | web_search, open_url | Düşük |
| `file_read` | read_file, list_dir, search_files | Düşük |
| `file_write` | write_file, delete_file, mkdir | Orta |
| `code_execution` | python_eval, run_command, sandbox_execute | Yüksek |
| `system_commands` | open_app, shutdown, kill_process | Yüksek |
| `ui_automation` | screenshot, click, type_text | Orta |
| `network_access` | http_request, download_file | Orta |
| `memory_read` | recall_memory, vector_search | Düşük |
| `memory_write` | save_memory, vector_upsert | Düşük |
| `browser_control` | browser_navigate, browser_click | Orta |

### Güvenli Ajan Profili (Önerilen Başlangıç)

```
✅ web_search
✅ file_read
✅ memory_read
✅ memory_write
❌ file_write
❌ code_execution
❌ system_commands
❌ ui_automation
```

### Geliştirici Ajan Profili

```
✅ Tüm izinler açık
```

---

## Sandbox — Komut Çalıştırma Güvenliği

`run_command` aracı, yalnızca `RUN_COMMAND_ALLOWLIST`'teki komutlara izin verir.

### Allowlist Yapılandırması

```env
RUN_COMMAND_ALLOWLIST=git,npm,python,pip,node,echo,dir,ls,cat,type,where,pwd,hostname
```

Bir komut listede yoksa ajan şu hatayı alır:
```
Tool error: Command 'rm' is not in the allowlist.
```

### Çalışma Dizini Kısıtlaması

```env
RUN_COMMAND_CWD_JAIL=/home/user/projects
```

Bu ayar yapıldığında ajan yalnızca bu dizin ve altındaki dizinlerde çalışabilir. `../` ile üst dizine çıkma engellenir.

### Python Sandbox

`python_eval` ve `sandbox_execute_python` araçları kısıtlı bir ortamda çalışır:

- `os.system()` çağrısı engellenir
- `subprocess` modülü engellenir
- Dosya sistemi erişimi kısıtlıdır
- Ağ erişimi kısıtlıdır

### Docker Sandbox

Tam izolasyon için `docker_sandbox_run` aracını kullanın:

```python
{
    "tool": "docker_sandbox_run",
    "params": {
        "code": "print('Merhaba Docker!')",
        "image": "python:3.12-slim",
        "timeout": 30
    }
}
```

Bu araç:
- Geçici bir Docker container başlatır
- Kodu çalıştırır
- Container'ı siler

---

## Onay Mekanizması (Human-in-the-Loop)

Belirli araçlar çalışmadan önce kullanıcı onayına sunulabilir.

### Onay Gerektiren Durumlar

- Yüksek riskli araç çağrısı (`delete_file`, `run_command`)
- Ajan `agent_wait_for_approval` aracını çağırdığında
- Workflow'da kullanıcı girdisi gerektiren adım

### Onay Akışı

```
Ajan: "delete_file('/important/file.txt')" çağırır
          ↓
Sistem: Onay kuyruğuna ekler
          ↓
Kullanıcı: Arayüzde onay bildirimi görür
          ↓
Kullanıcı: "Onayla" veya "Reddet" seçer
          ↓
Onayla → Araç çalışır → Ajan devam eder
Reddet → Ajan "Kullanıcı reddetti" bilgisi alır → Alternatif yol arar
```

### Onay Bekleme Süresi

Kullanıcı belirli sürede yanıt vermezse ajan zaman aşımı alır:

```env
APPROVAL_TIMEOUT_SECONDS=300  # 5 dakika
```

### API Referansı

```bash
# Bekleyen onaylar
GET /api/approvals/pending

# Onay ver
POST /api/approvals/{id}/approve

# Reddet
POST /api/approvals/{id}/reject

# Onay geçmişi
GET /api/approvals/history
```

---

## Denetim Günlüğü (Audit Log)

Kritik sistem olayları HMAC imzalı denetim kaydına alınır. Bu kayıtlar değiştirilemez (bütünlük doğrulaması).

### Kaydedilen Olaylar

- Ajan oluşturma, güncelleme, silme
- Sistem sıfırlama
- Araç izin değişiklikleri
- Onay kararları
- Başarısız kimlik doğrulama denemeleri

### HMAC İmzası Yapılandırması

```env
AUDIT_HMAC_SECRET=gizli-anahtar-buraya
```

Boş bırakılırsa sistem başlangıçta otomatik olarak rastgele bir anahtar üretir.

### Denetim Logları Görüntüleme

```bash
GET /api/logs?type=audit&limit=100
```

---

## Rate Limiting

### LLM API Rate Limiting

Argus, LLM API'lerini dakika başına istek ve token limitleriyle korur:

```env
RATE_LIMIT_OPENAI_RPM=60      # Dakikada maksimum istek
RATE_LIMIT_OPENAI_TPM=200000  # Dakikada maksimum token
RATE_LIMIT_ANTHROPIC_RPM=50
RATE_LIMIT_ANTHROPIC_TPM=100000
```

Limit aşılırsa:
1. İstek kuyrukta bekler
2. Kalan süre hesaplanır (`x-ratelimit-reset-requests` başlığı)
3. Otomatik olarak yeniden denenir

### Mesaj Uzunluk Limiti

```env
MAX_TOKENS_PER_REQUEST=2048   # Maksimum yanıt uzunluğu
MAX_HISTORY_MESSAGES=30       # Gönderilecek geçmiş mesaj sayısı
```

---

## CORS Yapılandırması

Argus, Electron (file://) dahil tüm kaynaklara CORS izni verir. Bu, yerel desktop uygulaması olduğu için güvenli kabul edilir:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",  # Tüm kaynaklar
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-trace-id"],
)
```

Üretim ortamına dağıtım için bunu kısıtlayın:
```env
CORS_ORIGINS=http://yourdomain.com,https://yourdomain.com
```

---

## Trace ID İzleme

Her HTTP isteği benzersiz bir trace ID ile etiketlenir:

```
İstek başlığı: x-trace-id: abc123def456
Yanıt başlığı: x-trace-id: abc123def456
```

Tüm log satırları bu ID'yi içerir. Birden fazla log satırını tek bir işleme bağlamak için kullanılır.

```bash
# Belirli bir trace'i filtrele
grep "abc123def456" backend/logs/argus.log
```

---

## Güvenlik Kontrol Listesi

Dağıtım öncesi kontrol edin:

- [ ] `.env` dosyası `.gitignore`'da mı?
- [ ] `AUDIT_HMAC_SECRET` değeri güçlü ve benzersiz mi?
- [ ] `RUN_COMMAND_ALLOWLIST` gereksiz komutlardan arındırıldı mı?
- [ ] `RUN_COMMAND_CWD_JAIL` uygun dizine ayarlandı mı?
- [ ] `CORS_ORIGINS` yalnızca izin verilen domainleri içeriyor mu?
- [ ] Rate limit değerleri plan kotanıza uygun mu?
- [ ] Yüksek riskli araçlar için onay mekanizması aktif mi?
