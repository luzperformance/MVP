import React, { useState, useEffect } from 'react';
import { Responsive as ResponsiveGridLayoutOriginal } from 'react-grid-layout';
// @ts-ignore
import WidthProvider from 'react-grid-layout/build/components/WidthProvider';
const ResponsiveGridLayout = WidthProvider(ResponsiveGridLayoutOriginal);
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import EmptyStateGlass from './EmptyStateGlass';
import WidgetBuilderModal from './WidgetBuilderModal';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardBIContainerProps {
  patientId: string;
}

export default function DashboardBIContainer({ patientId }: DashboardBIContainerProps) {
  const token = useAuthStore(state => state.token);
  const [layout, setLayout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchLayout() {
      try {
        const res = await fetch(`/api/patients/${patientId}/layout`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.layout && Array.isArray(data.layout)) {
          setLayout(data.layout);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLayout();
  }, [patientId, token]);

  const saveLayout = async (newLayout: any[]) => {
    try {
      await fetch(`/api/patients/${patientId}/layout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ layout: newLayout })
      });
    } catch (err) {
      console.error('Save layout err', err);
    }
  };

  const handleLayoutChange = (currentLayout: any[], allLayouts: any) => {
    setLayout(currentLayout);
    saveLayout(currentLayout);
  };

  const handleAddWidget = (marker: string) => {
    const freshId = `widget-${Date.now()}`;
    const newWidget: any = {
      i: freshId,
      x: 0,
      y: 0,
      w: 6,
      h: 8
    };
    
    // In a real scenario we save the 'marker' context state too, 
    // but React-Grid-Layout 'Layout' object only parses positional data.
    // For MVP, we use the ID to track it or a parallel state object mapping ID -> marker configs.
    const newL = [...layout, newWidget];
    setLayout(newL);
    saveLayout(newL);
    setModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 mt-8 bg-white/5 border border-white/10 backdrop-blur rounded-xl min-h-[400px]">
        <div className="text-[#c9a44a] animate-pulse">Carregando Painel Analítico...</div>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade-in-up">
      {layout.length === 0 ? (
        <EmptyStateGlass onAdd={() => setModalOpen(true)} />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-display text-white">Dashboard Analítico</h2>
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2" style={{ padding: '8px 16px', borderRadius: 999, fontSize: 12 }}>
              <Plus size={16} /> NOVO GRÁFICO
            </button>
          </div>
          
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            isResizable={true}
          >
            {layout.map(item => (
              <div key={item.i} className="bg-white/5 border border-white/10 backdrop-blur rounded-xl flex flex-col hover:shadow-[0_0_30px_rgba(201,164,74,0.15)] transition-shadow">
                <div className="widget-drag-handle cursor-move font-display text-[#c9a44a] font-bold text-sm mb-2 border-b border-white/10 pb-2 p-4 pb-0 flex justify-between">
                  <span>Marcador Mapeado</span>
                  <button onClick={() => {
                    const l = layout.filter(x => x.i !== item.i);
                    setLayout(l);
                    saveLayout(l);
                  }} className="text-gray-500 hover:text-red-400">✕</button>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-4 pt-0">
                  <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded">
                    [ Área Reservada para o Recharts ]
                  </div>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </>
      )}

      {modalOpen && (
        <WidgetBuilderModal 
          onClose={() => setModalOpen(false)} 
          onAdd={handleAddWidget} 
        />
      )}
    </div>
  );
}
