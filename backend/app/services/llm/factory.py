"""LLM saglayici fabrikasi. Saglayici adina gore instance uretir."""
from __future__ import annotations

import os
from typing import Dict, Optional

from app.config import get_settings
from app.services.llm.base import BaseLLMProvider, LLMError

_cache: Dict[str, BaseLLMProvider] = {}


# Sprint 4.3: OpenAI-compatible provider'lar (varsayilan endpoint + env key adi)
_OPENAI_COMPATIBLE_PROVIDERS: Dict[str, Dict[str, str]] = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "env_key": "GROQ_API_KEY"},
    "mistral": {
        "base_url": "https://api.mistral.ai/v1",
        "env_key": "MISTRAL_API_KEY"},
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "env_key": "DEEPSEEK_API_KEY"},
    "xai": {
        "base_url": "https://api.x.ai/v1",
        "env_key": "XAI_API_KEY"},
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "env_key": "OPENROUTER_API_KEY"}}


def get_provider(
    provider_name: str,
    model: str,
    *,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> BaseLLMProvider:
    """
    Saglayici ismine, modele, (varsa) ozel api_key ve base_url'e gore instance uretir.
    Ayni parametreler icin cache uzerinden ayni instance'i doner.
    """
    provider_name = provider_name.lower()
    cache_key = f"{provider_name}:{model}:{api_key or '-'}:{base_url or '-'}"
    if cache_key in _cache:
        return _cache[cache_key]

    settings = get_settings()

    def _is_placeholder(k: Optional[str]) -> bool:
        if not k:
            return True
        low = k.lower()
        return "xxxxxxxxxx" in low or "placeholder" in low or "your-key" in low

    if provider_name == "openai":
        from app.services.llm.openai_provider import OpenAIProvider

        env_key = settings.openai_api_key
        effective_key = api_key if api_key else (env_key if not _is_placeholder(env_key) else None)
        provider: BaseLLMProvider = OpenAIProvider(
            api_key=effective_key, model=model, base_url=base_url
        )
    elif provider_name == "anthropic":
        from app.services.llm.anthropic_provider import AnthropicProvider

        env_key = settings.anthropic_api_key
        effective_key = api_key if api_key else (env_key if not _is_placeholder(env_key) else None)
        provider = AnthropicProvider(
            api_key=effective_key, model=model, base_url=base_url
        )
    elif provider_name == "local":
        from app.services.llm.openai_provider import OpenAIProvider

        effective_base_url = base_url
        if not effective_base_url:
            if "lmstudio" in model.lower():
                effective_base_url = "http://127.0.0.1:1234/v1"
            else:
                effective_base_url = "http://127.0.0.1:11434/v1"
        else:
            effective_base_url = effective_base_url.replace("localhost", "127.0.0.1")

        provider = OpenAIProvider(
            api_key="local", model=model, base_url=effective_base_url
        )
    elif provider_name == "ollama":
        # Sprint 4.2: Ollama (yerel, OpenAI-compatible)
        from app.services.llm.openai_provider import OpenAIProvider
        effective_base_url = base_url or os.environ.get("OLLAMA_BASE_URL") or "http://127.0.0.1:11434/v1"
        effective_base_url = effective_base_url.replace("localhost", "127.0.0.1")
        provider = OpenAIProvider(
            api_key=api_key or "ollama", model=model, base_url=effective_base_url
        )
    elif provider_name == "gemini":
        # Sprint 4.1: Google Gemini
        from app.services.llm.gemini_provider import GeminiProvider
        env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        effective_key = api_key if api_key else (env_key if not _is_placeholder(env_key) else None)
        provider = GeminiProvider(api_key=effective_key, model=model)
    elif provider_name in _OPENAI_COMPATIBLE_PROVIDERS:
        # Sprint 4.3: Groq / Mistral / DeepSeek / xAI / OpenRouter
        from app.services.llm.openai_provider import OpenAIProvider
        meta = _OPENAI_COMPATIBLE_PROVIDERS[provider_name]
        effective_base_url = base_url or meta["base_url"]
        env_key = os.environ.get(meta["env_key"])
        effective_key = api_key if api_key else (env_key if not _is_placeholder(env_key) else None)
        if not effective_key:
            raise LLMError(
                f"{provider_name} icin API key gerekli (.env: {meta['env_key']} veya ajan ayarlarinda)"
            )
        provider = OpenAIProvider(
            api_key=effective_key, model=model, base_url=effective_base_url
        )
    else:
        raise LLMError(f"Desteklenmeyen LLM saglayici: {provider_name}")

    _cache[cache_key] = provider
    return provider


async def close_all() -> None:
    """Uygulama kapanirken tum LLM istemcilerini kapat."""
    for provider in list(_cache.values()):
        try:
            await provider.close()
        except Exception:
            pass
    _cache.clear()