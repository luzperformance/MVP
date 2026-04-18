import React, { useState, useEffect, useCallback } from 'react';
import ReactGridLayout from 'react-grid-layout';
const { Responsive: ResponsiveGridLayoutOriginal, WidthProvider } = ReactGridLayout as any;
const ResponsiveGridLayout = WidthProvider(ResponsiveGridLayoutOriginal);
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import EmptyStateGlass from './EmptyStateGlass';
import WidgetBuilderModal from './WidgetBuilderModal';
import ChartWidget, { ChartWidgetData } from './ChartWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardBIContainerProps {
  patientId: string;
}

interface WidgetConfig {
  i: string;         // grid id
  x: number;
  y: number;
  w: number;
  h: number;
  markerName?: string;
}

export default function DashboardBIContainer({ patientId }: DashboardBIContainerProps) {
  const token = useAuthStore((state) => state.token);

  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Timeline data: map of marker_name -> ChartWidgetData
  const [timelineMap, setTimelineMap] = useState<Record<string, ChartWidgetData>>({});
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Fetch saved layout
  useEffect(() => {
    async function fetchLayout() {
      try {
        const res = await fetch(`/api/patients/${patientId}/layout`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.layout && Array.isArray(data.layout)) {
          setLayout(data.layout);
        }
      } catch (err) {
        console.error('Fetch layout err:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLayout();
  }, [patientId, token]);

  // Fetch timeline data for all markers
  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/patients/${patientId}/exams/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, ChartWidgetData> = {};
        for (const marker of (data.timeline || [])) {
          map[marker.name] = marker;
        }
        setTimelineMap(map);
      }
    } catch (err) {
      console.error('Fetch timeline err:', err);
    } finally {
      setTimelineLoading(false);
    }
  }, [patientId, token]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const saveLayout = async (newLayout: WidgetConfig[]) => {
    try {
      await fetch(`/api/patients/${patientId}/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ layout: newLayout }),
      });
    } catch (err) {
      console.error('Save layout err:', err);
    }
  };

  const handleLayoutChange = (currentLayout: any[]) => {
    // Merge positional data back while keeping markerName metadata
    const merged: WidgetConfig[] = currentLayout.map((item) => {
      const existing = layout.find((l) => l.i === item.i);
      return {
        ...item,
        markerName: existing?.markerName,
      };
    });
    setLayout(merged);
    saveLayout(merged);
  };

  const handleAddWidget = (marker: string) => {
    const freshId = `widget-${Date.now()}`;
    const newWidget: WidgetConfig = {
      i: freshId,
      x: (layout.length * 6) % 12,
      y: Infinity, // place at bottom
      w: 6,
      h: 8,
      markerName: marker,
    };
    const newL = [...layout, newWidget];
    setLayout(newL);
    saveLayout(newL);
    setModalOpen(false);
  };

  const handleRemoveWidget = (id: string) => {
    const l = layout.filter((x) => x.i !== id);
    setLayout(l);
    saveLayout(l);
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center mt-8 bg-white/5 border border-white/10 backdrop-blur rounded-xl"
        style={{ minHeight: 200 }}
      >
        <div style={{ color: '#c9a44a', fontSize: 13, opacity: 0.7, fontFamily: 'Montserrat, sans-serif' }}>
          Carregando Painel Analítico...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 animate-fade-in-up">
      {layout.length === 0 ? (
        <EmptyStateGlass onAdd={() => setModalOpen(true)} />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2
                className="font-display font-bold text-white"
                style={{ fontSize: 18, margin: 0 }}
              >
                Dashboard Analítico
              </h2>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                {layout.length} widget{layout.length !== 1 ? 's' : ''} · arraste para reorganizar
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary flex items-center gap-2"
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                fontSize: 11,
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              <Plus size={14} />
              NOVO GRÁFICO
            </button>
          </div>

          {/* Grid */}
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
            {layout.map((item) => {
              const markerName = item.markerName || 'Marcador';
              const markerData = timelineMap[markerName] ?? null;
              return (
                <div
                  key={item.i}
                  className="bg-white/5 border border-white/10 backdrop-blur rounded-xl flex flex-col"
                  style={{
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 30px rgba(201,164,74,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                >
                  {/* Widget Header / Drag Handle */}
                  <div
                    className="widget-drag-handle cursor-move flex justify-between items-center"
                    style={{
                      padding: '12px 14px 10px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'Orbitron, sans-serif',
                          color: '#c9a44a',
                          fontWeight: 700,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {markerName}
                      </div>
                      {markerData?.unit && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                          {markerData.category || 'Biomarcador'} · {markerData.unit}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWidget(item.i)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: '2px 4px',
                        borderRadius: 4,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'; }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Chart Area */}
                  <div style={{ flex: 1, minHeight: 0, padding: '8px 4px 4px 8px' }}>
                    <ChartWidget
                      markerName={markerName}
                      markerData={markerData}
                      loading={timelineLoading}
                    />
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </>
      )}

      {modalOpen && (
        <WidgetBuilderModal
          patientId={patientId}
          onClose={() => setModalOpen(false)}
          onAdd={handleAddWidget}
        />
      )}
    </div>
  );
}
