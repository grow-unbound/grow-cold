'use client';

import type { MoneyEvent } from '@/lib/home-queries';

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentsReceiptsWidget({ events }: { events: MoneyEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card">
        <p className="text-small text-text-tertiary">No payments or receipts yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-h3 font-medium text-text-primary">Payments &amp; Receipts</h2>
      <ul className="flex flex-col gap-2">
        {events.map((e) => {
          const isReceipt = e.event_type === 'receipt';
          return (
            <li key={e.id} className="card flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={isReceipt ? 'badge-inward' : 'badge-outward'}>
                    {isReceipt ? '↑ Receipt' : '↓ Payment'}
                  </span>
                  <p className="truncate font-display text-[20px] font-semibold text-text-primary">
                    {e.customer_name}
                  </p>
                </div>
                <p className="type-label mt-1">
                  {e.event_date}
                  {e.payment_method ? ` · ${e.payment_method}` : ''}
                </p>
              </div>
              <p
                className={`shrink-0 font-display text-[28px] font-bold tabular-nums ${
                  isReceipt ? 'text-inward' : 'text-outward'
                }`}
              >
                {formatINR(e.amount)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
