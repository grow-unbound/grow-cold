'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Period, TrendDay } from '@/lib/home-queries';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

export function PeriodChips({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PERIOD_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={value === key ? 'chip-active' : 'chip-inactive'}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function StockTrendGraph({ series }: { series: TrendDay[] }) {
  if (!series.length) {
    return (
      <div className="card">
        <p className="type-label mb-2">Stock Trend — bags</p>
        <p className="text-small text-text-tertiary">No data for this period.</p>
      </div>
    );
  }

  const formatted = series.map((d) => ({
    ...d,
    label: d.summary_date.slice(5), // MM-DD
  }));

  return (
    <div className="card">
      <p className="type-label mb-3">Stock Trend — bags</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={formatted} barGap={2} barCategoryGap="20%">
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#7A6F61' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7A6F61' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E5DED2',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="lodged_bags" name="Inward" fill="#0B7B6E" radius={[2, 2, 0, 0]} />
          <Bar dataKey="delivered_bags" name="Outward" fill="#A83422" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
