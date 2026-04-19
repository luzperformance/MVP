import { generateWithGemini } from './geminiClient';
import { generateWithOpenRouter } from './openRouterClient';

/**
 * Provedor ativo: `LLM_PROVIDER=openrouter` | `gemini`.
 * Se não definido: usa OpenRouter quando `OPENROUTER_API_KEY` existir; senão Gemini.
 */
function resolveProvider(): 'openrouter' | 'gemini' {
  const raw = process.env.LLM_PROVIDER?.toLowerCase().trim();
  if (raw === 'openrouter' || raw === 'gemini') return raw;
  if (process.env.OPENROUTER_API_KEY?.trim()) return 'openrouter';
  return 'gemini';
}

/** True se o provedor configurado tiver API key disponível. */
export function isLlmConfigured(): boolean {
  return resolveProvider() === 'openrouter'
    ? !!process.env.OPENROUTER_API_KEY?.trim()
    : !!process.env.GEMINI_API_KEY?.trim();
}

export async function generateWithLlm(prompt: string): Promise<string> {
  return resolveProvider() === 'openrouter'
    ? generateWithOpenRouter(prompt)
    : generateWithGemini(prompt);
}
