import React, { memo } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

const LUZ_GOLD = '#c9a44a';
const LUZ_GOLD_FAINT = 'rgba(201,164,74,0.15)';
const LUZ_OPTIMAL = 'rgba(56,189,100,0.6)';
const LUZ_DANGER = 'rgba(239,68,68,0.6)';

export interface ChartDataPoint {
  date: string;
  value: number;
  status?: string;
}

export interface ChartWidgetData {
  name: string;
  category?: string;
  unit?: string;
  ref_min?: number | null;
  ref_max?: number | null;
  optimal_min?: number | null;
  optimal_max?: number | null;
  data: ChartDataPoint[];
}

interface Props {
  markerData: ChartWidgetData | null;
  markerName: string;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div
      style={{
        background: 'rgba(13,31,51,0.95)',
        border: '1px solid rgba(201,164,74,0.3)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 12,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontSize: 11 }}>{label}</div>
      <div style={{ color: LUZ_GOLD, fontWeight: 700, fontFamily: 'Orbitron, sans-serif', fontSize: 16 }}>
        {point.value}
        {point.payload?.unit ? <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>{point.payload?.unit}</span> : null}
      </div>
    </div>
  );
};

function ChartWidget({ markerData, markerName, loading }: Props) {
  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: LUZ_GOLD, fontSize: 12, opacity: 0.6, animation: 'pulse 2s infinite' }}>
          Carregando dados...
        </div>
      </div>
    );
  }

  if (!markerData || markerData.data.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ fontSize: 24, opacity: 0.2 }}>📈</div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>Sem dados para "{markerName}"</div>
        <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>Carregue um exame com este marcador</div>
      </div>
    );
  }

  const chartData = markerData.data.map((d) => ({
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' }),
    value: d.value,
    unit: markerData.unit,
    status: d.status,
  }));

  const gradientId = `grad-${markerName.replace(/\s/g, '-')}`;

  return (
    <div style={{ flex: 1, minHeight: 0, padding: '0 4px 8px 0' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LUZ_GOLD} stopOpacity={0.4} />
              <stop offset="95%" stopColor={LUZ_GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Reference lines for ref range */}
          {markerData.ref_min != null && (
            <ReferenceLine
              y={markerData.ref_min}
              stroke={LUZ_DANGER}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `Min ${markerData.ref_min}`, position: 'insideBottomLeft', fill: LUZ_DANGER, fontSize: 9 }}
            />
          )}
          {markerData.ref_max != null && (
            <ReferenceLine
              y={markerData.ref_max}
              stroke={LUZ_DANGER}
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `Max ${markerData.ref_max}`, position: 'insideTopLeft', fill: LUZ_DANGER, fontSize: 9 }}
            />
          )}
          {markerData.optimal_min != null && (
            <ReferenceLine
              y={markerData.optimal_min}
              stroke={LUZ_OPTIMAL}
              strokeDasharray="2 4"
              strokeWidth={1}
            />
          )}
          {markerData.optimal_max != null && (
            <ReferenceLine
              y={markerData.optimal_max}
              stroke={LUZ_OPTIMAL}
              strokeDasharray="2 4"
              strokeWidth={1}
            />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke={LUZ_GOLD}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ fill: LUZ_GOLD, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 1, stroke: LUZ_GOLD, fill: '#0d1f33' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(ChartWidget);
