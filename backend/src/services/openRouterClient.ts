function textFromAssistantContent(
  content: string | Array<unknown> | null | undefined
): string {
  if (content == null) return '';
  if (typeof content === 'string') return content.trim();
  return JSON.stringify(content);
}

/**
 * Cliente OpenRouter via SDK oficial (@openrouter/sdk).
 * O pacote é ESM-only; usamos import dinâmico para compatibilidade com o build CommonJS do backend.
 */
export async function generateWithOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada.');
  }

  const { OpenRouter } = await import('@openrouter/sdk');
  const model =
    process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';

  const client = new OpenRouter({
    apiKey,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER,
    appTitle: process.env.OPENROUTER_APP_TITLE,
  });

  const response = await client.chat.send({
    chatRequest: {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    },
  });

  const result = response as {
    choices: Array<{ message?: { content?: string | unknown[] | null } }>;
  };
  const raw = result.choices[0]?.message?.content;
  const text = textFromAssistantContent(raw);
  if (!text) {
    throw new Error('OpenRouter retornou resposta vazia.');
  }
  return text;
}
