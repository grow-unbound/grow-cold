'use client';

import type { AppRole } from '@/stores/session-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateLotRequestSchema, CreateStockDeliveryRequestSchema } from '@growcold/shared';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import {
  useCreateLot,
  useCreateStockDelivery,
  useCustomersList,
  useLotsList,
  useProductsList,
  useStockLocations,
} from '@/lib/shell-queries';
import { cn } from '@/lib/utils';

const GREEN = '#00B14F';

const lodgementFormSchema = CreateLotRequestSchema;
type LodgementForm = z.infer<typeof lodgementFormSchema>;

const deliveryFormSchema = CreateStockDeliveryRequestSchema;
type DeliveryForm = z.infer<typeof deliveryFormSchema>;

type Mode = 'lodgement' | 'delivery';

interface Props {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  role: AppRole;
}

export function RecordTransactionDialog({ open, onClose, warehouseId, role }: Props) {
  const { t } = useTranslation('pages');
  const canLodgement = role !== 'STAFF';
  const [mode, setMode] = useState<Mode>('delivery');
  const customersQ = useCustomersList(warehouseId);
  const productsQ = useProductsList();
  const lotsQ = useLotsList(warehouseId);
  const locationsQ = useStockLocations(warehouseId);
  const createLot = useCreateLot(warehouseId);
  const createDelivery = useCreateStockDelivery(warehouseId);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const lForm = useForm<LodgementForm>({
    resolver: zodResolver(lodgementFormSchema),
    defaultValues: {
      warehouse_id: warehouseId,
      customer_id: '',
      product_id: '',
      lot_number: '',
      original_bags: 1,
      lodgement_date: today,
      rental_mode: 'MONTHLY',
      location_ids: [],
      driver_name: '',
      vehicle_number: '',
      notes: '',
    },
  });

  const dForm = useForm<DeliveryForm>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      warehouse_id: warehouseId,
      lot_id: '',
      num_bags_out: 1,
      delivery_date: today,
      notes: '',
      driver_name: '',
      vehicle_number: '',
      location_ids: [],
    },
  });

  useEffect(() => {
    lForm.setValue('warehouse_id', warehouseId);
    dForm.setValue('warehouse_id', warehouseId);
  }, [warehouseId, lForm, dForm]);

  useEffect(() => {
    if (!open) return;
    if (!canLodgement && mode === 'lodgement') setMode('delivery');
  }, [open, canLodgement, mode]);

  const deliverableLots = useMemo(() => {
    const rows = lotsQ.data?.data ?? [];
    return rows.filter((l) => l.balance_bags > 0);
  }, [lotsQ.data]);

  const selectedLotId = dForm.watch('lot_id');
  const selectedLot = deliverableLots.find((l) => l.id === selectedLotId);
  const maxOut = selectedLot?.balance_bags ?? 0;

  if (!open) return null;

  async function onSubmitLodgement(values: LodgementForm) {
    try {
      await createLot.mutateAsync(values);
      onClose();
      lForm.reset({
        ...lForm.getValues(),
        warehouse_id: warehouseId,
        lot_number: '',
        customer_id: '',
        product_id: '',
        driver_name: '',
        vehicle_number: '',
        notes: '',
      });
    } catch {
      /* surfaced below */
    }
  }

  async function onSubmitDelivery(values: DeliveryForm) {
    try {
      await createDelivery.mutateAsync(values);
      onClose();
      dForm.reset({
        warehouse_id: warehouseId,
        lot_id: '',
        num_bags_out: 1,
        delivery_date: today,
        notes: '',
        driver_name: '',
        vehicle_number: '',
        location_ids: [],
      });
    } catch {
      /* surfaced */
    }
  }

  const locationOptions = locationsQ.data?.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl"
        role="dialog"
        aria-labelledby="record-stock-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 id="record-stock-title" className="text-lg font-semibold text-neutral-900">
            {t('stock.record_title')}
          </h2>
        </div>

        {canLodgement && (
          <div className="flex gap-2 border-b border-neutral-100 px-4 py-2">
            <button
              type="button"
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-semibold',
                mode === 'lodgement' ? 'text-white' : 'bg-neutral-100 text-neutral-600',
              )}
              style={mode === 'lodgement' ? { backgroundColor: GREEN } : undefined}
              onClick={() => setMode('lodgement')}
            >
              {t('stock.lodgement')}
            </button>
            <button
              type="button"
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-semibold',
                mode === 'delivery' ? 'text-white' : 'bg-neutral-100 text-neutral-600',
              )}
              style={mode === 'delivery' ? { backgroundColor: GREEN } : undefined}
              onClick={() => setMode('delivery')}
            >
              {t('stock.delivery')}
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {mode === 'lodgement' && (
            <form className="flex flex-col gap-3" onSubmit={lForm.handleSubmit(onSubmitLodgement)}>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_customer">
                  {t('stock.select_customer')}
                </label>
                <select
                  id="l_customer"
                  className="input-base"
                  {...lForm.register('customer_id', { required: true })}
                >
                  <option value="">—</option>
                  {(customersQ.data?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_product">
                  {t('stock.select_product')}
                </label>
                <select
                  id="l_product"
                  className="input-base"
                  {...lForm.register('product_id', { required: true })}
                >
                  <option value="">—</option>
                  {(productsQ.data?.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_lotnum">
                  {t('inventory.lot_number')} *
                </label>
                <input id="l_lotnum" className="input-base" {...lForm.register('lot_number')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_bags">
                  {t('stock.bags_required')}
                </label>
                <input
                  id="l_bags"
                  type="number"
                  min={1}
                  className="input-base"
                  {...lForm.register('original_bags', { valueAsNumber: true })}
                />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_date">
                  {t('inventory.lodgement')} *
                </label>
                <input id="l_date" type="date" className="input-base" {...lForm.register('lodgement_date')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_rental">
                  {t('inventory.rental_mode')}
                </label>
                <select id="l_rental" className="input-base" {...lForm.register('rental_mode')}>
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="YEARLY">YEARLY</option>
                  <option value="BROUGHT_FORWARD">BROUGHT_FORWARD</option>
                </select>
              </div>
              <LocationMultiField
                options={locationOptions}
                value={lForm.watch('location_ids') ?? []}
                onChange={(ids) => lForm.setValue('location_ids', ids)}
              />
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_driver">
                  {t('inventory.driver_name')}
                </label>
                <input id="l_driver" className="input-base" {...lForm.register('driver_name')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_vehicle">
                  {t('inventory.vehicle_number')}
                </label>
                <input id="l_vehicle" className="input-base" {...lForm.register('vehicle_number')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="l_notes">
                  {t('stock.notes')}
                </label>
                <textarea id="l_notes" className="input-base min-h-[4rem]" {...lForm.register('notes')} />
              </div>
              {createLot.isError && <p className="error-text">{t('save_error')}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  {t('stock.cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={createLot.isPending}>
                  {t('stock.save')}
                </button>
              </div>
            </form>
          )}

          {mode === 'delivery' && (
            <form className="flex flex-col gap-3" onSubmit={dForm.handleSubmit(onSubmitDelivery)}>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_lot">
                  {t('stock.select_lot')}
                </label>
                <select
                  id="d_lot"
                  className="input-base"
                  {...dForm.register('lot_id', { required: true })}
                >
                  <option value="">—</option>
                  {deliverableLots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lot_number} · {l.balance_bags} bags · {l.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_bags">
                  {t('stock.bags_required')}
                </label>
                <input
                  id="d_bags"
                  type="number"
                  min={1}
                  max={maxOut || undefined}
                  className="input-base"
                  {...dForm.register('num_bags_out', { valueAsNumber: true })}
                />
                {selectedLot ? (
                  <p className="mt-1 text-caption text-neutral-500">Max {selectedLot.balance_bags}</p>
                ) : null}
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_date">
                  {t('transactions.date')} *
                </label>
                <input id="d_date" type="date" className="input-base" {...dForm.register('delivery_date')} />
              </div>
              <LocationMultiField
                options={locationOptions}
                value={dForm.watch('location_ids') ?? []}
                onChange={(ids) => dForm.setValue('location_ids', ids)}
              />
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_driver">
                  {t('inventory.driver_name')}
                </label>
                <input id="d_driver" className="input-base" {...dForm.register('driver_name')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_vehicle">
                  {t('inventory.vehicle_number')}
                </label>
                <input id="d_vehicle" className="input-base" {...dForm.register('vehicle_number')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="d_notes">
                  {t('stock.notes')}
                </label>
                <textarea id="d_notes" className="input-base min-h-[4rem]" {...dForm.register('notes')} />
              </div>
              {createDelivery.isError && <p className="error-text">{t('save_error')}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  {t('stock.cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={createDelivery.isPending}>
                  {t('stock.save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function LocationMultiField(props: {
  options: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation('pages');
  return (
    <div className="form-field">
      <span className="text-label-lg font-semibold text-neutral-700">{t('inventory.locations')}</span>
      <div className="mt-1 flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border border-neutral-200 p-2">
        {props.options.length === 0 ? (
          <span className="text-caption text-neutral-400">—</span>
        ) : (
          props.options.map((loc) => {
            const on = props.value.includes(loc.id);
            return (
              <button
                key={loc.id}
                type="button"
                className={cn(
                  'rounded-full border px-2 py-1 text-caption font-medium',
                  on ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 text-neutral-600',
                )}
                onClick={() => {
                  if (on) props.onChange(props.value.filter((id) => id !== loc.id));
                  else props.onChange([...props.value, loc.id]);
                }}
              >
                {loc.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
