import { generateWithLlm } from './llmClient';

const LEAD_FIELDS = [
  'name', 'email', 'phone', 'company', 'source', 'status',
  'temperature', 'expected_value', 'tags', 'notes',
];

const VALID_SOURCE = ['indicacao', 'instagram', 'google', 'site', 'evento', 'outro'];
const VALID_STATUS = ['novo', 'contato', 'qualificado', 'proposta', 'convertido', 'perdido'];
const VALID_TEMPERATURE = ['frio', 'morno', 'quente'];

const IMPORT_SYSTEM_PROMPT = `Você é um assistente de importação de dados CRM para um sistema médico de performance.

Sua tarefa é receber dados brutos (tabela CSV ou JSON) de QUALQUER fonte — Google Ads, Meta Ads, planilhas, CRMs antigos — e mapear cada registro para o schema de leads do sistema.

SCHEMA DE DESTINO (campos aceitos):
- name: (OBRIGATÓRIO) nome completo da pessoa
- email: endereço de e-mail
- phone: telefone (qualquer formato)
- company: empresa, academia, assessoria, organização
- source: origem do lead — DEVE ser um destes: indicacao, instagram, google, site, evento, outro
- status: estágio no funil — DEVE ser um destes: novo, contato, qualificado, proposta, convertido, perdido
- temperature: temperatura do lead — DEVE ser um destes: frio, morno, quente
- expected_value: valor monetário esperado (número, sem R$ ou símbolos)
- tags: array de strings com categorias/tags relevantes
- notes: observações livres (consolidar informações que não mapeiam para outros campos)

REGRAS DE MAPEAMENTO:
1. Identifique automaticamente quais colunas da fonte correspondem a quais campos de destino.
2. Se a fonte tiver "Campaign Name" ou "Ad Group", use como tag.
3. Se a fonte tiver "Cost" ou "Spend", ignore (são dados de mídia, não do lead).
4. Se a fonte tiver "Conversions" ou "Clicks", ignore.
5. Se a fonte tiver campos como "Full Name", "First Name" + "Last Name", combine em "name".
6. Para "source": se o dado veio de Google Ads → "google"; Meta/Facebook/Instagram → "instagram"; indicação/referral → "indicacao"; website/landing page → "site".
7. Se não houver status, use "novo". Se não houver temperature, use "morno".
8. Consolide qualquer informação extra relevante (utm_content, ad_name, campaign, etc.) no campo "notes".
9. Limpe telefones removendo espaços e caracteres especiais, mantendo apenas dígitos e +.
10. NUNCA invente dados. Se um campo não existe na fonte, omita-o.

RETORNE um JSON válido com este formato exato:
{
  "mapped_leads": [
    { "name": "...", "email": "...", ... },
    ...
  ],
  "column_mapping": {
    "source_column_name": "target_field_name",
    ...
  },
  "unmapped_columns": ["coluna1", "coluna2"],
  "warnings": ["mensagem sobre dados problemáticos..."],
  "total_parsed": 10,
  "total_valid": 8,
  "total_skipped": 2,
  "skipped_reasons": ["Linha 3: sem nome", "Linha 7: duplicado"]
}

Retorne APENAS o JSON, sem markdown, sem texto adicional.`;

export interface ImportResult {
  mapped_leads: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    status?: string;
    temperature?: string;
    expected_value?: number;
    tags?: string[];
    notes?: string;
  }>;
  column_mapping: { [key: string]: string };
  unmapped_columns: string[];
  warnings: string[];
  total_parsed: number;
  total_valid: number;
  total_skipped: number;
  skipped_reasons: string[];
}

export function parseCSV(raw: string): string[][] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === ';') && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export function csvToJsonRows(raw: string): object[] {
  const rows = parseCSV(raw);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: { [k: string]: string } = {};
    headers.forEach((h, i) => { if (row[i] !== undefined) obj[h] = row[i]; });
    return obj;
  });
}

export async function processImportWithGemini(
  rawData: string,
  format: 'csv' | 'json',
  sourceHint?: string
): Promise<ImportResult> {
  let dataDescription: string;

  if (format === 'csv') {
    const jsonRows = csvToJsonRows(rawData);
    const preview = jsonRows.slice(0, 5);
    dataDescription = `FORMATO: CSV convertido para JSON (mostrando até 5 de ${jsonRows.length} linhas)\n\nDADOS COMPLETOS (JSON):\n${JSON.stringify(jsonRows, null, 2)}`;
  } else {
    dataDescription = `FORMATO: JSON\n\nDADOS:\n${rawData}`;
  }

  const prompt = `${IMPORT_SYSTEM_PROMPT}

${sourceHint ? `DICA: Os dados vieram de "${sourceHint}"\n` : ''}
${dataDescription}`;

  const text = await generateWithLlm(prompt);
  const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');

  const parsed: ImportResult = JSON.parse(clean);

  parsed.mapped_leads = parsed.mapped_leads
    .filter(l => l.name && String(l.name).trim().length >= 2)
    .map(l => ({
      ...l,
      name: String(l.name).trim(),
      source: l.source && VALID_SOURCE.includes(l.source) ? l.source : undefined,
      status: l.status && VALID_STATUS.includes(l.status) ? l.status : 'novo',
      temperature: l.temperature && VALID_TEMPERATURE.includes(l.temperature) ? l.temperature : 'morno',
      expected_value: l.expected_value != null ? Number(l.expected_value) || undefined : undefined,
      tags: Array.isArray(l.tags) ? l.tags.map(String) : undefined,
    }));

  parsed.total_valid = parsed.mapped_leads.length;
  return parsed;
}

export function processImportDirect(data: object[]): ImportResult {
  const leads: ImportResult['mapped_leads'] = [];
  const skipped: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as { [k: string]: unknown };
    const name = String(row.name || row.Name || row.nome || row.Nome || '').trim();

    if (name.length < 2) {
      skipped.push(`Linha ${i + 1}: sem nome válido`);
      continue;
    }

    leads.push({
      name,
      email: String(row.email || row.Email || row.e_mail || '').trim() || undefined,
      phone: String(row.phone || row.Phone || row.telefone || row.Telefone || row.cel || '').trim() || undefined,
      company: String(row.company || row.Company || row.empresa || row.Empresa || '').trim() || undefined,
      source: (() => {
        const s = String(row.source || row.Source || row.origem || row.Origem || '').toLowerCase().trim();
        if (VALID_SOURCE.includes(s)) return s;
        if (s.includes('google')) return 'google';
        if (s.includes('instagram') || s.includes('meta') || s.includes('facebook')) return 'instagram';
        if (s.includes('indica')) return 'indicacao';
        if (s.includes('site') || s.includes('web') || s.includes('landing')) return 'site';
        if (s.includes('evento')) return 'evento';
        return s ? 'outro' : undefined;
      })(),
      status: (() => {
        const s = String(row.status || row.Status || '').toLowerCase().trim();
        return VALID_STATUS.includes(s) ? s : 'novo';
      })(),
      temperature: (() => {
        const t = String(row.temperature || row.Temperature || row.temperatura || '').toLowerCase().trim();
        return VALID_TEMPERATURE.includes(t) ? t : 'morno';
      })(),
      expected_value: (() => {
        const v = Number(row.expected_value || row.value || row.valor || 0);
        return v > 0 ? v : undefined;
      })(),
      tags: (() => {
        const t = row.tags || row.Tags;
        if (Array.isArray(t)) return t.map(String);
        if (typeof t === 'string') { try { const a = JSON.parse(t); return Array.isArray(a) ? a : undefined; } catch { return undefined; } }
        return undefined;
      })(),
      notes: String(row.notes || row.Notes || row.notas || row.observacoes || '').trim() || undefined,
    });
  }

  return {
    mapped_leads: leads,
    column_mapping: {},
    unmapped_columns: [],
    warnings: [],
    total_parsed: data.length,
    total_valid: leads.length,
    total_skipped: skipped.length,
    skipped_reasons: skipped,
  };
}
