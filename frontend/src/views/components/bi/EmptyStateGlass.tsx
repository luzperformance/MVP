import React from 'react';
import { AreaChart, Plus } from 'lucide-react';

interface EmptyStateGlassProps {
  onAdd: () => void;
}

export default function EmptyStateGlass({ onAdd }: EmptyStateGlassProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 backdrop-blur rounded-xl min-h-[400px] text-center animate-fade-in-up">
      <AreaChart size={64} className="text-[#c9a44a] mb-6 animate-float" strokeWidth={1.5} />
      <h3 className="font-display text-2xl text-white font-bold mb-3">Nenhum dado biológico</h3>
      <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        Não há exames disponíveis para gerar o panorama analítico deste paciente. 
        Adicione os primeiros marcadores para inicializar o Dashboard BI Mapeado.
      </p>
      <button type="button" onClick={onAdd} className="btn-primary flex items-center justify-center gap-2" style={{ padding: '12px 24px', borderRadius: 999 }}>
        <Plus size={18} /> Adicionar Marcador
      </button>
    </div>
  );
}
