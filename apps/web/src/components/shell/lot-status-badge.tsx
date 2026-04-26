import type { LotStatus } from '@growcold/shared';
import { cn } from '@/lib/utils';

export function LotStatusBadge({ status }: { status: LotStatus }) {
  const cls =
    status === 'ACTIVE'
      ? 'badge-active'
      : status === 'STALE'
        ? 'badge-stale'
        : status === 'DISPUTED'
          ? 'badge-disputed'
          : status === 'CLEARED' || status === 'DELIVERED'
            ? 'badge-cleared'
            : 'inline-flex items-center rounded-sm bg-neutral-100 px-1.5 py-0.5 text-label font-semibold text-neutral-700';

  return <span className={cn(cls)}>{status.replaceAll('_', ' ')}</span>;
}
