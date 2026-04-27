'use client';

import type { LotDetailDeliveryRow } from '@growcold/shared';
import { formatYmdLong } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

export function DeliveriesList({ deliveries }: { deliveries: LotDetailDeliveryRow[] }) {
  const { t } = useTranslation('pages');

  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
        <p className="text-base font-medium text-neutral-900">{t('lot_detail.deliveries_empty_title')}</p>
        <p className="text-sm text-neutral-500">{t('lot_detail.deliveries_empty_body')}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 px-4 pb-6 pt-2">
      {deliveries.map((d) => {
        const driver = d.driver_name?.trim();
        const vehicle = d.vehicle_number?.trim();
        const meta = t('lot_detail.bags_count', { count: d.num_bags_out });
        const driverPart =
          driver && driver.length > 0 ? ` • ${t('lot_detail.driver')}: ${driver}` : '';
        return (
          <li
            key={d.id}
            className="rounded-xl border border-neutral-200/80 bg-white px-3 py-3 shadow-sm"
          >
            <p className="text-base font-semibold text-neutral-900">{formatYmdLong(d.delivery_date)}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {meta}
              {driverPart}
            </p>
            {vehicle && vehicle.length > 0 ? (
              <p className="mt-0.5 text-sm text-neutral-600">
                {t('lot_detail.vehicle')}: {vehicle}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
