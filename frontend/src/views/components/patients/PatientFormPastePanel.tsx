import React, { useMemo, useState } from 'react';
import { ClipboardPaste, ChevronDown, ChevronUp } from 'lucide-react';
import { parsePatientFormPaste, PatientFormPasteFields } from '../../../utils/patientFormPaste';

interface PatientFormPastePanelProps<F extends PatientFormPasteFields & Record<string, unknown>> {
  mergeFromPaste: (patch: Partial<PatientFormPasteFields>) => void;
}

/**
 * Área expansível para colar o questionário ou respostas em texto livre (rótulos com “:”).
 */
export default function PatientFormPastePanel<F extends PatientFormPasteFields & Record<string, unknown>>({
  mergeFromPaste,
}: PatientFormPastePanelProps<F>) {
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  const previewCount = useMemo(() => Object.keys(parsePatientFormPaste(raw)).length, [raw]);

  const handleApply = () => {
    const patch = parsePatientFormPaste(raw);
    const filled = Object.keys(patch).filter(k => patch[k as keyof PatientFormPasteFields]?.toString().trim());
    if (filled.length === 0) {
      setHint('Não encontramos dados no formato “Pergunta: resposta”. Verifique ou preencha manualmente.');
      return;
    }
    mergeFromPaste(patch);
    setHint(`Campos atualizados: ${filled.length}. Revise antes de enviar.`);
  };

  return (
    <div
      className="glass-card animate-fade-in-up"
      style={{
        marginBottom: 24,
        border: '1px solid rgba(201, 164, 74, 0.25)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 0,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--luz-gold)',
          letterSpacing: '0.06em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ClipboardPaste size={18} aria-hidden />
          COLAR TEXTO E PREENCHER O CADASTRO
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, color: 'var(--luz-gray-dark)', margin: '14px 0 10px', lineHeight: 1.6 }}>
            Copie suas respostas (com rótulos, ex.: <em>Nome completo: João Silva</em>) nesta área e clique em
            aplicar. CPF, e-mail, celular e CEP também são detectados no texto.
          </p>
          <textarea
            className="form-input"
            rows={8}
            value={raw}
            onChange={e => {
              setRaw(e.target.value);
              setHint(null);
            }}
            placeholder={`Exemplo:\nNome completo: Ana Costa\nCPF: 123.456.789-09\nData de nascimento: 15/03/1990\nCelular: (11) 98765-4321\nE-mail: ana@email.com\nCEP: 01310-100, ap 42\n...`}
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleApply}>
              Aplicar ao formulário {previewCount > 0 ? `(${previewCount} campos detectados)` : ''}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRaw('')}>
              Limpar
            </button>
          </div>
          {hint && (
            <p
              role="status"
              style={{
                marginTop: 12,
                fontSize: 12,
                color: hint.startsWith('Não ') ? 'var(--luz-danger)' : 'rgba(134, 239, 172, 0.9)',
                marginBottom: 0,
              }}
            >
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
