'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LotStatusBadge } from '@/components/shell/lot-status-badge';
import { useLotDetail } from '@/lib/shell-queries';

export default function LotDetailPage() {
  const { t } = useTranslation('pages');
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : null;
  const q = useLotDetail(lotId);

  if (!lotId) {
    return null;
  }

  if (q.isPending) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('loading')}</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="card w-full">
        <p className="text-danger-600 text-body-sm">{t('error_load')}</p>
        <Link href="/inventory" className="btn-secondary btn-base mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  const lot = q.data.data;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/inventory" className="text-caption font-medium text-primary-600 hover:underline">
            ← {t('inventory.title')}
          </Link>
          <h1 className="mt-1 h2 flex flex-wrap items-center gap-2">
            {lot.lot_number}
            <LotStatusBadge status={lot.status} />
          </h1>
        </div>
      </div>

      <div className="card grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.customer')}</p>
          <p className="text-sm font-medium text-neutral-900">{lot.customer_name}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.product')}</p>
          <p className="text-sm font-medium text-neutral-900">{lot.product_name}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.bags')}</p>
          <p className="text-sm text-neutral-900">
            {lot.balance_bags} / {lot.original_bags}
          </p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.lodgement')}</p>
          <p className="text-sm text-neutral-900">{lot.lodgement_date}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.rental_mode')}</p>
          <p className="text-sm text-neutral-900">{lot.rental_mode}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.locations')}</p>
          <p className="text-sm text-neutral-900">{lot.location_ids.length}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.driver_name')}</p>
          <p className="text-sm text-neutral-900">{lot.driver_name?.trim() ? lot.driver_name : '—'}</p>
        </div>
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.vehicle_number')}</p>
          <p className="text-sm text-neutral-900">{lot.vehicle_number?.trim() ? lot.vehicle_number : '—'}</p>
        </div>
      </div>
      {lot.notes ? (
        <div className="card">
          <p className="text-caption font-medium text-neutral-500">Notes</p>
          <p className="text-body-sm text-neutral-800">{lot.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
