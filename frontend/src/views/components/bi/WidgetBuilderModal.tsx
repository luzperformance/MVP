import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';

interface AvailableMarker {
  marker_name: string;
  marker_category: string | null;
  unit: string | null;
}

interface WidgetBuilderModalProps {
  patientId: string;
  onClose: () => void;
  onAdd: (marker: string) => void;
}

export default function WidgetBuilderModal({ patientId, onClose, onAdd }: WidgetBuilderModalProps) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<string | null>(null);
  const [markers, setMarkers] = useState<AvailableMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  useEffect(() => {
    async function fetchMarkers() {
      try {
        const res = await fetch(`/api/patients/${patientId}/exams/timeline`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.availableMarkers && Array.isArray(data.availableMarkers)) {
            setMarkers(data.availableMarkers);
            if (data.availableMarkers.length > 0) {
              setSelected(data.availableMarkers[0].marker_name);
            }
          }
        }
      } catch (err) {
        console.error('Fetch markers error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkers();
  }, [patientId, token]);

  const categories = ['Todos', ...Array.from(new Set(markers.map((m) => m.marker_category || 'Outros')))];

  const filtered =
    activeCategory === 'Todos'
      ? markers
      : markers.filter((m) => (m.marker_category || 'Outros') === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-[#0d1f33] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up"
        style={{ boxShadow: '0 0 60px rgba(201,164,74,0.12), 0 0 0 1px rgba(201,164,74,0.08)' }}
      >
        <h3 className="font-display text-xl text-[#c9a44a] font-bold mb-1">
          Adicionar Marcador
        </h3>
        <p className="text-gray-500 text-xs mb-5">
          Selecione um biomarcador para plotar no painel analítico.
        </p>

        {/* Category pills */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="text-xs px-3 py-1 rounded-full border transition-all"
                style={{
                  background: activeCategory === cat ? '#c9a44a' : 'transparent',
                  borderColor: activeCategory === cat ? '#c9a44a' : 'rgba(255,255,255,0.1)',
                  color: activeCategory === cat ? '#0d1f33' : 'rgba(255,255,255,0.4)',
                  fontWeight: activeCategory === cat ? 700 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Marker list */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto mb-6 pr-1">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    animation: 'pulse 1.5s ease infinite',
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              <div style={{ fontSize: 28, marginBottom: 8 }}>🧬</div>
              Nenhum exame encontrado para este paciente.
              <br />
              <span style={{ fontSize: 11, opacity: 0.6 }}>Carregue um PDF de exame primeiro.</span>
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.marker_name}
                onClick={() => setSelected(m.marker_name)}
                className="text-left px-4 py-3 rounded-xl border transition-all"
                style={{
                  background: selected === m.marker_name ? 'rgba(201,164,74,0.1)' : 'transparent',
                  borderColor: selected === m.marker_name ? '#c9a44a' : 'rgba(255,255,255,0.08)',
                  color: selected === m.marker_name ? '#c9a44a' : 'rgba(255,255,255,0.6)',
                }}
              >
                <div style={{ fontWeight: selected === m.marker_name ? 700 : 400, fontSize: 13 }}>
                  {m.marker_name}
                </div>
                {m.unit && (
                  <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>
                    {m.marker_category || 'Geral'} · {m.unit}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-500 hover:text-white transition-colors rounded-xl"
          >
            CANCELAR
          </button>
          <button
            onClick={() => selected && onAdd(selected)}
            disabled={!selected || loading}
            className="flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-full transition-all"
            style={{
              background: selected ? '#c9a44a' : 'rgba(201,164,74,0.2)',
              color: selected ? '#0d1f33' : 'rgba(201,164,74,0.4)',
              cursor: selected ? 'pointer' : 'not-allowed',
            }}
          >
            PLOTAR GRÁFICO
          </button>
        </div>
      </div>
    </div>
  );
}
