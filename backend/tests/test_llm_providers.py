"""Unit tests for new ultra-high speed LLM Providers and Factory mappings."""
import pytest
from app.services.llm.factory import get_provider, _OPENAI_COMPATIBLE_PROVIDERS
from app.schemas.agent import ProviderName, ModelsCatalogOut
from app.routers.agents import get_models_catalog


def test_ultra_speed_providers_registered_in_factory():
    """Yeni ultra hızlı sağlayıcıların factory kataloğunda tanımlı olduğunu doğrular."""
    new_providers = ["sambanova", "cerebras", "fireworks", "together"]
    
    for provider in new_providers:
        assert provider in _OPENAI_COMPATIBLE_PROVIDERS
        info = _OPENAI_COMPATIBLE_PROVIDERS[provider]
        assert "base_url" in info
        assert "env_key" in info
        assert info["base_url"].startswith("http")


def test_factory_instantiates_openai_compatible_provider():
    """Factory'nin yeni sağlayıcılar için OpenAIProvider ürettiğini doğrular."""
    for p in ("sambanova", "cerebras", "fireworks", "together"):
        provider_inst = get_provider(
            provider_name=p,
            model="test-model",
            api_key=f"{p}_test_key_12345"
        )
        assert provider_inst is not None
        assert provider_inst.provider_name == p
        assert provider_inst.name == p
        assert provider_inst.model == "test-model"


def test_models_catalog_contains_new_providers():
    """Model kataloğunun yeni sağlayıcı modellerini içerdiğini doğrular."""
    from app.services.llm.models_catalog import MODELS_BY_PROVIDER
    
    for p in ("sambanova", "cerebras", "fireworks", "together"):
        assert p in MODELS_BY_PROVIDER
        models = MODELS_BY_PROVIDER[p]
        assert len(models) > 0
        assert "id" in models[0]


@pytest.mark.asyncio
async def test_get_models_catalog_router():
    """Router'ın ModelsCatalogOut içinde yeni sağlayıcıları döndürdüğünü doğrular."""
    catalog: ModelsCatalogOut = await get_models_catalog()
    assert len(catalog.sambanova) > 0
    assert len(catalog.cerebras) > 0
    assert len(catalog.fireworks) > 0
    assert len(catalog.together) > 0

