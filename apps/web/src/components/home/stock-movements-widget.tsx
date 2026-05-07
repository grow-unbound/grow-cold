'use client';

import type { StockEvent } from '@/lib/home-queries';

export function StockMovementsWidget({ events }: { events: StockEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card">
        <p className="text-small text-text-tertiary">
          No stock movements yet. Tap + to record your first inward.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-h3 font-medium text-text-primary">Stock Movements</h2>
      <ul className="flex flex-col gap-2">
        {events.map((e) => {
          const isInward = e.event_type === 'lodgement';
          return (
            <li key={e.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="type-label">
                    {e.lot_number} · {e.event_date}
                  </p>
                  <p className="mt-0.5 font-display text-[20px] font-semibold leading-tight text-text-primary">
                    {e.customer_name}
                  </p>
                  <p className="mt-1.5 text-small text-text-secondary">{e.product_name}</p>
                  <span
                    className={`mt-1.5 inline-flex ${isInward ? 'badge-inward' : 'badge-outward'}`}
                  >
                    {isInward ? '✓ Inward · confirmed' : '↓ Outward'}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-[28px] font-bold leading-none tabular-nums text-text-primary">
                    {e.num_bags}
                  </p>
                  <p className="type-label mt-0.5">bags</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
