'use client';

import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LotStatusBadge } from '@/components/shell/lot-status-badge';
import { useLotDetail } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

export default function LotDetailPage() {
  const { t } = useTranslation('pages');
  const { t: tCharges } = useTranslation('charges');
  const params = useParams();
  const lotId = typeof params.lotId === 'string' ? params.lotId : null;
  const q = useLotDetail(lotId);
  const role = useSessionStore((s) => s.role);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <Link href="/inventory" className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  const lot = q.data.data;
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/inventory" className="text-caption font-medium text-primary-600 hover:underline">
            ← {t('inventory.title')}
          </Link>
          <h1 className="mt-1 h2 flex flex-wrap items-center gap-2">
            {lot.lot_number}
            <LotStatusBadge status={lot.status} />
          </h1>
        </div>
        <div className="flex flex-col items-stretch gap-2 self-end sm:items-end sm:self-start">
          <Link
            href={`/inventory/${lotId}/record-delivery`}
            className="btn-primary inline-flex min-h-touch items-center justify-center px-4 text-center sm:min-w-[12rem]"
          >
            {t('inventory.add_delivery_cta')}
          </Link>
          {role !== 'STAFF' ? (
          <div className="relative self-end">
            <button
              type="button"
              className="min-h-touch min-w-touch rounded-base border border-neutral-200 p-2 text-neutral-700 hover:bg-neutral-50"
              aria-label={t('inventory.edit_lot')}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreVertical className="h-5 w-5" aria-hidden />
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-base border border-neutral-200 bg-white py-1 shadow-lg"
                role="menu"
              >
                <Link
                  href={`/inventory/${lotId}/charges`}
                  className="block px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {tCharges('title')}
                </Link>
                <Link
                  href={`/transactions/payments/new?lotId=${encodeURIComponent(lotId)}`}
                  className="block px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('operational_payment.add_from_lot')}
                </Link>
                <Link
                  href={`/inventory/${lotId}/edit`}
                  className="block px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('inventory.edit_lot')}
                </Link>
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </div>

      <div className="card grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-caption font-medium text-neutral-500">{t('inventory.party')}</p>
          <p className="text-sm font-medium text-neutral-900">
            {lot.customer_code} — {lot.customer_name}
          </p>
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
          <p className="text-caption font-medium text-neutral-500">{t('inventory.notes')}</p>
          <p className="text-body-sm text-neutral-800">{lot.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
