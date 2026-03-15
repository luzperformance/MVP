import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Você é um assistente médico especializado em documentação clínica para um médico de medicina do esporte e performance hormonal no Brasil.

Sua tarefa é analisar a transcrição de uma teleconsulta feita pelo Google Meet e estruturar as informações no formato SOAP (Subjetivo, Objetivo, Avaliação e Plano).

REGRAS IMPORTANTES:
1. Use terminologia médica em português brasileiro
2. NUNCA invente informações que não estão na transcrição
3. Se uma seção do SOAP não tiver informações suficientes na transcrição, use "Não informado na consulta."
4. Preserve exatamente os valores laboratoriais e medicamentos mencionados
5. Mantenha linguagem clínica objetiva e profissional
6. Foque em: hormônios (testosterona, estradiol, TSH, cortisol), aspectos metabólicos, performance

Retorne um JSON válido com este formato exato:
{
  "soap_subjective": "Queixa principal e histórico relatados pelo paciente...",
  "soap_objective": "Dados objetivos, exames, medidas...",
  "soap_assessment": "Avaliação clínica e impressão diagnóstica...",
  "soap_plan": "Plano de tratamento, medicações, retorno..."
}`;

export async function processTranscription(
  rawInput: string,
  patientContext?: string
): Promise<{
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `${SYSTEM_PROMPT}

${patientContext ? `CONTEXTO DO PACIENTE (não incluir no SOAP, apenas para referência):\n${patientContext}\n\n` : ''}

TRANSCRIÇÃO DA TELECONSULTA:
${rawInput}

Retorne apenas o JSON, sem markdown ou texto adicional.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Clean potential markdown code blocks
  const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}
