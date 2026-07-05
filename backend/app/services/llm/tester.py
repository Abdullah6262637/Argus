"""LLM bag testi - SDK'larin ustunde kendi hafif HTTP testi.

Onemli:
- SDK cache'inden etkilenmez
- HTML response'lari (404 sayfalari gibi) akilli algilar
- Provider-base_url uyumsuzlugunu tespit eder (OpenAI path'i Anthropic'e, vb.)
- Her test bagimsiz - her cagrida taze httpx client
"""
from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class ConnectionTestResult:
    ok: bool
    provider: str
    model: str
    latency_ms: int = 0
    message: str = ""
    sample_response: Optional[str] = None


# ============================================================
# Yardimcilar
# ============================================================

def _normalize_url(url: str) -> str:
    """Url'den trailing slash'lari temizle."""
    return url.rstrip("/")


def _is_html(text: str) -> bool:
    head = (text or "").lstrip()[:100].lower()
    return head.startswith("<!doctype") or head.startswith("<html") or "<title" in head


def _extract_html_message(html: str) -> str:
    """HTML hata sayfasindan anlamli bir satir cek."""
    import re
    # <pre>...</pre> veya <h1>...</h1> gibi alanlarda metin ara
    for tag in ("pre", "h1", "title", "p"):
        m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", html, re.IGNORECASE | re.DOTALL)
        if m:
            txt = re.sub(r"<[^>]+>", "", m.group(1)).strip()
            if txt:
                return txt[:200]
    # Son care: tum HTML'den tag'leri cikar
    clean = re.sub(r"<[^>]+>", " ", html).strip()
    return clean[:200] if clean else "HTML yaniti"


def _is_placeholder_key(k: Optional[str]) -> bool:
    if not k:
        return True
    low = k.lower()
    return "xxxxxxxxxx" in low or "placeholder" in low or "your-key" in low


def _guess_provider_mismatch(provider: str, base_url: Optional[str]) -> Optional[str]:
    """Provider ve base_url uyumsuzlugunu tespit etmeye calisir."""
    if not base_url:
        return None
    low = base_url.lower()
    p = provider.lower()
    # Anthropic saglayici ama URL OpenAI tarzi /v1 ile bitiyor (ve muhtemelen chat/completions endpoint'i)
    if p == "anthropic" and "/v1" in low and "anthropic" not in low:
        return (
            "Provider 'Anthropic' secili ama Base URL OpenAI-uyumlu bir endpoint'e "
            "benziyor (.../v1 ile bitiyor). Bu endpoint /v1/chat/completions kullaniyorsa "
            "provider olarak 'OpenAI (ve uyumlu)' seciniz."
        )
    return None


# ============================================================
# Ana fonksiyon
# ============================================================

async def test_connection(
    provider: str,
    model: str,
    *,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout_ms: int = 20_000,
    verify_ssl: bool = True,
) -> ConnectionTestResult:
    start = time.perf_counter()
    provider_low = provider.lower()

    # 1) API anahtari kontrolu
    settings = get_settings()
    env_keys = {
        "openai": settings.openai_api_key,
        "anthropic": settings.anthropic_api_key,
        "gemini": os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"),
        "googleaistudio": os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"),
        "openrouter": os.environ.get("OPENROUTER_API_KEY"),
        "groq": os.environ.get("GROQ_API_KEY"),
        "deepseek": os.environ.get("DEEPSEEK_API_KEY"),
        "mistral": os.environ.get("MISTRAL_API_KEY"),
        "xai": os.environ.get("XAI_API_KEY"),
    }

    env_key = env_keys.get(provider_low)
    if _is_placeholder_key(env_key):
        env_key = None

    effective_key = api_key or env_key
    is_local_provider = provider_low in ("local", "ollama")

    if not effective_key and not is_local_provider:
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=0,
            message=(
                "API anahtari girilmemis. Formda 'API Anahtari' alanina gecerli "
                "bir key yaziniz (veya backend .env'de tanimlayin)."
            ),
        )

    # API Key Format Dogrulamalari
    if provider_low == "openai" and effective_key and not effective_key.startswith("sk-") and not is_local_provider:
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=0,
            message="Hatali OpenAI API anahtari formati. OpenAI anahtarlari genellikle 'sk-' ile baslar."
        )
    if provider_low == "anthropic" and effective_key and not effective_key.startswith("sk-ant-"):
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=0,
            message="Hatali Anthropic API anahtari formati. Anthropic anahtarlari genellikle 'sk-ant-' ile baslar."
        )

    # 2) Provider-base_url uyumsuzluk ikazi
    mismatch = _guess_provider_mismatch(provider, base_url)
    if mismatch:
        # Yine de test edecegiz ama mesajla uyaracagiz
        pass

    try:
        openai_compatibles = {
            "openai": base_url or "https://api.openai.com/v1",
            "openrouter": base_url or "https://openrouter.ai/api/v1",
            "groq": base_url or "https://api.groq.com/openai/v1",
            "deepseek": base_url or "https://api.deepseek.com/v1",
            "mistral": base_url or "https://api.mistral.ai/v1",
            "xai": base_url or "https://api.x.ai/v1",
            "local": base_url or ("http://127.0.0.1:1234/v1" if "lmstudio" in model.lower() else "http://127.0.0.1:11434/v1"),
            "ollama": base_url or "http://127.0.0.1:11434/v1",
        }

        if provider_low in openai_compatibles:
            effective_base_url = openai_compatibles[provider_low]
            test_key = effective_key or "local"
            return await _test_openai(
                model=model, api_key=test_key,
                base_url=effective_base_url, timeout_ms=timeout_ms, start=start,
                mismatch_warning=mismatch, verify_ssl=verify_ssl,
            )
        elif provider_low == "anthropic":
            return await _test_anthropic(
                model=model, api_key=effective_key,
                base_url=base_url, timeout_ms=timeout_ms, start=start,
                mismatch_warning=mismatch, verify_ssl=verify_ssl,
            )
        elif provider_low in ("gemini", "googleaistudio"):
            return await _test_gemini(
                model=model, api_key=effective_key or "",
                timeout_ms=timeout_ms, start=start, verify_ssl=verify_ssl,
            )
        else:
            return ConnectionTestResult(
                ok=False, provider=provider, model=model, latency_ms=0,
                message=f"Desteklenmeyen saglayici: {provider}",
            )
    except httpx.ConnectError as exc:
        msg = f"Baglanti kurulamadi: {exc}. Base URL dogru mu? Internet baglantiniz acik mi?"
        if provider_low in ("local", "ollama"):
            msg += " Yerel servisinizin (Ollama/LM Studio) arka planda acik oldugundan ve 'ollama serve' komutunun calistigindan emin olun."
        return ConnectionTestResult(
            ok=False, provider=provider, model=model,
            latency_ms=int((time.perf_counter() - start) * 1000),
            message=msg,
        )
    except httpx.ReadTimeout:
        return ConnectionTestResult(
            ok=False, provider=provider, model=model,
            latency_ms=int((time.perf_counter() - start) * 1000),
            message="Zaman asimi - sunucu yanit vermedi.",
        )
    except Exception as exc:
        logger.exception("test_connection beklenmeyen hata")
        return ConnectionTestResult(
            ok=False, provider=provider, model=model,
            latency_ms=int((time.perf_counter() - start) * 1000),
            message=f"Beklenmeyen hata: {type(exc).__name__}: {exc}",
        )


# ============================================================
# OpenAI (ve uyumlu: OpenRouter, frostai, groq, vb.)
# ============================================================

async def _test_openai(
    *,
    model: str,
    api_key: str,
    base_url: Optional[str],
    timeout_ms: int,
    start: float,
    mismatch_warning: Optional[str],
    verify_ssl: bool = True,
) -> ConnectionTestResult:
    url_root = _normalize_url(base_url) if base_url else "https://api.openai.com/v1"
    url = f"{url_root}/chat/completions"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Cevap olarak sadece: merhaba"}],
        "max_tokens": 32,
        "temperature": 0.0,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout_ms / 1000, verify=verify_ssl) as client:
        resp = await client.post(url, json=payload, headers=headers)
    elapsed = int((time.perf_counter() - start) * 1000)

    return _parse_openai_response(
        resp=resp, elapsed=elapsed, provider="openai", model=model, url=url,
        mismatch_warning=mismatch_warning,
    )


def _parse_openai_response(
    *,
    resp: httpx.Response,
    elapsed: int,
    provider: str,
    model: str,
    url: str,
    mismatch_warning: Optional[str],
) -> ConnectionTestResult:
    body = resp.text or ""

    # HTML yanitlari (404 sayfasi vb.)
    if _is_html(body):
        msg = _extract_html_message(body)
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=elapsed,
            message=(
                f"Sunucu JSON yerine HTML dondu ({resp.status_code}): {msg}. "
                f"Endpoint dogru mu? Denenen URL: {url}"
            ),
        )

    # JSON parse
    data = None
    try:
        data = resp.json()
    except Exception:
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=elapsed,
            message=f"Yanit JSON degil (HTTP {resp.status_code}): {body[:200]}",
        )

    if resp.status_code >= 400:
        err_msg = _extract_error_from_json(data) or f"HTTP {resp.status_code}"
        hint = _status_hint(resp.status_code, provider)
        full = f"{err_msg}{(' · ' + hint) if hint else ''}"
        if mismatch_warning:
            full = f"{mismatch_warning}\n\n{full}"
        return ConnectionTestResult(
            ok=False, provider=provider, model=model, latency_ms=elapsed, message=full,
        )

    # Basarili - icerigi cek
    try:
        content = data["choices"][0]["message"]["content"]
    except Exception:
        content = json.dumps(data)[:200]

    return ConnectionTestResult(
        ok=True, provider=provider, model=data.get("model", model),
        latency_ms=elapsed,
        message=f"Baglanti basarili — {resp.status_code} OK ({len(body)} byte).",
        sample_response=(content or "")[:200],
    )


# ============================================================
# Anthropic
# ============================================================

async def _test_anthropic(
    *,
    model: str,
    api_key: str,
    base_url: Optional[str],
    timeout_ms: int,
    start: float,
    mismatch_warning: Optional[str],
    verify_ssl: bool = True,
) -> ConnectionTestResult:
    url_root = _normalize_url(base_url) if base_url else "https://api.anthropic.com"
    # Anthropic resmi: POST /v1/messages
    # Eger kullanici zaten ".../v1" seklinde girdiyse cift /v1/v1 olmasin diye kontrol
    if url_root.endswith("/v1"):
        url = f"{url_root}/messages"
    else:
        url = f"{url_root}/v1/messages"

    payload = {
        "model": model,
        "max_tokens": 32,
        "temperature": 0.0,
        "messages": [{"role": "user", "content": "Cevap olarak sadece: merhaba"}],
    }
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=timeout_ms / 1000, verify=verify_ssl) as client:
        resp = await client.post(url, json=payload, headers=headers)
    elapsed = int((time.perf_counter() - start) * 1000)

    body = resp.text or ""

    if _is_html(body):
        msg = _extract_html_message(body)
        return ConnectionTestResult(
            ok=False, provider="anthropic", model=model, latency_ms=elapsed,
            message=(
                f"Sunucu JSON yerine HTML dondu ({resp.status_code}): {msg}. "
                f"Denenen URL: {url}. "
                "Muhtemelen bu base URL Anthropic uyumlu degil — OpenAI uyumlu bir endpoint "
                "kullaniyorsan provider olarak 'OpenAI (ve uyumlu)' sec."
            ),
        )

    try:
        data = resp.json()
    except Exception:
        return ConnectionTestResult(
            ok=False, provider="anthropic", model=model, latency_ms=elapsed,
            message=f"Yanit JSON degil (HTTP {resp.status_code}): {body[:200]}",
        )

    if resp.status_code >= 400:
        err_msg = _extract_error_from_json(data) or f"HTTP {resp.status_code}"
        hint = _status_hint(resp.status_code, "anthropic")
        full = f"{err_msg}{(' · ' + hint) if hint else ''}"
        if mismatch_warning:
            full = f"{mismatch_warning}\n\n{full}"
        return ConnectionTestResult(
            ok=False, provider="anthropic", model=model, latency_ms=elapsed, message=full,
        )

    # content blok listesi -> metin
    try:
        blocks = data.get("content", [])
        texts = [b.get("text", "") for b in blocks if b.get("type") == "text"]
        content = "".join(texts) or json.dumps(data)[:200]
    except Exception:
        content = json.dumps(data)[:200]

    return ConnectionTestResult(
        ok=True, provider="anthropic", model=data.get("model", model),
        latency_ms=elapsed,
        message=f"Baglanti basarili — {resp.status_code} OK.",
        sample_response=(content or "")[:200],
    )


# ============================================================
# Ortak yardimcilar
# ============================================================

def _extract_error_from_json(data) -> Optional[str]:
    """OpenAI/Anthropic gibi {error: {message, type}} yapilarindan mesaj cek."""
    if not isinstance(data, dict):
        return None
    err = data.get("error")
    if isinstance(err, dict):
        msg = err.get("message") or err.get("code") or err.get("type")
        if msg:
            typ = err.get("type")
            return f"{msg}" + (f" [{typ}]" if typ and typ != msg else "")
    if isinstance(err, str):
        return err
    if isinstance(data.get("message"), str):
        return data["message"]
    if isinstance(data.get("detail"), str):
        return data["detail"]
    return None


def _status_hint(status: int, provider: str) -> Optional[str]:
    if status == 401:
        return "API anahtari gecersiz veya yetki yok"
    if status == 403:
        return "Bu kaynaga erisim yetkin yok"
    if status == 404:
        return f"Endpoint bulunamadi - base URL dogru mu? (provider: {provider})"
    if status == 429:
        return "Oran siniri (rate limit) asildi"
    if status == 500:
        return "Sunucu ic hatasi"
    if status == 502:
        return "Gateway hatasi (502) - proxy kaynak sunucuya erisemiyor"
    if status == 503:
        return "Servis gecici olarak kapali (503)"
    return None


async def _test_gemini(
    *,
    model: str,
    api_key: str,
    timeout_ms: int,
    start: float,
    verify_ssl: bool = True,
) -> ConnectionTestResult:
    gemini_model = model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{"text": "Cevap olarak sadece 'ok' de."}]
        }]
    }

    try:
        async with httpx.AsyncClient(timeout=timeout_ms / 1000, verify=verify_ssl) as client:
            resp = await client.post(url, json=payload)
        elapsed = int((time.perf_counter() - start) * 1000)

        if resp.status_code == 200:
            return ConnectionTestResult(
                ok=True, provider="gemini", model=model, latency_ms=elapsed,
                message="Baglanti basarili! Google Gemini API yanit verdi.",
            )
        else:
            error_msg = f"HTTP {resp.status_code}"
            try:
                err_json = resp.json()
                if "error" in err_json:
                    error_msg = err_json["error"].get("message", error_msg)
            except Exception:
                pass
            return ConnectionTestResult(
                ok=False, provider="gemini", model=model, latency_ms=elapsed,
                message=f"Gemini API hatasi: {error_msg}",
            )
    except Exception as exc:
        elapsed = int((time.perf_counter() - start) * 1000)
        return ConnectionTestResult(
            ok=False, provider="gemini", model=model, latency_ms=elapsed,
            message=f"Gemini API baglanti hatasi: {exc}",
        )