# 04 — LLM Sağlayıcıları ve Model Yapılandırması

## Desteklenen Sağlayıcılar

Argus, tek bir birleşik factory katmanı üzerinden 8+ LLM sağlayıcısını destekler. Tüm sağlayıcılar aynı arayüzü kullanır; birinden diğerine geçmek sadece birkaç tık gerektirir.

---

## OpenAI

**Ortam değişkeni:** `OPENAI_API_KEY`  
**API Anahtarı Format:** `sk-...`  
**Dokümantasyon:** https://platform.openai.com/docs

### Modeller

| Model | Bağlam | Güçlü Yanı |
|---|---|---|
| `gpt-4o` | 128K | Genel amaçlı, görsel anlama |
| `gpt-4o-mini` | 128K | Hız + maliyet dengesi |
| `o1` | 200K | Derin muhakeme (reasoning) |
| `o3` | 200K | Gelişmiş çok adımlı problem çözme |
| `gpt-4-turbo` | 128K | Uzun bağlam, çok yönlü |
| `gpt-3.5-turbo` | 16K | Hızlı, ekonomik |

### Yapılandırma

```env
OPENAI_API_KEY=sk-proj-abc123...
RATE_LIMIT_OPENAI_RPM=60
RATE_LIMIT_OPENAI_TPM=200000
```

---

## Anthropic

**Ortam değişkeni:** `ANTHROPIC_API_KEY`  
**API Anahtarı Format:** `sk-ant-...`  
**Dokümantasyon:** https://docs.anthropic.com

### Modeller

| Model | Bağlam | Güçlü Yanı |
|---|---|---|
| `claude-3-5-sonnet-20241022` | 200K | En iyi genel model |
| `claude-3-5-haiku-20241022` | 200K | Hız odaklı |
| `claude-3-opus-20240229` | 200K | Karmaşık analiz |
| `claude-3-sonnet-20240229` | 200K | Denge |

### Yapılandırma

```env
ANTHROPIC_API_KEY=sk-ant-api03-abc123...
RATE_LIMIT_ANTHROPIC_RPM=50
RATE_LIMIT_ANTHROPIC_TPM=100000
```

---

## Google Gemini

**Ortam değişkeni:** `GEMINI_API_KEY`  
**API Anahtarı Format:** `AIza...`  
**Dokümantasyon:** https://ai.google.dev

### Modeller

| Model | Bağlam | Güçlü Yanı |
|---|---|---|
| `gemini-2.5-pro` | 1M | Çok büyük bağlam, çok modal |
| `gemini-2.5-flash` | 1M | Hızlı, 1M bağlam |
| `gemini-1.5-pro` | 2M | En büyük bağlam |
| `gemini-1.5-flash` | 1M | Ekonomik, hızlı |

### Yapılandırma

```env
GEMINI_API_KEY=AIzaSy...
```

---

## OpenRouter

**Ortam değişkeni:** `OPENROUTER_API_KEY`  
**API Anahtarı Format:** `sk-or-...`  
**Dokümantasyon:** https://openrouter.ai/docs

OpenRouter, tek bir API endpoint üzerinden 100+ modele erişim sağlar. Argus'ta sağlayıcı olarak `openrouter` seçildiğinde herhangi bir OpenRouter model kimliği girilebilir:

```
openai/gpt-4o
anthropic/claude-3.5-sonnet
google/gemini-2.5-pro
meta-llama/llama-3.3-70b-instruct
mistralai/mixtral-8x7b-instruct
deepseek/deepseek-r1
```

### Yapılandırma

```env
OPENROUTER_API_KEY=sk-or-v1-abc123...
```

---

## Groq

**Ortam değişkeni:** `GROQ_API_KEY`  
**Dokümantasyon:** https://console.groq.com/docs

Groq, özel LPU (Language Processing Unit) donanımı sayesinde diğer sağlayıcılara kıyasla 5-10x daha hızlı çıkarım sunar.

### Modeller

| Model | Token/s | Güçlü Yanı |
|---|---|---|
| `llama-3.3-70b-versatile` | ~700 | Genel, hızlı |
| `llama-3.1-8b-instant` | ~1800 | Ultra hızlı |
| `mixtral-8x7b-32768` | ~500 | Uzun bağlam |
| `gemma2-9b-it` | ~900 | Verimli |

### Yapılandırma

```env
GROQ_API_KEY=gsk_abc123...
```

---

## DeepSeek

**Ortam değişkeni:** `DEEPSEEK_API_KEY`  
**Dokümantasyon:** https://platform.deepseek.com/docs

### Modeller

| Model | Güçlü Yanı |
|---|---|
| `deepseek-chat` (v3) | Kod, matematik, genel |
| `deepseek-reasoner` (r1) | Çok adımlı muhakeme, matematik |

### Yapılandırma

```env
DEEPSEEK_API_KEY=sk-abc123...
```

---

## Mistral

**Ortam değişkeni:** `MISTRAL_API_KEY`  
**Dokümantasyon:** https://docs.mistral.ai

### Modeller

| Model | Güçlü Yanı |
|---|---|
| `mistral-large-latest` | Genel amaçlı |
| `mistral-medium-latest` | Denge |
| `codestral-latest` | Kod üretimi |
| `mistral-7b-instruct` | Hafif, hızlı |

### Yapılandırma

```env
MISTRAL_API_KEY=abc123...
```

---

## xAI Grok

**Ortam değişkeni:** `XAI_API_KEY`  
**Dokümantasyon:** https://docs.x.ai

### Modeller

| Model | Güçlü Yanı |
|---|---|
| `grok-4` | En güncel, güçlü |
| `grok-2` | Dengeli |
| `grok-beta` | Beta özellikler |

### Yapılandırma

```env
XAI_API_KEY=xai-abc123...
```

---

## Yerel Modeller (Ollama)

**Kurulum:** https://ollama.com  
**Sağlayıcı ID:** `local`  
**Base URL:** `http://localhost:11434/v1`

Ollama ile yerel olarak modeller çalıştırabilirsiniz. İnternet bağlantısı gerektirmez.

### Popüler Modeller

```bash
# Model indirme
ollama pull llama3.3
ollama pull qwen2.5:14b
ollama pull deepseek-r1:14b
ollama pull phi4
ollama pull mistral:7b
ollama pull codellama:13b

# Çalıştır
ollama serve
```

### Argus'ta Yapılandırma

| Alan | Değer |
|---|---|
| Sağlayıcı | `local` |
| Base URL | `http://localhost:11434/v1` |
| Model | `llama3.3` (veya indirdiğiniz model) |
| API Anahtarı | `ollama` (boş bırakın veya herhangi bir değer) |

---

## LM Studio

**Kurulum:** https://lmstudio.ai  
**Sağlayıcı ID:** `local`  
**Base URL:** `http://localhost:1234/v1`

LM Studio, GGUF formatındaki modelleri indirip çalıştırmanıza imkan tanır.

1. LM Studio'yu açın
2. İstediğiniz modeli indirin
3. "Local Server" sekmesinden sunucuyu başlatın
4. Argus'ta Base URL: `http://localhost:1234/v1` girin

---

## Bağlantı Test Sistemi

Her model yapılandırmasında "**Bağlantıyı Test Et**" butonu şu adımları çalıştırır:

```
1. API anahtar format doğrulama
   ├─ OpenAI: sk- veya sk-proj- prefix kontrolü
   ├─ Anthropic: sk-ant- prefix kontrolü
   └─ Diğerleri: boş olmama kontrolü

2. HTTP istemcisi oluşturma
   ├─ SSL sertifika doğrulama (opsiyonel)
   └─ Timeout: 30 saniye

3. Gerçek istek gönderme
   ├─ Mesaj: "Merhaba, sadece 'ok' yaz."
   ├─ max_tokens: 32
   └─ temperature: 0

4. Yanıt analizi
   ├─ Yanıt süresi (ms)
   ├─ Dönen model adı
   └─ Örnek yanıt önizlemesi
```

**Sonuç durumları:**
- ✅ **Başarılı** — yeşil, latency ms gösterilir
- ⚠️ **Uyarı** — API anahtarı formatı geçersiz
- ❌ **Başarısız** — bağlantı hatası, kırmızı hata mesajı

---

## Rate Limiting

Argus, LLM API'lerini aşırı kullanımdan korumak için dahili rate limiting uygular:

```env
RATE_LIMIT_OPENAI_RPM=60      # dakikada istek sayısı
RATE_LIMIT_OPENAI_TPM=200000  # dakikada token sayısı
RATE_LIMIT_ANTHROPIC_RPM=50
RATE_LIMIT_ANTHROPIC_TPM=100000
```

Limit aşılırsa backend otomatik olarak bekler ve yeniden dener.

---

## Yeni Sağlayıcı Ekleme (Geliştirici)

Detaylar için → [12-gelistirici-rehberi.md](12-gelistirici-rehberi.md)

Kısaca:
1. `backend/app/services/llm/` altında `mysağlayıcı_provider.py` oluşturun
2. `BaseLLMProvider`'ı extend edin
3. `factory.py`'daki `get_provider()` fonksiyonuna ekleyin
4. `models_catalog.py`'a model listesini ekleyin
