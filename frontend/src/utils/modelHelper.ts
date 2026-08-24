/**
 * Resolves static assets safely for both Vite web dev server and Electron file:// origin.
 */
export function resolveAsset(path: string): string {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${prefix}${cleanPath}`;
}

/**
 * Dynamic helper to determine the correct full-color brand logo for any model family
 * or fallback to provider logos.
 */
export function getModelLogo(model: string, provider: string): string {
  const m = (model || '').toLowerCase();
  const p = (provider || '').toLowerCase();

  // 1. Check model family keywords
  if (m.includes('gpt') || m.includes('o1') || m.includes('o3') || m.includes('dall')) {
    return resolveAsset('providers/openai-official.png');
  }
  if (m.includes('claude') || m.includes('sonnet') || m.includes('opus') || m.includes('haiku')) {
    return resolveAsset('providers/anthropic.png');
  }
  if (m.includes('gemini') || m.includes('gemma')) {
    return resolveAsset('providers/gemini.png');
  }
  if (m.includes('llama')) {
    return resolveAsset('models/llama.png');
  }
  if (m.includes('nemotron') || m.includes('nvidia')) {
    return resolveAsset('models/nvidia.png');
  }
  if (m.includes('qwen')) {
    return resolveAsset('models/qwen.png');
  }
  if (m.includes('deepseek')) {
    return resolveAsset('providers/deepseek.png');
  }
  if (m.includes('mistral') || m.includes('mixtral') || m.includes('codestral') || m.includes('pixtral')) {
    return resolveAsset('providers/mistral.png');
  }
  if (m.includes('grok') || m.includes('xai')) {
    return resolveAsset('providers/xai.png');
  }
  if (m.includes('command') || m.includes('cohere')) {
    return resolveAsset('models/cohere.png');
  }
  if (m.includes('phi') || m.includes('microsoft')) {
    return resolveAsset('models/microsoft.png');
  }

  // 2. Fallback to provider logo if model name doesn't match a specific family
  if (p === 'openai') return resolveAsset('providers/openai-official.png');
  if (p === 'anthropic') return resolveAsset('providers/anthropic.png');
  if (p === 'gemini' || p === 'google' || p === 'googleaistudio') return resolveAsset('providers/gemini.png');
  if (p === 'openrouter') return resolveAsset('providers/openrouter.png');
  if (p === 'groq') return resolveAsset('providers/groq.png');
  if (p === 'deepseek') return resolveAsset('providers/deepseek.png');
  if (p === 'mistral') return resolveAsset('providers/mistral.png');
  if (p === 'xai') return resolveAsset('providers/xai.png');
  if (p === 'together') return resolveAsset('providers/together.png');
  if (p === 'lmstudio') return resolveAsset('providers/lmstudio.png');
  if (p === 'frostai') return resolveAsset('providers/frostai.png');
  if (p === 'local' || p === 'ollama') return resolveAsset('providers/local.png');

  return resolveAsset('providers/local.png');
}

/**
 * Dynamic helper to determine the logo for a specific provider.
 */
export function getProviderLogo(provider: string): string {
  const p = (provider || '').toLowerCase();
  if (p === 'openai') return resolveAsset('providers/openai-official.png');
  if (p === 'anthropic' || p === 'claude') return resolveAsset('providers/anthropic.png');
  if (p === 'gemini' || p === 'google' || p === 'googleaistudio') return resolveAsset('providers/gemini.png');
  if (p === 'openrouter') return resolveAsset('providers/openrouter.png');
  if (p === 'groq') return resolveAsset('providers/groq.png');
  if (p === 'deepseek') return resolveAsset('providers/deepseek.png');
  if (p === 'mistral') return resolveAsset('providers/mistral.png');
  if (p === 'xai' || p === 'grok') return resolveAsset('providers/xai.png');
  if (p === 'together') return resolveAsset('providers/together.png');
  if (p === 'lmstudio') return resolveAsset('providers/lmstudio.png');
  if (p === 'frostai') return resolveAsset('providers/frostai.png');
  if (p === 'local' || p === 'ollama') return resolveAsset('providers/local.png');

  return resolveAsset('providers/local.png');
}

/**
 * Dynamic helper to determine the logo for an MCP server name.
 */
export function getMcpLogo(serverName: string): string {
  const name = (serverName || '').toLowerCase();
  if (name.includes('github')) return resolveAsset('mcp/github.png');
  if (name.includes('fetch')) return resolveAsset('mcp/fetch.png');
  if (name.includes('sqlite')) return resolveAsset('mcp/sqlite.png');
  if (name.includes('file') || name.includes('fs') || name.includes('dir')) return resolveAsset('mcp/filesystem.png');
  if (name.includes('docker')) return resolveAsset('mcp/docker.png');
  if (name.includes('postgres') || name.includes('pg')) return resolveAsset('mcp/postgres.png');
  if (name.includes('slack')) return resolveAsset('mcp/slack.png');
  if (name.includes('sentry')) return resolveAsset('mcp/sentry.png');
  if (name.includes('aws')) return resolveAsset('mcp/aws.png');
  if (name.includes('brave')) return resolveAsset('mcp/brave-search.png');
  if (name.includes('puppeteer') || name.includes('playwright')) return resolveAsset('mcp/puppeteer.png');
  if (name.includes('memory')) return resolveAsset('mcp/memory.png');

  return '';
}
