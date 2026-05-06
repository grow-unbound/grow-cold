'use client';

import dynamic from 'next/dynamic';
import type { PerformanceChartInnerProps } from './performance-chart-inner';

const PerformanceChartInner = dynamic(
  () => import('./performance-chart-inner').then((m) => m.PerformanceChartInner),
  {
    ssr: false,
    loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-neutral-100" aria-hidden />,
  },
);

export function PerformanceChart(props: PerformanceChartInnerProps) {
  return <PerformanceChartInner {...props} />;
}
