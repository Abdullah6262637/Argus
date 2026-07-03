/**
 * Dynamic helper to determine the correct full-color brand logo for any model family
 * or fallback to provider logos.
 */
export function getModelLogo(model: string, provider: string): string {
  const m = model.toLowerCase();
  const p = provider.toLowerCase();

  // 1. Check model family keywords
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3')) {
    return '/providers/openai-official.png?v=3';
  }
  if (m.includes('claude')) {
    return '/providers/anthropic.png?v=3';
  }
  if (m.includes('gemini') || m.includes('gemma')) {
    return '/providers/gemini.png?v=3';
  }
  if (m.includes('llama')) {
    return '/models/llama.png?v=3';
  }
  if (m.includes('qwen')) {
    return '/models/qwen.png?v=3';
  }
  if (m.includes('deepseek')) {
    return '/providers/deepseek.png?v=3';
  }
  if (m.includes('mistral') || m.includes('mixtral') || m.includes('codestral') || m.includes('pixtral')) {
    return '/providers/mistral.png?v=3';
  }
  if (m.includes('grok')) {
    return '/providers/xai.png?v=3';
  }
  if (m.includes('command') || m.includes('cohere')) {
    return '/models/cohere.png?v=3';
  }
  if (m.includes('phi') || m.includes('microsoft')) {
    return '/models/microsoft.png?v=3';
  }

  // 2. Fallback to provider logo if model name doesn't match a specific family
  if (p === 'openai') return '/providers/openai-official.png?v=3';
  if (p === 'anthropic') return '/providers/anthropic.png?v=3';
  if (p === 'gemini') return '/providers/gemini.png?v=3';
  if (p === 'openrouter') return '/providers/openrouter.png?v=3';
  if (p === 'groq') return '/providers/groq.png?v=3';
  if (p === 'deepseek') return '/providers/deepseek.png?v=3';
  if (p === 'mistral') return '/providers/mistral.png?v=3';
  if (p === 'xai') return '/providers/xai.png?v=3';
  if (p === 'local') return '/providers/local.png?v=3';
  
  return '/providers/local.png?v=3';
}
