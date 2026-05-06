'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface PerformanceSeriesPoint {
  label: string;
  lodged: number;
  delivered: number;
}

export interface PerformanceChartInnerProps {
  series: PerformanceSeriesPoint[];
  lodgedColor: string;
  deliveredColor: string;
  lodgedLegend: string;
  deliveredLegend: string;
  height?: number;
  valueFormatter?: (n: number) => string;
}

function coerceTooltipNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  if (Array.isArray(value) && value.length > 0) return coerceTooltipNumber(value[0]);
  return 0;
}

export function PerformanceChartInner({
  series,
  lodgedColor,
  deliveredColor,
  lodgedLegend,
  deliveredLegend,
  height = 220,
  valueFormatter = (n) => String(Math.round(n)),
}: PerformanceChartInnerProps) {
  if (series.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-dashboard-muted">—</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={series} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => valueFormatter(Number(v))} />
        <Tooltip
          formatter={(value: unknown, name) => [valueFormatter(coerceTooltipNumber(value)), name]}
          labelStyle={{ color: '#374151' }}
          contentStyle={{ borderRadius: 8 }}
        />
        <Legend />
        <Bar dataKey="lodged" name={lodgedLegend} fill={lodgedColor} radius={[2, 2, 0, 0]} />
        <Bar dataKey="delivered" name={deliveredLegend} fill={deliveredColor} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
