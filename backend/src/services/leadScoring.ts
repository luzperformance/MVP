import { generateWithLlm } from './llmClient';

const SCORING_PROMPT = `Você é um assistente de CRM para um médico de medicina esportiva e performance hormonal (LuzPerformance).

Sua tarefa é PONTUAR um lead de 0 a 100 com base nos dados fornecidos.

PERFIL IDEAL DO PACIENTE (ICP):
- Adultos 25-55 anos que buscam performance, otimização hormonal, ou emagrecimento
- Praticantes de atividade física (academia, corrida, crossfit, etc.)
- Profissionais com poder aquisitivo
- Pessoas que já fazem acompanhamento médico e exames regulares
- Atletas amadores ou profissionais
- Empresários, executivos, profissionais liberais

TABELA DE PREÇOS (contexto para estimar valor do deal):
- Consultoria Esportiva e Clínica (consultas e retornos ilimitados no período):
  - Avulso Mensal: R$650/mês
  - Plano Semestral: R$600/mês (R$3.600 total)
  - Plano Anual: R$500/mês (R$6.000 total)
- Coach Esportivo Completo (Treino + Alimentação + Protocolo com reajuste quinzenal):
  - Avulso Mensal: R$800/mês
  - Plano Anual: R$700/mês (R$8.400 total)

FATORES DE PONTUAÇÃO:
1. COMPLETUDE DOS DADOS (0-20): dados preenchidos = lead mais engajado
   - Nome + email + telefone + empresa = 20
   - Nome + email/telefone = 12
   - Só nome = 5

2. ORIGEM (0-20): quanto mais intencional, melhor
   - indicacao = 20 (maior confiança, maior conversão)
   - google = 15 (busca ativa por médico)
   - site = 14 (visitou o site, interesse direto)
   - evento = 12 (networking, conheceu pessoalmente)
   - instagram = 10 (interesse passivo, segue conteúdo)
   - outro = 5

3. VALOR ESPERADO (0-20):
   - >= R$6000 (plano anual coach) = 20
   - >= R$3600 (plano semestral) = 15
   - >= R$650 (avulso mensal) = 10
   - Sem valor definido = 5

4. ENGAJAMENTO (0-20): baseado em atividades e temperatura
   - quente + atividades recentes = 20
   - morno + alguma atividade = 10
   - frio ou sem interação = 3

5. URGÊNCIA/FIT (0-20): baseado em tags, notas e contexto
   - Menção a TRT, reposição hormonal, exames alterados = 20
   - Interesse em protocolo esportivo ou coach = 15
   - Quer emagrecer ou melhorar saúde = 12
   - Interesse genérico / curiosidade = 5

RETORNE um JSON válido:
{
  "score": <0-100>,
  "reasoning": "<explicação em 1-2 frases do porquê da pontuação>",
  "suggested_temperature": "<frio|morno|quente>",
  "next_action": "<ação sugerida para o médico>"
}

Retorne APENAS o JSON, sem markdown.`;

export interface ScoreResult {
  score: number;
  reasoning: string;
  suggested_temperature: string;
  next_action: string;
}

export async function scoreLeadWithAI(leadData: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  temperature?: string;
  expected_value?: number;
  tags?: string[];
  notes?: string;
  activities_count?: number;
  days_since_creation?: number;
}): Promise<ScoreResult> {
  const prompt = `${SCORING_PROMPT}

DADOS DO LEAD:
${JSON.stringify(leadData, null, 2)}`;

  const text = await generateWithLlm(prompt);
  const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const parsed: ScoreResult = JSON.parse(clean);

  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return parsed;
}

export function scoreLeadRuleBased(lead: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  temperature?: string;
  expected_value?: number;
  tags?: string[];
  activities_count?: number;
}): { score: number; reasoning: string } {
  let score = 0;
  const reasons: string[] = [];

  const fields = [lead.name, lead.email, lead.phone, lead.company].filter(Boolean).length;
  const dataScore = fields >= 4 ? 20 : fields >= 2 ? 12 : 5;
  score += dataScore;
  reasons.push(`Dados: ${fields}/4 campos (${dataScore}pts)`);

  const sourceScores: { [k: string]: number } = {
    indicacao: 20, google: 15, site: 14, evento: 12, instagram: 10, outro: 5,
  };
  const srcScore = sourceScores[lead.source || ''] || 5;
  score += srcScore;
  reasons.push(`Origem ${lead.source || 'n/a'}: ${srcScore}pts`);

  const val = lead.expected_value || 0;
  const valScore = val > 5000 ? 20 : val > 2000 ? 15 : val > 500 ? 10 : 5;
  score += valScore;

  const tempScores: { [k: string]: number } = { quente: 20, morno: 10, frio: 3 };
  score += tempScores[lead.temperature || 'morno'] || 10;

  const actScore = (lead.activities_count || 0) > 3 ? 20 : (lead.activities_count || 0) > 0 ? 10 : 5;
  score += actScore;

  return { score: Math.min(100, score), reasoning: reasons.join('. ') };
}
