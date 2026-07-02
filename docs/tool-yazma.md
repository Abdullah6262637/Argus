# 🔧 Yeni Tool Eklemek

> **Hedef:** 30 dakikada kendi tool'unu yazıp ajanlara sunmak.

UmtalAgent'da **tool** = LLM'in `function calling` ile çağırdığı bir Python fonksiyonudur. Her tool:
- Benzersiz bir `name`,
- LLM'e gösterilecek `description`,
- JSON Schema `parameters`,
- Bir `permission` (file_system / terminal_cmd / web_search / system_admin / none),
- `async def execute(args, context) -> ToolResult`

tanımlar.

---

## 1. Anatomik Örnek: `weather_tool`

### Adım 1 — Yeni dosya: [`backend/app/services/tools/weather_tool.py`](../backend/app/services/tools/weather_tool.py:1)

```python
"""Weather tool — wttr.in API'sini kullanir, API key gerekmez."""
from __future__ import annotations

from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult


class WeatherTool(BaseTool):
    name = "weather_lookup"
    description = (
        "Bir şehir için güncel hava durumunu döner (sıcaklık, durum, nem, rüzgar). "
        "Türkçe sonuç verir."
    )
    permission = "web_search"  # internet erişimi gerekiyor
    parameters = {
        "type": "object",
        "properties": {
            "city": {
                "type": "string",
                "description": "Şehir adı (örn. 'Istanbul', 'London')"},
            "units": {
                "type": "string",
                "enum": ["metric", "imperial"],
                "default": "metric"}},
        "required": ["city"]}

    async def execute(
        self,
        args: Dict[str, Any],
        context: ToolContext,
    ) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        city = (args.get("city") or "").strip()
        if not city:
            return ToolResult(ok=False, error="city bos olamaz")
        units = "m" if args.get("units", "metric") == "metric" else "u"

        url = f"https://wttr.in/{city}?format=j1&{units}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            return ToolResult(ok=False, error=f"hava durumu alınamadı: {exc}")

        current = data.get("current_condition", [{}])[0]
        temp = current.get("temp_C") if units == "m" else current.get("temp_F")
        desc = (current.get("lang_tr", [{}])[0].get("value")
                or current.get("weatherDesc", [{}])[0].get("value", ""))
        humidity = current.get("humidity")
        wind = current.get("windspeedKmph")

        output = (
            f"📍 {city}\n"
            f"🌡️ Sıcaklık: {temp}°{'C' if units == 'm' else 'F'}\n"
            f"☁️ Durum: {desc}\n"
            f"💧 Nem: %{humidity}\n"
            f"💨 Rüzgar: {wind} km/h"
        )
        return ToolResult(
            ok=True,
            output=output,
            data={"city": city, "temp": temp, "description": desc},
        )
```

### Adım 2 — Registry'ye Kaydet

[`backend/app/services/tools/registry.py`](../backend/app/services/tools/registry.py:1):

```python
from app.services.tools.weather_tool import WeatherTool
# ...
class ToolRegistry:
    def _register_defaults(self) -> None:
        defaults: List[BaseTool] = [
            # ... mevcut tool'lar
            WeatherTool(),  # ← yeni
        ]
```

### Adım 3 — Test Yaz

[`backend/tests/test_weather_tool.py`](../backend/tests/test_weather_tool.py:1):

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.services.tools.weather_tool import WeatherTool
from app.services.tools.base import ToolContext


@pytest.mark.asyncio
async def test_weather_empty_city():
    result = await WeatherTool().execute({"city": ""}, ToolContext("t", "T"))
    assert not result.ok


@pytest.mark.asyncio
async def test_weather_schema():
    t = WeatherTool()
    schema = t.to_openai_schema()
    assert schema["function"]["name"] == "weather_lookup"
    assert "city" in schema["function"]["parameters"]["properties"]
```

### Adım 4 — Doğrula

```bash
# Backend yeniden başlat
cd frontend && npm run electron:dev

# Veya pytest
cd backend && pytest tests/test_weather_tool.py -v
```

UI'da **Yeni Ajan → Yetkiler** adımında "Web Erişimi" preset'i seçilmiş bir ajana sor:
> "Istanbul'un hava durumu nedir?"

Tool otomatik çağrılır ve cevap döner.

---

## 2. Permission Seçimi

| Permission | Ne zaman? | Örnek |
|---|---|---|
| `none` | Saf hesaplama / format dönüştürme | `evaluate_math`, `regex_match` |
| `file_system` | Dosya okuma/yazma | `read_file`, `pdf_merge` |
| `terminal_cmd` | Subprocess / kabuk komutu | `run_command`, `git_status` |
| `web_search` | Internet erişimi | `web_search`, `weather_lookup` |
| `system_admin` | OS-level kontrol (klavye/fare/güç) | `screenshot`, `shutdown` |

Yanlış permission seçimi LLM'e tool'un **gözükmemesine** sebep olur (kullanıcı izin vermediyse).

---

## 3. HITL (Yüksek Risk) İşaretleme

Tehlikeli tool'lar için iki katman:

### a) `requires_confirmation = True` (BaseTool field)

```python
class DockerRunTool(BaseTool):
    name = "docker_run"
    requires_confirmation = True  # ← UI'da banner çıksın
```

### b) `HIGH_RISK_TOOLS` set'ine ekle

[`backend/app/services/approval_service.py`](../backend/app/services/approval_service.py:1):

```python
HIGH_RISK_TOOLS = {
    # ... mevcut
    "weather_lookup",  # demo amaçlı; gerçekte risk yok
}
```

→ Otomatik HITL onay flow'u devreye girer.

---

## 4. JSON Schema İpuçları

### Enum

```python
"units": {"type": "string", "enum": ["metric", "imperial"]}
```

### Default

```python
"max_results": {"type": "integer", "default": 5, "minimum": 1, "maximum": 20}
```

### Array

```python
"tags": {
    "type": "array",
    "items": {"type": "string"},
    "minItems": 1}
```

### Nested object

```python
"options": {
    "type": "object",
    "properties": {
        "verbose": {"type": "boolean", "default": false}}}
```

### Description

LLM **description**'ı çok dikkatli okur. Hem `tool description` hem her parametrenin `description`'ını net yaz.

❌ "URL alır"
✅ "İndirilecek dosyanın HTTP/HTTPS URL'si (max 100 MB)"

---

## 5. ToolResult — Sonuç Formatı

```python
return ToolResult(
    ok=True,                             # bool — başarılı mı?
    output="Kısa string özet (LLM'e)",   # max 4000 char öneri
    error=None,                          # ok=False ise dolu olmalı
    data={"foo": "bar"},                 # opsiyonel — UI metadata
)
```

`output`:
- LLM'e **bu string** geri döner; uzun olursa otomatik kırpılır (`to_llm_string()`)
- **Türkçe** ve **özet** yaz; ham JSON dump etme

`data`:
- Frontend `tool_call.data` ile UI'da görünür (örn. ekran görüntüsü, dosya yolu)

---

## 6. Async + Threadpool

I/O-bound: `httpx`, `aiosqlite`, `asyncio.create_subprocess_exec` ✅

CPU-bound (büyük string parsing, image processing):
```python
import asyncio
result = await asyncio.get_event_loop().run_in_executor(
    None, sync_heavy_function, args,
)
```

---

## 7. Hata Yakalama

```python
try:
    # iş
except SpecificError as exc:
    return ToolResult(ok=False, error=f"X yapılamadı: {exc}")
except Exception as exc:
    logger.exception("Beklenmedik hata")
    return ToolResult(ok=False, error=f"sistem hatası: {exc}")
```

**Asla** ToolResult döndürmeden raise etme — Tool registry catch eder ama UX kötüleşir.

---

## 8. Best Practices

✅ **Yapılması gerekenler:**
- Description'da örnek kullanım ver
- Default değerler net olsun
- Kısa, sadece o işi yapan tool'lar
- `data` ile structured output ver (UI'a yararlı)
- Hata mesajları aksiyon öneren olsun ("X paketi yüklü değil. pip install X")

❌ **Yapılmaması gerekenler:**
- Tek bir tool'da 5+ farklı iş yapma (ayır)
- LLM'e ham stack trace dök (özetle)
- Permission'ı `none` yap, sonra dosyaya yaz (security ihlali)
- Sync I/O (HTTP requests) kullan — agent_loop bloklanır

---

## 9. İleri Konular

### Tool Composition (Macro)

Bir tool başka tool'ları çağırabilir:

```python
async def execute(self, args, context):
    sub_result = await tool_registry.execute(
        "read_file",
        {"path": args["path"]},
        perms=AgentPermissions(file_system=True, ...),
        context=context,
    )
    # işle...
```

### Streaming

Şu an tool sonucu tek seferde döner. İleride streaming için `AsyncIterator[bytes]` desteği planlanıyor (Sprint H+).

---

## 10. Soru / Yardım

- Sorularını [GitHub Discussions](https://github.com/umtalagent/umtalagent/discussions)
- Bug için [Issues](https://github.com/umtalagent/umtalagent/issues)
- Kod örneği için [`backend/app/services/tools/`](../backend/app/services/tools/) altındaki 16 dosyaya bak