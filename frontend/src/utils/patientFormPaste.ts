/**
 * Interpreta texto colado (perguntas copiadas + respostas) e preenche campos do cadastro.
 * Suporta linhas "Rótulo: valor" e extração heurística de CPF, e-mail, telefone, CEP e datas.
 */

export type PatientFormPasteFields = {
  name: string;
  birth_date: string;
  phone: string;
  email: string;
  occupation: string;
  mother_name: string;
  children_info: string;
  weight_height: string;
  future_children: string;
  cpf: string;
  cep_address: string;
  civil_status: string;
  health_plan: string;
  other_professionals: string;
  hometown_current: string;
  medical_history: string;
  hormone_use: string;
  libido_erection: string;
  children_details_6m: string;
};

type FieldKey = keyof PatientFormPasteFields;

const RULES: { field: FieldKey; test: (label: string) => boolean }[] = [
  { field: 'mother_name', test: l => /nome\s+da\s+m[aã]e|^\s*m[aã]e\s*$|^m[aã]e\b/.test(l) },
  {
    field: 'name',
    test: l =>
      (/nome\s+completo|^nome\b/.test(l) && !/nome\s+da\s+m[aã]e/.test(l) && !/^\s*m[aã]e\b/.test(l)),
  },
  { field: 'birth_date', test: l => /data\s+de\s+nascimento|^nascimento\b|^d\.?\s*n\.?\b|data\s+nasc/.test(l) },
  { field: 'civil_status', test: l => /estado\s+civil/.test(l) },
  { field: 'cpf', test: l => /^cpf\b/.test(l) },
  { field: 'occupation', test: l => /profiss[aã]o|profissa/.test(l) },
  { field: 'phone', test: l => /celular|telefone|whatsapp|ddd|\(\d{2}\)/.test(l) },
  { field: 'email', test: l => /^e\s*\-?\s*mail|^email|^correio/.test(l) },
  { field: 'cep_address', test: l => /^cep|^endere[cç]o|resid[eê]ncia.*cep/.test(l) },
  { field: 'hometown_current', test: l => /cidade\s+natal|cidade\s+atual|^cidade\b/.test(l) },
  { field: 'health_plan', test: l => /plano\s+de\s+sa[uú]de|^plano\b/.test(l) },
  { field: 'weight_height', test: l => /peso\s*[\/\*]?\s*altura|^peso\b|^altura\b|imc/.test(l) },
  {
    field: 'children_details_6m',
    test: l =>
      (/filhos?\s*[:(]/.test(l) && /6\s*m[eê]s|pr[oó]ximos|pr[oó]xim/.test(l)) ||
      /n[uú]mero\s+de\s+filhos.*6/.test(l),
  },
  {
    field: 'children_info',
    test: l =>
      (/filhos?/.test(l) && /quantos|idades|idade/.test(l) && !/6\s*m[eê]s|pr[oó]xim/.test(l)) ||
      /filhos\s*\?\s*quantos/.test(l),
  },
  {
    field: 'future_children',
    test: l => /filhos?\s*\?.*pensa|pensa\s+em\s+ter|^deseja\s+ter\s+filho/.test(l),
  },
  {
    field: 'other_professionals',
    test: l =>
      /acompanhamento|outros\s+profissionais|profissionais\s+da\s+sa[uú]de|nutricionista|personal/.test(l),
  },
  {
    field: 'medical_history',
    test: l =>
      /problemas?\s+de\s+sa[uú]de|medicamentos?\s+e?\s+suplementos?|medicamentos\b|antecedentes|^hist[oó]rico/.test(
        l,
      ),
  },
  {
    field: 'hormone_use',
    test: l =>
      /horm[oô]nios|ester[oó]ides|GH\b|tire[oó]ide|hormonio/.test(l) && !/libido/.test(l),
  },
  {
    field: 'libido_erection',
    test: l => /libido|ere[cç][aã]o|apetite\s+sexual|disfun[cç][aã]o\s+sexual|ere[cç][aã]o\s+n[aã]o\s+plena/.test(l),
  },
];

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripEnumerate(line: string): string {
  return line.replace(/^\s*[\-*•]+/, '').replace(/^\s*(?:section\s*)?\d+[\).\]]\s*/, '');
}

/** dd/mm/aaaa, dd-mm-aaaa ou aaaa-mm-dd → yyyy-mm-dd (input date) */
export function normalizeBirthDateToIso(raw: string): string | '' {
  const s = raw.trim();
  let m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const dd = d.padStart(2, '0');
    const mm = mo.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  m = s.match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}

function matchField(normalizedLabel: string): FieldKey | null {
  for (const { field, test } of RULES) {
    if (test(normalizedLabel)) return field;
  }
  return null;
}

function splitFirstLabelValue(line: string): { label: string; value: string } | null {
  const t = stripEnumerate(line).trim();
  const idx = t.indexOf(':');
  if (idx === -1) return null;
  const label = t.slice(0, idx).trim();
  const value = t.slice(idx + 1).trim();
  if (!label || value === undefined) return null;
  return { label, value };
}

function heuristicExtract(full: string): Partial<PatientFormPasteFields> {
  const out: Partial<PatientFormPasteFields> = {};

  const emailM = full.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  if (emailM) out.email = emailM[0].trim();

  const cpfM = full.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);
  if (cpfM) {
    const d = cpfM[1].replace(/\D/g, '');
    if (d.length === 11)
      out.cpf = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  const cepM = full.match(/(\d{5})\s*-\s*(\d{3})([^\n]*)?/);
  if (cepM) {
    const rest = (cepM[3] || '').replace(/^[,\s]+/, '').replace(/\s+/g, ' ').trim();
    out.cep_address = rest ? `${cepM[1]}-${cepM[2]}, ${rest}` : `${cepM[1]}-${cepM[2]}`;
  }

  const phoneM = full.match(/\(?\s*(\d{2})\s*\)?\s*(\d{4,5})\s*-?\s*(\d{4})\b/);
  if (phoneM) out.phone = `(${phoneM[1]}) ${phoneM[2]}-${phoneM[3]}`;

  const dateLine = full.match(
    /(?:nascimento|nasc\.?|data\s*de\s*nascimento)\s*[:.\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2})/i,
  );
  if (dateLine) {
    const iso = normalizeBirthDateToIso(dateLine[1]);
    if (iso) out.birth_date = iso;
  } else {
    const isoStandalone = full.match(/\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4})\b/);
    if (isoStandalone) {
      const iso = normalizeBirthDateToIso(isoStandalone[1]);
      if (iso) out.birth_date = iso;
    }
  }

  return out;
}

/**
 * Extrai valores do texto colado (labels em português + extras).
 */
export function parsePatientFormPaste(raw: string): Partial<PatientFormPasteFields> {
  const merged: Partial<PatientFormPasteFields> = {};
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  let pendingField: FieldKey | null = null;

  const flushContinuation = () => {
    pendingField = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parsed = splitFirstLabelValue(line);

    if (parsed) {
      const norm = normalizeLabel(parsed.label);
      const field = matchField(norm);
      let value = parsed.value.replace(/\u00a0/g, ' ').trim();

      if (field === 'birth_date') {
        const iso = normalizeBirthDateToIso(value);
        value = iso || value;
      }

      if (field) {
        if (merged[field]) merged[field] = `${merged[field]}\n${value}`;
        else merged[field] = value;
        pendingField = ['medical_history', 'other_professionals', 'libido_erection'].includes(field)
          ? field
          : null;
      } else {
        flushContinuation();
      }
    } else {
      const trimmed = stripEnumerate(line).trim();
      if (!trimmed) {
        flushContinuation();
        continue;
      }
      if (pendingField && merged[pendingField] !== undefined) {
        merged[pendingField] = `${merged[pendingField]}\n${trimmed}`;
      }
    }
  }

  const heuristic = heuristicExtract(raw);

  for (const k of Object.keys(heuristic) as FieldKey[]) {
    const h = heuristic[k];
    const current = merged[k];
    const empty = current === undefined || String(current).trim() === '';
    if (empty && h) merged[k] = h as string;
  }

  /** Heurística: primeira linha longa só com nome (sem dois-pontos) */
  if (!merged.name?.trim()) {
    for (const line of lines) {
      const t = stripEnumerate(line).trim();
      if (!t.includes(':') && /^[a-zà-ú\s.'-]{6,}$/i.test(t) && t.split(/\s+/).length >= 2) {
        merged.name = t;
        break;
      }
    }
  }

  return merged;
}

/** Aplica valores extraídos: sobrescreve apenas chaves presentes em `patch` com texto não vazio. */
export function applyPatientFormPastePatch<F extends PatientFormPasteFields>(
  prev: F,
  patch: Partial<PatientFormPasteFields>,
): F {
  const next = { ...prev };
  (Object.entries(patch) as [FieldKey, string][]).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    const s = String(val).trim();
    if (!s) return;
    next[key] = val as F[typeof key];
  });
  return next;
}
