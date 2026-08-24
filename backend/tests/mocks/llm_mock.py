"""Test icin sahte LLM saglayicisi."""
from typing import Any, Dict, List, Optional
from app.services.llm.base import BaseLLMProvider, ChatMessage, LLMResponse, ToolCall

class MockProvider(BaseLLMProvider):
    """Onceden tanimlanmis yanitlar donen sahte LLM saglayicisi."""
    
    name: str = "mock"

    def __init__(self, responses: Optional[List[str]] = None, tool_calls: Optional[List[List[ToolCall]]] = None):
        super().__init__()
        self._responses = responses or ["Mock LLM yaniti"]
        self._tool_calls = tool_calls or []
        self._call_count = 0
        self.call_history: List[dict] = []
    
    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> LLMResponse:
        idx = min(self._call_count, len(self._responses) - 1)
        content = self._responses[idx]
        tc = self._tool_calls[idx] if idx < len(self._tool_calls) else []
        
        self.call_history.append({
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "tools": tools,
        })
        self._call_count += 1
        
        return LLMResponse(
            content=content,
            tool_calls=tc,
            provider="mock",
            model="mock-model",
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
            stop_reason="tool_use" if tc else "stop",
        )
