import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  primary: string;
  secondary?: string;
  trend?: string;
  trendPositive?: boolean | null;
}

export function KpiCard({ title, primary, secondary, trend, trendPositive }: KpiCardProps) {
  return (
    <div
      className={cn(
        'flex min-h-[100px] flex-1 flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]',
      )}
    >
      <span className="text-xs font-medium text-dashboard-muted">{title}</span>
      <span className="text-xl font-bold text-neutral-900">{primary}</span>
      {secondary ? <span className="text-sm text-dashboard-muted">{secondary}</span> : null}
      {trend ? (
        <span
          className={cn(
            'text-sm',
            trendPositive === true && 'text-dashboard-money',
            trendPositive === false && 'text-dashboard-danger',
            trendPositive === null || trendPositive === undefined ? 'text-dashboard-muted' : null,
          )}
        >
          {trend}
        </span>
      ) : null}
    </div>
  );
}
