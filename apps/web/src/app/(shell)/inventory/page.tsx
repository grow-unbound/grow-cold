'use client';

import { LOT_STATUS, type LotStatus } from '@growcold/shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LotStatusBadge } from '@/components/shell/lot-status-badge';
import { useCreateLot, useCustomersList, useLotsList, useProductsList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

type LotForm = {
  lot_number: string;
  customer_id: string;
  product_id: string;
  original_bags: number;
  lodgement_date: string;
  rental_mode: 'YEARLY' | 'MONTHLY' | 'BROUGHT_FORWARD';
  driver_name: string;
  vehicle_number: string;
  notes: string;
};

export default function InventoryPage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusParam = statusFilter === 'ALL' ? undefined : statusFilter;
  const lotsQ = useLotsList(warehouseId, statusParam);
  const customersQ = useCustomersList(warehouseId);
  const productsQ = useProductsList();
  const createLot = useCreateLot(warehouseId);

  const statusChips = useMemo(() => {
    if (role === 'STAFF') return ['ALL', 'ACTIVE', 'STALE'] as const;
    return ['ALL', ...LOT_STATUS] as const;
  }, [role]);

  const form = useForm<LotForm>({
    defaultValues: {
      lot_number: '',
      customer_id: '',
      product_id: '',
      original_bags: 1,
      lodgement_date: new Date().toISOString().slice(0, 10),
      rental_mode: 'MONTHLY',
      driver_name: '',
      vehicle_number: '',
      notes: '',
    },
  });

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="h2">{t('inventory.title')}</h1>
        {role !== 'STAFF' && (
          <button type="button" className="btn-primary btn-base w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
            {t('inventory.add_lot')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {statusChips.map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              'min-h-touch rounded-base border px-2.5 py-1 text-caption font-semibold transition-colors',
              statusFilter === s
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50',
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? t('all_statuses') : s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {lotsQ.isPending && <p className="text-body-sm text-neutral-600">{t('loading')}</p>}
      {lotsQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

      {lotsQ.data && lotsQ.data.data.length === 0 && (
        <div className="card w-full">
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        </div>
      )}

      {lotsQ.data && lotsQ.data.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {lotsQ.data.data.map((lot) => (
            <li key={lot.id} className="card flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/inventory/${lot.id}`} className="text-sm font-semibold text-primary-600 hover:underline">
                    {lot.lot_number}
                  </Link>
                  <LotStatusBadge status={lot.status} />
                </div>
                <p className="mt-0.5 truncate text-caption text-neutral-600">
                  {lot.customer_name} · {lot.product_name}
                </p>
                <p className="text-caption text-neutral-500">
                  {t('inventory.bags')}: {lot.balance_bags}/{lot.original_bags} · {t('inventory.lodgement')}:{' '}
                  {lot.lodgement_date}
                </p>
              </div>
              <Link href={`/inventory/${lot.id}`} className="btn-secondary btn-base shrink-0 self-start sm:self-center">
                {t('view')}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {dialogOpen && role !== 'STAFF' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="presentation"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="card max-h-[90vh] w-full max-w-md overflow-y-auto"
            role="dialog"
            aria-labelledby="new-lot-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="new-lot-title" className="h3 mb-3">
              {t('inventory.create_title')}
            </h2>
            <form
              className="flex flex-col gap-3"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await createLot.mutateAsync({
                    warehouse_id: warehouseId,
                    customer_id: values.customer_id,
                    product_id: values.product_id,
                    lot_number: values.lot_number,
                    original_bags: values.original_bags,
                    lodgement_date: values.lodgement_date,
                    rental_mode: values.rental_mode,
                    location_ids: [],
                    driver_name: values.driver_name || undefined,
                    vehicle_number: values.vehicle_number || undefined,
                    notes: values.notes || undefined,
                  });
                  setDialogOpen(false);
                  form.reset({
                    ...form.getValues(),
                    lot_number: '',
                    driver_name: '',
                    vehicle_number: '',
                    notes: '',
                  });
                } catch {
                  /* toast later */
                }
              })}
            >
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="lot_number">
                  {t('inventory.lot_number')} *
                </label>
                <input id="lot_number" className="input-base" {...form.register('lot_number', { required: true })} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="customer_id">
                  {t('inventory.customer')} *
                </label>
                <select id="customer_id" className="input-base" {...form.register('customer_id', { required: true })}>
                  <option value="">—</option>
                  {(customersQ.data?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="product_id">
                  {t('inventory.product')} *
                </label>
                <select id="product_id" className="input-base" {...form.register('product_id', { required: true })}>
                  <option value="">—</option>
                  {(productsQ.data?.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="original_bags">
                  {t('inventory.bags')} *
                </label>
                <input
                  id="original_bags"
                  type="number"
                  min={1}
                  className="input-base"
                  {...form.register('original_bags', { valueAsNumber: true, min: 1 })}
                />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="lodgement_date">
                  {t('inventory.lodgement')} *
                </label>
                <input id="lodgement_date" type="date" className="input-base" {...form.register('lodgement_date')} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="rental_mode">
                  {t('inventory.rental_mode')}
                </label>
                <select id="rental_mode" className="input-base" {...form.register('rental_mode')}>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="YEARLY">YEARLY</option>
                  <option value="BROUGHT_FORWARD">BROUGHT_FORWARD</option>
                </select>
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="driver_name">
                  {t('inventory.driver_name')}
                </label>
                <input id="driver_name" className="input-base" {...form.register('driver_name')} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="vehicle_number">
                  {t('inventory.vehicle_number')}
                </label>
                <input id="vehicle_number" className="input-base" {...form.register('vehicle_number')} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="notes">
                  Notes
                </label>
                <textarea id="notes" className="input-base min-h-[4rem]" {...form.register('notes')} />
              </div>
              {createLot.isError && <p className="text-caption text-danger-600">{t('save_error')}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary btn-base" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-base" disabled={createLot.isPending}>
                  {t('inventory.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
