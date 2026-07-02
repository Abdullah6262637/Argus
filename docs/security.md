# 🔐 UmtalAgent — Güvenlik Modeli

> Yerel çalışan bir AI ajan sisteminde güvenlik **çok katmanlı** olmak zorundadır. Bu doküman UmtalAgent'ın güvenlik mimarisini özetler.

---

## 1. Threat Model

UmtalAgent şu tehditlere karşı **savunma** sağlar:

| Tehdit | Etki | Savunma |
|---|---|---|
| API anahtarı sızıntısı | Saldırgan başkasının LLM bütçesini harcar | Fernet encryption + OS keyring |
| Prompt injection (kötü niyetli web sayfası) | LLM zararlı tool çağırır | Permission system + HITL |
| Tool zinciri exploit (örn. `rm -rf /`) | Kullanıcı verisi silinir | HIGH_RISK_TOOLS + sandbox + onay |
| Audit log manipulation | "Kim ne yaptı" izi silinir | HMAC-SHA256 chain |
| Race condition | Eş zamanlı ajanlar veri bozar | DB transaction + asyncio lock |
| Resource exhaustion | DoS — bellek/disk doldurma | Resource limits (`memory_limit_mb`, `cpu_seconds`) |

UmtalAgent şu tehditlere karşı **savunma sağlamaz** (tasarım gereği):

- Local-first uygulama: bilgisayarın **tam kontrolü** zaten kullanıcıdadır; UmtalAgent'ı çalıştıran kullanıcı sistem yöneticisidir
- Network-level saldırılar: HTTPS proxy, VPN gibi konular kullanıcının sorumluluğu

---

## 2. Katman 1 — API Anahtarı Şifreleme

### Fernet Encryption
[`backend/app/services/security/secrets.py`](../backend/app/services/security/secrets.py:1)

```python
encrypt(plaintext)  → "enc::gAAAAAB..." (Fernet-encrypted)
decrypt(ciphertext) → plaintext
mask(value)         → "sk-a***-xyz" (UI'da)
```

### Master Key Yönetimi
1. **OS Keyring** (Windows Credential Manager / macOS Keychain / Linux Secret Service)
2. **Filesystem fallback**: `data/.master_key` (chmod 0600)

### Auto-Encrypt
Kullanıcı `agents.yaml`'a düz metin api_key yapıştırırsa, **load() sırasında otomatik şifreleme** yapılır ve dosya yeniden yazılır.

```yaml
# Önce:
api_key: sk-plaintext-abc123

# Sonra (load + auto-encrypt):
api_key: enc::gAAAAABm...
```

### .env Yönetimi
Sprint A.7 ile [`/api/system/env`](../backend/app/routers/system.py:1) endpoint'leri:
- Whitelist: sadece `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_BASE_URL`, `ANTHROPIC_BASE_URL`
- UI'da maskelenmiş gösterim
- Anahtarlar **asla** GET response'unda dönmez

---

## 3. Katman 2 — Permission System

Her tool'un bir `permission` field'ı vardır:

| Permission | Anlam |
|---|---|
| `none` | Saf hesaplama, kimse engelleyemez |
| `file_system` | Dosya I/O (read, write, delete) |
| `terminal_cmd` | Subprocess / kabuk komutu |
| `web_search` | Internet erişimi |
| `system_admin` | OS-level (klavye, ekran, güç) |

### AgentPermissions
[`backend/app/schemas/agent.py`](../backend/app/schemas/agent.py:1):

```python
class AgentPermissions(BaseModel):
    file_system: bool = True
    terminal_cmd: bool = True
    web_search: bool = True
    system_admin: bool = True
```

### Tool Filtering
[`backend/app/services/tools/registry.py`](../backend/app/services/tools/registry.py:1) `filter_for_agent()`:

```python
def filter_for_agent(self, perms: AgentPermissions) -> List[BaseTool]:
    return [t for t in self._tools.values()
            if self._is_permitted(t.permission, perms)]
```

→ İzin verilmeyen tool **LLM'e expose edilmez**, prompt'a bile dahil olmaz.

### Hazır Preset'ler (Sprint A.11.2)
| Preset | file | term | web | sys |
|---|---|---|---|---|
| 🔒 Salt-okunur | ❌ | ❌ | ❌ | ❌ |
| 🔍 Araştırmacı | ❌ | ❌ | ✅ | ❌ |
| ✏️ Yazar | ✅ | ❌ | ✅ | ❌ |
| 💻 Geliştirici | ✅ | ✅ | ✅ | ❌ |
| 👑 Tam yetkili | ✅ | ✅ | ✅ | ✅ |

---

## 4. Katman 3 — HITL (Human-in-the-Loop)

### Yüksek Risk Tool'ları
[`backend/app/services/approval_service.py`](../backend/app/services/approval_service.py:1) `HIGH_RISK_TOOLS`:

```python
HIGH_RISK_TOOLS = {
    "run_command", "kill_process", "shutdown",
    "delete_file", "lock_screen", "set_volume",
    "docker_run", "docker_build", "kubectl_apply",
    "port_scan"}
```

### Tehlikeli Komut Pattern'leri
`run_command` özel olarak şunları **kesin high-risk** yapar:
```regex
\brm\s+-rf?\b
\bdel\s+/[sf]\b
\bformat\s+[a-z]:
\bdd\s+if=
\bmkfs\.
:\(\)\{.*\}\;\:        # fork bomb
\bshutdown\b
reg\s+delete
```

### Approval Flow
1. LLM tool çağırır
2. `tool_registry.execute()` → `requires_approval(tool_name, args)` kontrol
3. True → DB'ye `PendingApproval` yazılır + WebSocket broadcast
4. UI [`ApprovalDialog`](../frontend/src/components/ApprovalDialog.tsx) açılır
5. Kullanıcı **Onayla / Reddet** → `POST /api/approvals/{id}/(approve|reject)`
6. `asyncio.Event.set()` → tool execute eder veya error döner
7. Default timeout: **5 dakika** → otomatik reject

---

## 5. Katman 4 — Sandbox

### run_command Whitelist
[`backend/app/config.py`](../backend/app/config.py:1):

```python
run_command_allowlist: str = "git,npm,python,pip,node,echo,dir,ls,cat,type,where,pwd,hostname"
```

İzin verilmeyen komutlar **çalıştırılmaz** (HITL'i de bypass etmez).

### Resource Limits
[`backend/app/services/security/resource_limits.py`](../backend/app/services/security/resource_limits.py:1):
- `python_eval`: 256 MB bellek, 5 saniye CPU
- `run_command`: 60 saniye timeout

### CWD Jail
`run_command_cwd_jail` setting'i ile çalıştırma dizini sınırlandırılabilir (default: kapalı).

---

## 6. Katman 5 — Audit Chain (HMAC)

### Tasarım
[`backend/app/services/audit.py`](../backend/app/services/audit.py:1) — Her tool execution sonrası DB'ye kayıt:

```sql
CREATE TABLE audit_entries (
    seq INTEGER PRIMARY KEY,    -- monoton sayaç
    event_type VARCHAR,
    payload_json TEXT,           -- {tool, args, ok, output_preview}
    prev_hash VARCHAR,           -- bir öncekinin hmac_sig'i
    hmac_sig VARCHAR             -- hmac_sha256(secret, f"{seq}|{prev_hash}|{payload_json}")
);
```

### Verification
```python
ok, errors = await audit_chain.verify_chain()
# False → log değiştirilmiş veya silinmiş
```

### Secret
- `audit_hmac_secret` env var
- Yoksa: `data/audit/.secret` dosyası (chmod 0600)
- Her başlatmada secret değişmez (zincir kırılmasın)

---

## 7. Katman 6 — Plugin Sandbox

[`backend/app/services/plugins/loader.py`](../backend/app/services/plugins/loader.py:1) ile yüklenen 3rd-party plugin'ler:
- `import` whitelist (sadece güvenli modüller)
- `subprocess` block (gerekirse explicit izin)
- `eval/exec` engelli

Detaylar: [`backend/tests/test_plugin_sandbox.py`](../backend/tests/test_plugin_sandbox.py:1)

---

## 8. CORS & Network

[`backend/app/main.py`](../backend/app/main.py:1):
```python
allow_origin_regex=".*"  # Electron file:// için
allow_credentials=False  # cookie/auth yok
```

> **Not:** Backend sadece `127.0.0.1`'de dinler; dış dünyaya açık değildir.

---

## 9. Logs

[`backend/app/services/observability/logging_config.py`](../backend/app/services/observability/logging_config.py:1):
- `log_format=text` (default) veya `json`
- API anahtarları **asla** loglanmaz (`agent_manager` filter)
- Tool argümanları log'a yazılır ama **sensitive olanlar** maskelenir (TODO: argument-level mask)

---

## 10. Best Practices (Kullanıcı için)

✅ **Yapılması gerekenler:**
- Onboarding'de `.env`'i doldur, ajan-bazlı api_key yerine `.env` kullan
- Yeni ajanı **Salt-okunur** preset ile başlat, ihtiyaç doğdukça izin aç
- Üretim ortamında `audit_hmac_secret`'ı manuel set et
- Düzenli olarak `verify_chain()` (admin endpoint planı)

❌ **Yapılmaması gerekenler:**
- Şüpheli web sayfasını ajana okutup tool çağırmasına izin verme (prompt injection)
- `run_command_allowlist`'i geniş tutma
- API anahtarını `agents.yaml`'a düz metin yapıştır (auto-encrypt çalışsa da YAML commit edilebilir)

---

## 11. Güvenlik Açığı Bildirimi

Bir güvenlik açığı bulduysan:
1. **Public issue açma** — saldırganlar görebilir
2. Email: security@umtalagent.example (placeholder)
3. PGP key (varsa) ile şifrele

90 gün içinde fix yayınlanmazsa public disclosure yapabilirsin.

---

## 12. İlgili Dokümanlar

- [`docs/code-signing.md`](code-signing.md:1) — Production sertifika imzalama
- [`docs/tool-yazma.md`](tool-yazma.md:1) — Tool yazarken permission seçimi
- [`plans/sprint-a-stabilizasyon.md`](../plans/sprint-a-stabilizasyon.md:1) — Auto-encrypt detay