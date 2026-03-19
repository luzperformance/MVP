import React, { useState } from 'react';

interface WidgetBuilderModalProps {
  onClose: () => void;
  onAdd: (marker: string) => void;
}

export default function WidgetBuilderModal({ onClose, onAdd }: WidgetBuilderModalProps) {
  const [selected, setSelected] = useState('Testosterona Total');

  const markers = [
    'Testosterona Total', 'Vitamina D', 'Glicemia em Jejum', 'Hemoglobina Glicada', 'Colesterol LDL'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        className="relative bg-[#0d1f33] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up"
        style={{ boxShadow: '0 0 50px rgba(201,164,74,0.1)' }}
      >
        <h3 className="font-display text-xl text-[#c9a44a] font-bold mb-4">Adicionar Novo Marcador</h3>
        <p className="text-gray-400 text-sm mb-6">
          Selecione qual resultado de exame você deseja plotar no Painel Analítico.
        </p>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-6 pr-2">
          {markers.map(m => (
            <button
              key={m}
              onClick={() => setSelected(m)}
              className={`text-left px-4 py-3 rounded-xl border transition-all ${
                selected === m 
                  ? 'bg-white/10 border-[#c9a44a] text-[#c9a44a] font-bold' 
                  : 'bg-transparent border-white/10 text-gray-300 hover:bg-white/5'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            CANCELAR
          </button>
          <button 
            onClick={() => onAdd(selected)}
            className="flex-1 bg-[#c9a44a] text-[#0d1f33] rounded-full py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#d4b55a] transition-colors"
          >
            PLOTAR GRÁFICO
          </button>
        </div>
      </div>
    </div>
  );
}
