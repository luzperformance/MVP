import { generateWithLlm } from './llmClient';

const SYSTEM_PROMPT = `Você é um assistente médico especializado em medicina do esporte e performance hormonal no Brasil.

Sua tarefa é gerar um RESUMO PRÉ-CONSULTA conciso para o médico, reunindo as informações mais relevantes do paciente antes da consulta.

O resumo deve incluir:
1. **Últimos exames e alterações** — destaque marcadores fora da faixa, tendências importantes (hormônios, metabólico, tireoide)
2. **Histórico de prescrições** — última receita, medicamentos em uso, tempo desde última prescrição
3. **Observações importantes** — notas do prontuário, queixa principal, dados relevantes
4. **Tempo desde última consulta** — há quantos dias/meses foi a última consulta

REGRAS:
- Use português brasileiro, linguagem clínica objetiva
- Seja conciso (máximo 300 palavras)
- NUNCA invente dados — use apenas o que foi fornecido
- Se não houver dados em alguma seção, indique "Sem dados registrados"
- Destaque em negrito (usando **) os pontos que exigem atenção`;

export interface PreConsultData {
  patient: {
    name: string;
    birth_date?: string;
    main_complaint?: string;
    notes?: string;
    observations?: string;
    last_consultation?: string;
    last_prescription?: string;
    last_exam?: string;
  };
  recentRecords: Array<{
    consultation_date: string;
    type: string;
    soap_subjective?: string;
    soap_objective?: string;
    soap_assessment?: string;
    soap_plan?: string;
  }>;
  recentExams: Array<{
    exam_date: string;
    lab_name?: string;
    markers: Array<{
      marker_name: string;
      value: number;
      unit: string;
      status?: string;
      ref_min?: number;
      ref_max?: number;
    }>;
  }>;
}

export async function generatePreConsultSummary(data: PreConsultData): Promise<string> {
  const dataStr = JSON.stringify(data, null, 2);

  const prompt = `${SYSTEM_PROMPT}

DADOS DO PACIENTE (JSON):
${dataStr}

Gere o resumo pré-consulta em markdown. Retorne apenas o texto do resumo, sem JSON ou metadados.`;

  return generateWithLlm(prompt);
}
