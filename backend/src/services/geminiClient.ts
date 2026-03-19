import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY não configurada.');
}

const genAI = new GoogleGenerativeAI(apiKey);

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL_CANDIDATES = [
  ...(configuredModel ? [configuredModel] : []),
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
];

function shouldTryNextModel(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('404') || msg.includes('not found') || msg.includes('is not supported');
}

export async function generateWithGemini(prompt: string): Promise<string> {
  let lastError: unknown;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastError = err;
      if (!shouldTryNextModel(err)) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
