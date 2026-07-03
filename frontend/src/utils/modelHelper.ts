/**
 * Dynamic helper to determine the correct full-color brand logo for any model family
 * or fallback to provider logos.
 */
export function getModelLogo(model: string, provider: string): string {
  const m = model.toLowerCase();
  const p = provider.toLowerCase();

  // 1. Check model family keywords
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3')) {
    return '/providers/openai.png';
  }
  if (m.includes('claude')) {
    return '/providers/anthropic.png';
  }
  if (m.includes('gemini') || m.includes('gemma')) {
    return '/providers/gemini.png';
  }
  if (m.includes('llama')) {
    return '/models/llama.png';
  }
  if (m.includes('qwen')) {
    return '/models/qwen.png';
  }
  if (m.includes('deepseek')) {
    return '/providers/deepseek.png';
  }
  if (m.includes('mistral') || m.includes('mixtral') || m.includes('codestral') || m.includes('pixtral')) {
    return '/providers/mistral.png';
  }
  if (m.includes('grok')) {
    return '/providers/xai.png';
  }
  if (m.includes('command') || m.includes('cohere')) {
    return '/models/cohere.png';
  }
  if (m.includes('phi') || m.includes('microsoft')) {
    return '/models/microsoft.png';
  }

  // 2. Fallback to provider logo if model name doesn't match a specific family
  if (p === 'openai') return '/providers/openai.png';
  if (p === 'anthropic') return '/providers/anthropic.png';
  if (p === 'gemini') return '/providers/gemini.png';
  if (p === 'openrouter') return '/providers/openrouter.png';
  if (p === 'groq') return '/providers/groq.png';
  if (p === 'deepseek') return '/providers/deepseek.png';
  if (p === 'mistral') return '/providers/mistral.png';
  if (p === 'xai') return '/providers/xai.png';
  if (p === 'local') return '/providers/local.png';
  
  return '/providers/local.png';
}
