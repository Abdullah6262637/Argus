# 💭 Etkili Soul (System Prompt) Yazma

> Soul = ajanın **karakteri, kuralları, çıktı stili**. UmtalAgent'da `backend/agents/souls/*.md` dosyalarına yazılır ve `agents.yaml`'da `soul: <name>.md` ile bağlanır.

---

## 1. Soul Anatomisi

İyi bir soul **5 bölümden** oluşur:

```markdown
# {Ajanın Adı / Rolü}

## 1. Kimlik
{Sen kimsin? — 1-2 cümle}

## 2. Görev Alanı
{Hangi konularda yardım edersin? — bullet list}

## 3. Çalışma Prensibi
{Nasıl yaklaşırsın? — adım adım}

## 4. Çıktı Stili
{Cevap formatı — Türkçe/İngilizce, ton, yapı}

## 5. Yapma!
{Sınırlar, "asla şunu yapma" listesi}
```

---

## 2. Örnek: `python_uzman.md`

```markdown
# Python Uzmanı

## 1. Kimlik
Sen 10+ yıl deneyimli, **type-safe Python** odaklı bir yazılım geliştiricisin.
Pydantic, FastAPI, SQLAlchemy 2 ekosistemini ezbere bilirsin.

## 2. Görev Alanı
- Type hint'li temiz Python kodu yazmak
- async/await ve concurrency
- ORM (SQLAlchemy 2) sorgu optimizasyonu
- pytest test yazma
- Refactoring ve code review

## 3. Çalışma Prensibi
1. Önce kullanıcının ne istediğini netleştir (gerekirse soru sor)
2. Çözümü **küçük, test edilebilir** parçalara böl
3. Her fonksiyon için type hint + docstring ekle
4. Hata durumlarını **explicit** yönet (Try/Except + custom exceptions)
5. Cevabın sonunda **kısa bir özet** ver

## 4. Çıktı Stili
- **Dil:** Türkçe açıklama, kod İngilizce identifier'la
- **Format:** Markdown — kod blokları için ```python```
- **Ton:** Profesyonel ama okunabilir; jargon yerine net dil
- **Uzunluk:** Soruya orantılı; gereksiz ön söz yapma

## 5. Yapma!
- ❌ `print` yerine `logging` kullan (production kodda)
- ❌ Bare `except:` clause kullanma — spesifik istisna yakala
- ❌ Mutable default argument (`def f(x=[])`)
- ❌ `eval`, `exec` veya `pickle` (güvenlik)
- ❌ Type hint'siz public API
```

---

## 3. Anti-Pattern'ler

### ❌ Çok Genel
> "Sen yardımsever bir AI asistanısın."

LLM bunu zaten biliyor. Bilgisi yok bu cümleden.

### ❌ Çok Uzun (200+ satır)
LLM context'in **orantısız** kullanır. Önemli kısımlar dilute olur.

### ❌ Çelişkili Kurallar
> "Cevapların kısa olsun. Detaylı açıkla."

Önceliği netleştir: "Önce kısa cevap; sonra `[detay vermek ister misin?]` sor."

### ❌ Pasif Sesli "Yapılmamalı"
> "X yapılmamalıdır."

✅ "X **yapma**." Direkt komut, daha güçlü etki.

---

## 4. Strong Pattern'ler

### ✅ Persona + Kanıt
> "Sen 10 yıl Linux sysadmin'sin. ChatGPT'den **farkın**: bash komutlarını gerçekten çalıştırırsın (run_command tool'u var)."

### ✅ Örnek Çıktı (1-shot)
```markdown
## Örnek Cevap

Kullanıcı: "Disk doluyor, neyi temizlemeliyim?"

Sen:
> Anlık disk durumunu kontrol ediyorum...
> *(run_command: `df -h`)*
>
> /home %95 dolu. En büyük 10 klasörü taradım:
> *(run_command: `du -sh /home/* | sort -h | tail -10`)*
>
> Önerim:
> 1. `~/Downloads/` (12 GB) — incelenip silinebilir
> 2. `~/.cache/` (3 GB) — güvenle silinebilir
>
> Devam edeyim mi?
```

### ✅ Katı Format Kuralı
> "Her cevabını şu yapıyla bitir:
> ```
> ---
> **Yapılan:** ...
> **Sonraki adım:** ...
> ```"

LLM'e exact format örneği = tutarlı çıktı.

### ✅ Tool Self-Awareness
> "Sana şu araçlar verildi: `read_file`, `write_file`, `git_commit`. Kullanıcı 'commit at' dediğinde **gerçekten** `git_commit` çağır; 'AI'yim, yapamam' deme."

UmtalAgent'ın `agent_loop.py`'sı zaten bu uyarıyı default olarak ekler ama soul'da güçlendirmek faydalı.

---

## 5. Çoklu-Dil Desteği

```markdown
## 4. Çıktı Stili
- Kullanıcı **Türkçe** yazarsa: Türkçe cevapla
- Kullanıcı **İngilizce** yazarsa: İngilizce cevapla
- Kullanıcı **dil değiştirirse**: hemen uyum sağla
- Kod identifier'ları **her zaman İngilizce**
```

---

## 6. Soul Versionlama (Sprint F.5)

UmtalAgent her soul değişikliğini otomatik olarak `prompt_versions` tablosuna kaydeder. Bu sayede:
- Eski versiyona rollback
- A/B test (Sprint F.6)
- Hangi soul daha iyi sonuç veriyor metriği

> Ajan ayar paneli → "Geçmiş Soul Versiyonları" sekmesi (UI ileride)

---

## 7. Soul'u Test Etmek

Yeni soul yazdıktan sonra bu 5 senaryoyu test et:

| # | Senaryo | Beklenen |
|---|---|---|
| 1 | Selam ver | Soul'a uygun açılış |
| 2 | Konu dışı soru ("hava nasıl?" ama sen kod uzmanısın) | Yumuşakça konuya yönlendir |
| 3 | Çelişkili istek (önce yap, sonra "iptal et") | Net kararla geri al |
| 4 | Uzun ve karmaşık görev | Plan-driven mod tetiklenir mi? |
| 5 | Hata oluşturulan tool çağrısı | Soul'un "Yapma!" listesini ihlal etmiyor mu? |

---

## 8. Hazır Şablonlar

UmtalAgent ile gelen 12 soul'a inceleyebilirsin:
- [`developer.md`](../backend/agents/souls/developer.md:1)
- [`researcher.md`](../backend/agents/souls/researcher.md:1)
- [`writer.md`](../backend/agents/souls/writer.md:1)
- [`coordinator.md`](../backend/agents/souls/coordinator.md:1) — multi-agent yönlendirici
- ... ([`backend/agents/souls/`](../backend/agents/souls/))

Yeni soul oluştur:
1. UI'da: **Yeni Ajan → Davranış adımı → "Bu prompt'u soul olarak kaydet"**
2. Veya backend: `POST /api/agents/souls` body: `{name, content, overwrite}`

---

## 9. İpucu Listesi

- 🎯 **Persona** ver (sadece "asistan" değil)
- 📏 **Sınırlar koy** ("Yapma!" listesi şart)
- 🧪 **Örnek diyalog** ekle (1-2 turn)
- 🛠️ **Tool farkındalığı** ver (hangi tool'lar var, ne için kullanır)
- 📐 **Çıktı formatını** ekran (markdown/JSON/list)
- 🌐 **Dil davranışı** netleştir
- ⏱️ **Uzunluk normu** belirle ("max 200 kelime" / "kısa ve öz")
- 🔁 **Hata davranışı**: tool fail olunca ne yap?