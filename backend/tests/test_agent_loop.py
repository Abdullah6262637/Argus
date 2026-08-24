import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.agent_loop import _build_system_prompt, _get_fallback_provider_info, _emit
from app.services.agent_manager import AgentDefinition
from app.config import get_settings


def test_build_system_prompt():
    agent = AgentDefinition(
        id="test-id",
        name="TestAgent",
        role="You are a test agent",
        system_prompt="Custom sys prompt.",
        provider="mock",
        model="mock-model",
    )
    tool_names = ["tool_a", "tool_b"]
    memory_context = "User likes testing."

    prompt = _build_system_prompt(agent, tool_names, memory_context)
    
    assert prompt is not None
    assert "Custom sys prompt." in prompt
    assert "Sen sistem araclarina" in prompt
    assert "tool_a, tool_b" in prompt
    assert "CEVAP STILI" in prompt
    assert "<memory>" in prompt
    assert "User likes testing." in prompt

    # Test without memory and tools
    prompt_no_tools = _build_system_prompt(agent, [], None)
    assert prompt_no_tools is not None
    assert "tool_a" not in prompt_no_tools
    assert "<memory>" not in prompt_no_tools


def test_get_fallback_provider_info():
    settings = get_settings()
    
    with patch.object(settings, 'gemini_api_key', 'test-key'):
        fallback = _get_fallback_provider_info("openai", "gpt-4")
        assert fallback is not None
        assert fallback[0] == "gemini"
        
        fallback_same = _get_fallback_provider_info("gemini", "gemini-1.5-flash")
        # Should fall back to something else if gemini is primary (if openrouter etc are set)
        
    with patch.object(settings, 'gemini_api_key', None), patch.object(settings, 'openrouter_api_key', 'test-key', create=True):
        fallback = _get_fallback_provider_info("openai", "gpt-4")
        assert fallback is not None
        assert fallback[0] == "openrouter"

    with patch.object(settings, 'gemini_api_key', None), \
         patch.object(settings, 'openrouter_api_key', None, create=True), \
         patch.object(settings, 'groq_api_key', None, create=True):
        fallback = _get_fallback_provider_info("openai", "gpt-4")
        assert fallback is not None
        assert fallback[0] == "ollama"


@pytest.mark.asyncio
async def test_emit():
    # 1. Async callback
    async_cb = AsyncMock()
    await _emit(async_cb, "test_event", {"data": 1})
    async_cb.assert_called_once_with("test_event", {"data": 1})

    # 2. Sync callback
    sync_cb = MagicMock()
    await _emit(sync_cb, "test_event", {"data": 2})
    sync_cb.assert_called_once_with("test_event", {"data": 2})

    # 3. None callback
    # Should not raise any error
    await _emit(None, "test_event", {"data": 3})
