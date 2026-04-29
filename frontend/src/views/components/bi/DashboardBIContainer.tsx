import React, { useState, useEffect, useCallback, useRef } from 'react';
// react-grid-layout v2: WidthProvider lives in the /legacy subpath
import { WidthProvider, ResponsiveReactGridLayout } from 'react-grid-layout/legacy';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import EmptyStateGlass from './EmptyStateGlass';
import WidgetBuilderModal from './WidgetBuilderModal';
import ChartWidget, { ChartWidgetData } from './ChartWidget';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout);

interface DashboardBIContainerProps {
  patientId: string;
}

interface WidgetConfig {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  markerName?: string;
}

export default function DashboardBIContainer({ patientId }: DashboardBIContainerProps) {
  const token = useAuthStore((state) => state.token);

  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [timelineMap, setTimelineMap] = useState<Record<string, ChartWidgetData>>({});
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Debounce timer ref for layout saves
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch persisted layout ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchLayout() {
      try {
        const res = await fetch(`/api/patients/${patientId}/layout`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data?.layout && Array.isArray(data.layout)) {
          setWidgets(data.layout);
        }
      } catch (err) {
        console.error('Fetch layout err:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLayout();
    return () => { cancelled = true; };
  }, [patientId, token]);

  // ─── Fetch timeline (biomarker series) ────────────────────────────────────
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

  // ─── Persist layout (debounced 600ms) ──────────────────────────────────────
  const saveLayout = useCallback((newWidgets: WidgetConfig[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/patients/${patientId}/layout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ layout: newWidgets }),
        });
      } catch (err) {
        console.error('Save layout err:', err);
      }
    }, 600);
  }, [patientId, token]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleLayoutChange = useCallback((currentLayout: readonly { i: string; x: number; y: number; w: number; h: number }[]) => {
    const merged: WidgetConfig[] = (currentLayout as WidgetConfig[]).map((item) => {
      const existing = widgets.find((w) => w.i === item.i);
      return { ...item, markerName: existing?.markerName };
    });
    setWidgets(merged);
    saveLayout(merged);
  }, [saveLayout]);

  const handleAddWidget = useCallback((marker: string) => {
    setWidgets((prev) => {
      const next: WidgetConfig[] = [
        ...prev,
        {
          i: `widget-${Date.now()}`,
          x: (prev.length * 6) % 12,
          y: Infinity,
          w: 6,
          h: 8,
          markerName: marker,
        },
      ];
      saveLayout(next);
      return next;
    });
    setModalOpen(false);
  }, [saveLayout]);

  const handleRemoveWidget = useCallback((id: string) => {
    setWidgets((prev) => {
      const next = prev.filter((w) => w.i !== id);
      saveLayout(next);
      return next;
    });
  }, [saveLayout]);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          marginTop: 32,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
        }}
      >
        <span style={{ color: '#c9a44a', fontSize: 13, opacity: 0.7, fontFamily: 'Montserrat, sans-serif' }}>
          Carregando Painel Analítico...
        </span>
      </div>
    );
  }

  const gridLayout = widgets.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));

  return (
    <div style={{ marginTop: 32 }}>
      {widgets.length === 0 ? (
        <EmptyStateGlass onAdd={() => setModalOpen(true)} />
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: 16, fontWeight: 700 }}>
                Dashboard Analítico
              </h2>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''} · arraste para reorganizar
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg,#c9a44a,#8b6914)',
                border: 'none',
                borderRadius: 999,
                padding: '8px 18px',
                color: '#fff',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              NOVO GRÁFICO
            </button>
          </div>

          {/* ── Grid ── */}
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: gridLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            draggableHandle=".widget-drag-handle"
            isResizable
            onLayoutChange={handleLayoutChange}
          >
            {widgets.map((item) => {
              const markerName = item.markerName || 'Marcador';
              const markerData = timelineMap[markerName] ?? null;
              return (
                <div
                  key={item.i}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Drag handle / widget header */}
                  <div
                    className="widget-drag-handle"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px 8px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'move',
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#c9a44a', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {markerName}
                      </div>
                      {markerData?.unit && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>
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
                        padding: '2px 5px',
                        borderRadius: 4,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'; }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Chart */}
                  <div style={{ flex: 1, minHeight: 0, padding: '6px 4px 4px 6px' }}>
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
