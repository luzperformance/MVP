import { GestaoRepository, GestaoPatient } from '../repositories/GestaoRepository';
import { v4 as uuidv4 } from 'uuid';

export class GestaoService {
  constructor(private gestaoRepository: GestaoRepository) {}

  async getAll(filters: { q?: string; status?: string; state?: string; package_type?: string }) {
    const rows = await this.gestaoRepository.findAll(filters);
    return rows.map(this.deserializeRow);
  }

  async getSummary() {
    return this.gestaoRepository.getSummary();
  }

  async update(id: string, data: Partial<GestaoPatient>) {
    const updated = await this.gestaoRepository.update(id, data);
    return this.deserializeRow(updated);
  }

  async import(rows: any[]) {
    let imported = 0;
    let updatedCount = 0;
    let skipped = 0;
    const errors: string[] = [];

    const GENDER_MAP: { [k: string]: string } = {
      masculino: 'M', feminino: 'F', m: 'M', f: 'F', masc: 'M', fem: 'F',
    };
    const PKG_MAP: { [k: string]: string } = {
      mensal: 'mensal', trimestral: 'trimestral', semestral: 'semestral', anual: 'anual',
    };

    const safeStr = (v: any) => v?.toString().trim() || null;
    const pickFirst = (row: any, ...keys: string[]) => {
      for (const k of keys) {
        const v = safeStr(row[k]);
        if (v) return v;
      }
      return null;
    };

    // Helper for date parsing logic (copied from gestaoRouter)
    const parseDate = (v: any) => {
      if (!v) return null;
      const s = String(v).trim();
      
      const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
         let [_, day, month, year] = slashMatch;
         if (parseInt(day) > 12 && parseInt(month) <= 12) { /* DD/MM */ }
         else if (parseInt(month) > 12 && parseInt(day) <= 12) { [day, month] = [month, day]; }
         return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      const isoMatch = s.match(/^\d{4}-\d{2}-\d{2}/);
      if (isoMatch) return isoMatch[0];
      return null;
    };

    const parseMoney = (v: any) => {
      if (!v) return null;
      const n = parseFloat(String(v).replace(/[R$\s.]/g, '').replace(',', '.'));
      return isNaN(n) ? null : n;
    };

    const parseBool = (v: any) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim().toLowerCase();
      if (['sim', 'yes', '1', 'true', 's'].includes(s)) return 1;
      if (['não', 'nao', 'no', '0', 'false', 'n'].includes(s)) return 0;
      return null;
    };

    for (const row of rows) {
      const name = pickFirst(row, 'Nome completo', 'name', 'nome', 'Nome');
      if (!name || name.length < 2) { skipped++; continue; }

      const existing = await this.gestaoRepository.findByName(name);
      if (existing) { updatedCount++; continue; }

      try {
        const id = uuidv4();
        const genderRaw = safeStr(row['Sexo'] || row['gender']);
        const gender = genderRaw ? (GENDER_MAP[genderRaw.toLowerCase()] || null) : null;
        const pkgRaw = safeStr(row['pacote'] || row['package_type'] || row['Pacote']);
        const pkg = pkgRaw ? (PKG_MAP[pkgRaw.toLowerCase()] || null) : null;
        const statusRaw = safeStr(row['Status'] || row['status']) || 'ativo';
        const mgmtStatus = ['ativo', 'inativo'].includes(statusRaw.toLowerCase()) ? statusRaw.toLowerCase() : 'ativo';

        await this.gestaoRepository.create({
          id, name,
          cpf_encrypted: pickFirst(row, 'CPF', 'cpf'),
          birth_date: parseDate(row['Data de nascimento'] || row['birth_date']),
          gender,
          email: pickFirst(row, 'E-mail', 'email', 'Email'),
          phone: pickFirst(row, 'Tel 1', 'phone', 'Telefone', 'Phone'),
          phone2: pickFirst(row, 'Tel 2', 'phone2'),
          address: pickFirst(row, 'Endereço', 'address', 'Endereco'),
          cep: pickFirst(row, 'Cep', 'CEP', 'cep'),
          city: pickFirst(row, 'Cidade', 'city'),
          state: pickFirst(row, 'Estado', 'state', 'UF'),
          insurance_name: pickFirst(row, 'Convênio', 'Convenio', 'insurance_name'),
          insurance_plan: pickFirst(row, 'Plano de saúde', 'Plano de saude', 'insurance_plan'),
          first_consultation: parseDate(row['Primeira Consulta'] || row['first_consultation']),
          last_consultation: parseDate(row['Última Consulta'] || row['last_consultation']),
          next_consultation: parseDate(row['Próxima Consulta'] || row['next_consultation']),
          last_prescription: parseDate(row['Ultima receita'] || row['last_prescription']),
          last_exam: parseDate(row['Ultimo Exame'] || row['last_exam']),
          mgmt_status: mgmtStatus,
          uses_ea: parseBool(row['Ja fazia uso EA'] || row['uses_ea']),
          wants_children: parseBool(row['Pensa ter filhos'] || row['wants_children']),
          observations: pickFirst(row, 'Obs', 'observations', 'Observações'),
          origin: pickFirst(row, 'Origem', 'origin'),
          package_type: pkg,
          monthly_value: parseMoney(row['Valor/ mensal'] || row['monthly_value']),
          payment_date: parseDate(row['data pagamento'] || row['payment_date']),
          needs_nf: parseBool(row['Necessita NF'] || row['needs_nf']),
          contract_done: parseBool(row['Contrato feito/Ass.'] || row['contract_done']),
          contract_start: parseDate(row['Inicio contrato'] || row['contract_start']),
          contract_end: parseDate(row['Venc Contrato'] || row['contract_end']),
          contract_notes: pickFirst(row, 'contract_notes', 'Observações contrato'),
          lgpd_consent_at: new Date().toISOString(),
          lgpd_consent_ip: 'import'
        });
        imported++;
      } catch (err: any) {
        errors.push(`Linha "${name}": ${err.message}`);
        skipped++;
      }
    }

    return { imported, updated: updatedCount, skipped, total: rows.length, errors };
  }

  private deserializeRow(row: any): any {
    if (!row) return row;
    row.uses_ea = !!row.uses_ea;
    row.wants_children = !!row.wants_children;
    row.needs_nf = !!row.needs_nf;
    row.contract_done = !!row.contract_done;
    return row;
  }
}
