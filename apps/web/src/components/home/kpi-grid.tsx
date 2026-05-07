'use client';

import type { SnapshotData } from '@/lib/home-queries';

type Kpi = { label: string; value: string; sub?: string; colorClass?: string };

function buildKpis(s: SnapshotData): Kpi[] {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  const money = (n: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);

  return [
    {
      label: 'Total Bags',
      value: fmt(s.total_bags),
      sub: `${fmt(s.active_lots)} active lots`,
    },
    {
      label: 'Cash Balance',
      value: money(s.cash_balance),
      sub: `${money(s.total_receivable)} receivable`,
    },
    {
      label: 'Today Inward',
      value: fmt(s.today_lodged_bags),
      sub: 'bags lodged today',
      colorClass: 'text-inward',
    },
    {
      label: 'Stale Lots',
      value: fmt(s.stale_lots),
      sub: `${fmt(s.total_lots)} total lots`,
      colorClass: s.stale_lots > 0 ? 'text-pending' : undefined,
    },
  ];
}

function KpiCard({ label, value, sub, colorClass }: Kpi) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="type-label">{label}</p>
      <p
        className={`font-display text-[38px] font-bold leading-none tabular-nums ${colorClass ?? 'text-text-primary'}`}
      >
        {value}
      </p>
      {sub && <p className="text-small text-text-tertiary">{sub}</p>}
    </div>
  );
}

export function KpiGrid({ snapshot }: { snapshot: SnapshotData }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {buildKpis(snapshot).map((k) => (
        <KpiCard key={k.label} {...k} />
      ))}
    </div>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-24 rounded-lg" />
      ))}
    </div>
  );
}
