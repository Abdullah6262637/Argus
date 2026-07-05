"""Guncel LLM modelleri katalogu - UI'de dropdown onerilerinde kullanilir.

Buradaki liste sadece "oneri" niteligindedir; kullanici form'dan herhangi bir
model adi yazabilir (datalist). Gec-ileri uyumluluk icin genis tutuldu.
"""
from __future__ import annotations

from typing import Dict, List, TypedDict


class ModelInfo(TypedDict, total=False):
    id: str
    label: str
    description: str


# OpenAI - 2024-2026 arasi yayimlanan / beklenen modeller (yeni->eski)
OPENAI_MODELS: List[ModelInfo] = [
    {"id": "gpt-5", "label": "GPT-5", "description": "OpenAI amiral model"},
    {"id": "gpt-5-mini", "label": "GPT-5 mini", "description": "Hizli/ucuz GPT-5 varyanti"},
    {"id": "gpt-5-nano", "label": "GPT-5 nano", "description": "En hafif GPT-5"},
    {"id": "gpt-4.1", "label": "GPT-4.1", "description": "Uzun baglam, gelistirici odakli"},
    {"id": "gpt-4.1-mini", "label": "GPT-4.1 mini"},
    {"id": "gpt-4.1-nano", "label": "GPT-4.1 nano"},
    {"id": "gpt-4o", "label": "GPT-4o", "description": "Coklu modal"},
    {"id": "gpt-4o-mini", "label": "GPT-4o mini"},
    {"id": "gpt-4o-realtime-preview", "label": "GPT-4o Realtime (preview)"},
    {"id": "gpt-4-turbo", "label": "GPT-4 Turbo"},
    {"id": "gpt-4", "label": "GPT-4"},
    {"id": "gpt-3.5-turbo", "label": "GPT-3.5 Turbo"},
    # Reasoning modelleri
    {"id": "o3", "label": "o3", "description": "Reasoning (onlenemez dusunme)"},
    {"id": "o3-mini", "label": "o3-mini"},
    {"id": "o3-pro", "label": "o3-pro"},
    {"id": "o4-mini", "label": "o4-mini"},
    {"id": "o1", "label": "o1"},
    {"id": "o1-mini", "label": "o1-mini"},
    {"id": "o1-pro", "label": "o1-pro"},
    # Goruntu / ses
    {"id": "gpt-image-1", "label": "GPT Image 1"},
    {"id": "dall-e-3", "label": "DALL-E 3"},
    {"id": "whisper-1", "label": "Whisper-1 (STT)"},
    {"id": "tts-1", "label": "TTS-1"},
    {"id": "tts-1-hd", "label": "TTS-1 HD"}]

# Anthropic Claude - 3.x, 3.5, 3.7, 4, 4.5, 4.7 aileleri
ANTHROPIC_MODELS: List[ModelInfo] = [
    # 4.7 ailesi (yeni)
    {"id": "claude-opus-4-7", "label": "Claude Opus 4.7", "description": "Anthropic en yeni amiral"},
    {"id": "claude-sonnet-4-7", "label": "Claude Sonnet 4.7"},
    # 4.5 ailesi
    {"id": "claude-opus-4-5", "label": "Claude Opus 4.5"},
    {"id": "claude-sonnet-4-5", "label": "Claude Sonnet 4.5", "description": "Dengeli yuksek performans"},
    {"id": "claude-haiku-4-5", "label": "Claude Haiku 4.5", "description": "Hizli ve ucuz"},
    # 4 ailesi
    {"id": "claude-opus-4-1", "label": "Claude Opus 4.1"},
    {"id": "claude-opus-4-0", "label": "Claude Opus 4.0"},
    {"id": "claude-sonnet-4-0", "label": "Claude Sonnet 4.0"},
    # 3.7
    {"id": "claude-3-7-sonnet-latest", "label": "Claude 3.7 Sonnet"},
    # 3.5
    {"id": "claude-3-5-sonnet-latest", "label": "Claude 3.5 Sonnet (latest)"},
    {"id": "claude-3-5-sonnet-20241022", "label": "Claude 3.5 Sonnet (2024-10-22)"},
    {"id": "claude-3-5-haiku-latest", "label": "Claude 3.5 Haiku (latest)"},
    {"id": "claude-3-5-haiku-20241022", "label": "Claude 3.5 Haiku (2024-10-22)"},
    # 3
    {"id": "claude-3-opus-latest", "label": "Claude 3 Opus"},
    {"id": "claude-3-opus-20240229", "label": "Claude 3 Opus (2024-02-29)"},
    {"id": "claude-3-sonnet-20240229", "label": "Claude 3 Sonnet"},
    {"id": "claude-3-haiku-20240307", "label": "Claude 3 Haiku"}]


# Sprint 4: Yeni provider'lar icin model katalogu
GEMINI_MODELS: List[ModelInfo] = [
    {"id": "gemini-2.5-pro", "label": "Gemini 2.5 Pro"},
    {"id": "gemini-2.5-flash", "label": "Gemini 2.5 Flash"},
    {"id": "gemini-2.0-flash", "label": "Gemini 2.0 Flash"},
    {"id": "gemini-2.0-flash-lite", "label": "Gemini 2.0 Flash Lite"},
    {"id": "gemini-1.5-pro", "label": "Gemini 1.5 Pro"},
    {"id": "gemini-1.5-flash", "label": "Gemini 1.5 Flash"},
    {"id": "gemini-1.5-flash-8b", "label": "Gemini 1.5 Flash 8B"}]

OLLAMA_MODELS: List[ModelInfo] = [
    {"id": "llama3.2", "label": "Llama 3.2"},
    {"id": "llama3.2:1b", "label": "Llama 3.2 1B"},
    {"id": "llama3.1", "label": "Llama 3.1"},
    {"id": "llama3.1:70b", "label": "Llama 3.1 70B"},
    {"id": "qwen2.5", "label": "Qwen 2.5"},
    {"id": "qwen2.5-coder", "label": "Qwen 2.5 Coder"},
    {"id": "mistral", "label": "Mistral 7B"},
    {"id": "mixtral", "label": "Mixtral 8x7B"},
    {"id": "deepseek-r1", "label": "DeepSeek R1"},
    {"id": "phi3", "label": "Phi 3"},
    {"id": "gemma2", "label": "Gemma 2"},
    {"id": "codellama", "label": "Code Llama"}]

GROQ_MODELS: List[ModelInfo] = [
    {"id": "llama-3.3-70b-versatile", "label": "Llama 3.3 70B"},
    {"id": "llama-3.1-70b-versatile", "label": "Llama 3.1 70B"},
    {"id": "llama-3.1-8b-instant", "label": "Llama 3.1 8B (instant)"},
    {"id": "mixtral-8x7b-32768", "label": "Mixtral 8x7B"},
    {"id": "gemma2-9b-it", "label": "Gemma2 9B"}]

MISTRAL_MODELS: List[ModelInfo] = [
    {"id": "mistral-large-latest", "label": "Mistral Large"},
    {"id": "mistral-medium-latest", "label": "Mistral Medium"},
    {"id": "mistral-small-latest", "label": "Mistral Small"},
    {"id": "open-mistral-nemo", "label": "Open Mistral Nemo"},
    {"id": "codestral-latest", "label": "Codestral"}]

DEEPSEEK_MODELS: List[ModelInfo] = [
    {"id": "deepseek-chat", "label": "DeepSeek Chat (V3)"},
    {"id": "deepseek-reasoner", "label": "DeepSeek Reasoner (R1)"}]

XAI_MODELS: List[ModelInfo] = [
    {"id": "grok-4", "label": "Grok 4"},
    {"id": "grok-3", "label": "Grok 3"},
    {"id": "grok-3-mini", "label": "Grok 3 Mini"},
    {"id": "grok-2-latest", "label": "Grok 2"},
    {"id": "grok-2-vision-latest", "label": "Grok 2 Vision"}]

OPENROUTER_MODELS: List[ModelInfo] = [
    {"id": "anthropic/claude-3.5-sonnet", "label": "Claude 3.5 Sonnet (OR)"},
    {"id": "openai/gpt-4o", "label": "GPT-4o (OR)"},
    {"id": "google/gemini-2.0-flash-exp", "label": "Gemini 2.0 Flash (OR)"},
    {"id": "meta-llama/llama-3.3-70b-instruct", "label": "Llama 3.3 70B (OR)"},
    {"id": "deepseek/deepseek-r1", "label": "DeepSeek R1 (OR)"}]


MODELS_BY_PROVIDER: Dict[str, List[ModelInfo]] = {
    "openai": OPENAI_MODELS,
    "anthropic": ANTHROPIC_MODELS,
    "gemini": GEMINI_MODELS,
    "googleaistudio": GEMINI_MODELS,
    "ollama": OLLAMA_MODELS,
    "groq": GROQ_MODELS,
    "mistral": MISTRAL_MODELS,
    "deepseek": DEEPSEEK_MODELS,
    "xai": XAI_MODELS,
    "openrouter": OPENROUTER_MODELS}