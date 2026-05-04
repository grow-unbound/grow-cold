'use client';

/* eslint-disable react-hooks/incompatible-library -- react-hook-form watch() is the supported API */
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { UpdateLotRequest } from '@growcold/shared';
import {
  checkLotNumberAvailable,
  useCreateLot,
  useCustomersList,
  useLocationsList,
  useLotDetail,
  useProductsList,
  useSuggestLotNumber,
  useUpdateLot,
} from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

const lotFormSchema = z.object({
  customer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  original_bags: z.number().int().positive(),
  lot_number: z.string().min(1).max(200),
  location_ids: z.array(z.string().uuid()).min(1),
  driver_name: z.string().max(200).optional(),
  vehicle_number: z.string().max(64).optional(),
  notes: z.string().max(2000).optional(),
});

type LotFormValues = z.infer<typeof lotFormSchema>;

function partyLabel(code: string, name: string): string {
  return `${code} — ${name}`;
}

export interface LotFormScreenProps {
  mode: 'create' | 'edit';
  lotId?: string;
}

export function LotFormScreen({ mode, lotId }: LotFormScreenProps) {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);

  const [zone2Open, setZone2Open] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [partyQ, setPartyQ] = useState('');
  const [productQ, setProductQ] = useState('');
  const [locQ, setLocQ] = useState('');

  const [lotNumberManual, setLotNumberManual] = useState(mode === 'edit');
  const [lotNumberUniqueError, setLotNumberUniqueError] = useState<string | null>(null);

  const [confirmUnlockLotNumber, setConfirmUnlockLotNumber] = useState(false);
  const [confirmUnlockPartyProduct, setConfirmUnlockPartyProduct] = useState(false);
  const [lotNumberUnlocked, setLotNumberUnlocked] = useState(false);
  const [partyProductUnlocked, setPartyProductUnlocked] = useState(false);

  const lotAppliedRef = useRef(false);

  const customersQ = useCustomersList(warehouseId);
  const productsQ = useProductsList();
  const locationsQ = useLocationsList(warehouseId);
  const lotQ = useLotDetail(mode === 'edit' ? (lotId ?? null) : null);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      customer_id: '',
      product_id: '',
      original_bags: 1,
      lot_number: '',
      location_ids: [],
      driver_name: '',
      vehicle_number: '',
      notes: '',
    },
    mode: 'onBlur',
  });

  const bagsWatch = form.watch('original_bags');
  const locIdsWatch = form.watch('location_ids');

  const suggestQ = useSuggestLotNumber(
    warehouseId,
    typeof bagsWatch === 'number' && bagsWatch > 0 ? bagsWatch : 1,
    mode === 'create' && !lotNumberManual,
  );

  const createLot = useCreateLot(warehouseId);
  const updateLot = useUpdateLot(warehouseId);

  useEffect(() => {
    lotAppliedRef.current = false;
    setPartyProductUnlocked(false);
    setLotNumberUnlocked(false);
    setLotNumberManual(mode === 'edit');
    setConfirmUnlockLotNumber(false);
    setConfirmUnlockPartyProduct(false);
  }, [lotId, mode]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    function apply() {
      setZone2Open(mq.matches);
    }
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !lotQ.data?.data || lotAppliedRef.current) return;
    const d = lotQ.data.data;
    lotAppliedRef.current = true;
    form.reset({
      customer_id: d.customer_id,
      product_id: d.product_id,
      original_bags: d.original_bags,
      lot_number: d.lot_number,
      location_ids: d.location_ids ?? [],
      driver_name: d.driver_name ?? '',
      vehicle_number: d.vehicle_number ?? '',
      notes: d.notes ?? '',
    });
  }, [mode, lotQ.data, form]);

  useEffect(() => {
    if (mode !== 'create' || lotNumberManual) return;
    const s = suggestQ.data?.suggested_lot_number;
    if (!s) return;
    form.setValue('lot_number', s, { shouldValidate: false });
  }, [mode, lotNumberManual, suggestQ.data?.suggested_lot_number, form]);

  const lotDetail = lotQ.data?.data;
  const hasDeliveries = lotDetail?.has_deliveries ?? false;

  const hardPartyLock = mode === 'edit' && hasDeliveries;

  const lotNumberLocked = mode === 'edit' && !lotNumberUnlocked;

  const customers = useMemo(() => customersQ.data?.data ?? [], [customersQ.data?.data]);
  const products = useMemo(() => productsQ.data?.data ?? [], [productsQ.data?.data]);
  const locations = useMemo(() => locationsQ.data?.data ?? [], [locationsQ.data?.data]);

  const customerIdWatch = form.watch('customer_id');
  const productIdWatch = form.watch('product_id');
  const lotNumberWatch = form.watch('lot_number');

  const filteredParties = useMemo(() => {
    const q = partyQ.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.customer_code.toLowerCase().includes(q) || c.customer_name.toLowerCase().includes(q),
    );
  }, [customers, partyQ]);

  const filteredProducts = useMemo(() => {
    const q = productQ.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.product_name.toLowerCase().includes(q));
  }, [products, productQ]);

  const filteredLocations = useMemo(() => {
    const q = locQ.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, locQ]);

  const selectedParty = useMemo(
    () => customers.find((c) => c.id === customerIdWatch),
    [customers, customerIdWatch],
  );
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productIdWatch),
    [products, productIdWatch],
  );

  const validateLotNumberUnique = useCallback(async (): Promise<boolean> => {
    if (!warehouseId) return true;
    const v = form.getValues('lot_number').trim();
    if (!v) return true;
    const ex = mode === 'edit' ? lotId : undefined;
    const ok = await checkLotNumberAvailable(warehouseId, v, ex);
    if (!ok) {
      setLotNumberUniqueError(t('inventory.lot_number_taken'));
      form.setError('lot_number', { message: t('inventory.lot_number_taken') });
      return false;
    }
    setLotNumberUniqueError(null);
    form.clearErrors('lot_number');
    return true;
  }, [warehouseId, form, mode, lotId, t]);

  const zone1Ready =
    Boolean(customerIdWatch) &&
    Boolean(productIdWatch) &&
    typeof bagsWatch === 'number' &&
    bagsWatch > 0 &&
    Boolean(lotNumberWatch?.trim()) &&
    (locIdsWatch?.length ?? 0) > 0 &&
    !lotNumberUniqueError;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!warehouseId || role === 'STAFF') return;
    const uniqueOk = await validateLotNumberUnique();
    if (!uniqueOk) return;

    try {
      if (mode === 'create') {
        await createLot.mutateAsync({
          warehouse_id: warehouseId,
          customer_id: values.customer_id,
          product_id: values.product_id,
          lot_number: values.lot_number.trim(),
          original_bags: values.original_bags,
          location_ids: values.location_ids,
          driver_name: values.driver_name?.trim() || undefined,
          vehicle_number: values.vehicle_number?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
        });
        toast.success(t('inventory.created_toast', { lot: values.lot_number.trim() }));
        router.push('/inventory');
        return;
      }
      if (!lotId) return;
      const body: UpdateLotRequest = {
        lot_number: values.lot_number.trim(),
        location_ids: values.location_ids,
        original_bags: values.original_bags,
        driver_name: values.driver_name?.trim() || null,
        vehicle_number: values.vehicle_number?.trim() || null,
        notes: values.notes?.trim() || null,
      };
      if (!hasDeliveries && partyProductUnlocked) {
        body.customer_id = values.customer_id;
        body.product_id = values.product_id;
      }
      await updateLot.mutateAsync({ lotId, body });
      toast.success(t('inventory.updated_toast'));
      router.push(`/inventory/${lotId}`);
    } catch {
      toast.error(t('save_error'));
    }
  });

  if (role === 'STAFF' && mode === 'edit') {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-body-sm text-neutral-600">{t('error_load')}</p>
        <Link href={lotId ? `/inventory/${lotId}` : '/inventory'} className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  if (!warehouseId) {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (role === 'STAFF' && mode === 'create') {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-body-sm text-neutral-600">{t('error_load')}</p>
        <Link href="/inventory" className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  if (mode === 'edit' && lotQ.isPending) {
    return (
      <div className="flex w-full max-w-[560px] flex-col gap-3">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  if (mode === 'edit' && (lotQ.isError || !lotDetail)) {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-danger-600 text-body-sm">{t('error_load')}</p>
        <Link href="/inventory" className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[560px] flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href={mode === 'edit' && lotId ? `/inventory/${lotId}` : '/inventory'}
          className="text-caption font-medium text-primary-600 hover:underline min-h-touch inline-flex items-center"
        >
          ← {t('back')}
        </Link>
        <h1 className="h2">
          {mode === 'create' ? t('inventory.new_lot_title') : t('inventory.edit_lot_title')}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 pb-28">
        <div className="form-field">
          <label className="text-label-lg font-semibold text-neutral-700" htmlFor="party_field">
            {t('inventory.party')} *
          </label>
          <div className="relative">
            <button
              type="button"
              id="party_field"
              disabled={hardPartyLock || (mode === 'edit' && !partyProductUnlocked)}
              className={cn(
                'input-base flex min-h-touch w-full items-center justify-between text-left',
                (hardPartyLock || (mode === 'edit' && !partyProductUnlocked)) &&
                  'cursor-not-allowed bg-neutral-100 text-neutral-600',
              )}
              onClick={() => {
                if (hardPartyLock || (mode === 'edit' && !partyProductUnlocked)) {
                  if (hardPartyLock) toast.message(t('inventory.cannot_change_movements'));
                  return;
                }
                setPartyOpen((o) => !o);
              }}
            >
              <span className="truncate">
                {selectedParty
                  ? partyLabel(selectedParty.customer_code, selectedParty.customer_name)
                  : t('inventory.select_party')}
              </span>
              {mode === 'edit' && !hardPartyLock && !partyProductUnlocked ? (
                <Lock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              ) : null}
            </button>
            {mode === 'edit' && !hardPartyLock && !partyProductUnlocked ? (
              <button
                type="button"
                className="text-caption mt-1 font-medium text-primary-600"
                onClick={() => setConfirmUnlockPartyProduct(true)}
              >
                {t('inventory.unlock')}
              </button>
            ) : null}
            {confirmUnlockPartyProduct ? (
              <div className="mt-2 rounded-base border border-warning-200 bg-warning-50 p-2 text-body-sm text-neutral-800">
                <p>{t('inventory.confirm_edit_party_product')}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-sm py-2 px-3"
                    onClick={() => {
                      setPartyProductUnlocked(true);
                      setConfirmUnlockPartyProduct(false);
                    }}
                  >
                    {t('inventory.confirm')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-sm py-2 px-3"
                    onClick={() => setConfirmUnlockPartyProduct(false)}
                  >
                    {t('inventory.cancel')}
                  </button>
                </div>
              </div>
            ) : null}
            {partyOpen && (mode === 'create' || partyProductUnlocked) && !hardPartyLock ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-base border border-neutral-200 bg-white shadow-lg">
                <input
                  className="input-base border-0 border-b border-neutral-200 rounded-t-base rounded-b-none"
                  placeholder={t('inventory.search_party')}
                  value={partyQ}
                  onChange={(e) => setPartyQ(e.target.value)}
                  aria-label={t('inventory.search_party')}
                />
                {filteredParties.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    onClick={() => {
                      form.setValue('customer_id', c.id, { shouldValidate: true });
                      setPartyOpen(false);
                      setPartyQ('');
                    }}
                  >
                    <span className="font-medium text-neutral-900">{c.customer_name}</span>
                    <span className="text-caption text-neutral-500"> · {c.customer_code}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {form.formState.errors.customer_id ? (
            <p className="error-text">{t('inventory.err_party')}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label className="text-label-lg font-semibold text-neutral-700" htmlFor="product_field">
            {t('inventory.product')} *
          </label>
          <div className="relative">
            <button
              type="button"
              id="product_field"
              disabled={hardPartyLock || (mode === 'edit' && !partyProductUnlocked)}
              className={cn(
                'input-base flex min-h-touch w-full items-center justify-between text-left',
                (hardPartyLock || (mode === 'edit' && !partyProductUnlocked)) &&
                  'cursor-not-allowed bg-neutral-100 text-neutral-600',
              )}
              onClick={() => {
                if (hardPartyLock || (mode === 'edit' && !partyProductUnlocked)) {
                  if (hardPartyLock) toast.message(t('inventory.cannot_change_movements'));
                  return;
                }
                setProductOpen((o) => !o);
              }}
            >
              <span className="truncate">
                {selectedProduct ? selectedProduct.product_name : t('inventory.select_product')}
              </span>
              {mode === 'edit' && !hardPartyLock && !partyProductUnlocked ? (
                <Lock className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
              ) : null}
            </button>
            {productOpen && (mode === 'create' || partyProductUnlocked) && !hardPartyLock ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-base border border-neutral-200 bg-white shadow-lg">
                <input
                  className="input-base border-0 border-b border-neutral-200 rounded-t-base rounded-b-none"
                  placeholder={t('inventory.search_product')}
                  value={productQ}
                  onChange={(e) => setProductQ(e.target.value)}
                  aria-label={t('inventory.search_product')}
                />
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    onClick={() => {
                      form.setValue('product_id', p.id, { shouldValidate: true });
                      setProductOpen(false);
                      setProductQ('');
                    }}
                  >
                    {p.product_name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {form.formState.errors.product_id ? (
            <p className="error-text">{t('inventory.err_product')}</p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="form-field">
            <label htmlFor="original_bags" className="text-label-lg font-semibold text-neutral-700">
              {t('inventory.bags')} *
            </label>
            <div className="flex items-center gap-2">
              <input
                id="original_bags"
                type="text"
                inputMode="numeric"
                className={cn('input-base flex-1', form.formState.errors.original_bags && 'border-danger-500')}
                aria-invalid={Boolean(form.formState.errors.original_bags)}
                {...form.register('original_bags', {
                  valueAsNumber: true,
                  onChange: () => {
                    if (mode === 'create') setLotNumberManual(false);
                  },
                })}
              />
              <span className="text-body-sm text-neutral-600">{t('inventory.bags_suffix')}</span>
            </div>
            {form.formState.errors.original_bags ? (
              <p className="error-text">{t('inventory.err_bags')}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="lot_number" className="text-label-lg font-semibold text-neutral-700">
              {t('inventory.lot_number')} *
            </label>
            <div className="flex items-start gap-2">
              <input
                id="lot_number"
                className={cn(
                  'input-base flex-1',
                  (form.formState.errors.lot_number || lotNumberUniqueError) && 'border-danger-500',
                )}
                aria-invalid={Boolean(form.formState.errors.lot_number || lotNumberUniqueError)}
                disabled={lotNumberLocked}
                {...form.register('lot_number', {
                  onChange: () => {
                    setLotNumberManual(true);
                    setLotNumberUniqueError(null);
                  },
                  onBlur: () => {
                    void validateLotNumberUnique();
                  },
                })}
              />
              {mode === 'edit' && lotNumberLocked ? (
                <button
                  type="button"
                  className="min-h-touch min-w-touch shrink-0 text-neutral-600"
                  aria-label={t('inventory.unlock')}
                  onClick={() => setConfirmUnlockLotNumber(true)}
                >
                  <Lock className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            {mode === 'create' && !lotNumberManual && suggestQ.data ? (
              <p className="help-text text-primary-700">✏ {t('inventory.suggested')}</p>
            ) : null}
            {confirmUnlockLotNumber ? (
              <div className="mt-2 rounded-base border border-warning-200 bg-warning-50 p-2 text-body-sm text-neutral-800">
                <p>{t('inventory.confirm_edit_lot_number')}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-sm py-2 px-3"
                    onClick={() => {
                      setLotNumberUnlocked(true);
                      setConfirmUnlockLotNumber(false);
                    }}
                  >
                    {t('inventory.confirm')}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-sm py-2 px-3"
                    onClick={() => setConfirmUnlockLotNumber(false)}
                  >
                    {t('inventory.cancel')}
                  </button>
                </div>
              </div>
            ) : null}
            {form.formState.errors.lot_number || lotNumberUniqueError ? (
              <p className="error-text">{lotNumberUniqueError ?? form.formState.errors.lot_number?.message}</p>
            ) : null}
          </div>
        </div>

        <div className="form-field">
          <span className="text-label-lg font-semibold text-neutral-700">{t('inventory.locations')} *</span>
          <div className="relative">
            <button
              type="button"
              className="input-base flex min-h-touch w-full items-center justify-between text-left"
              onClick={() => setLocOpen((o) => !o)}
            >
              <span className="truncate">
                {(locIdsWatch?.length ?? 0) === 0
                  ? t('inventory.pick_locations')
                  : t('inventory.locations') + ` (${locIdsWatch?.length})`}
              </span>
            </button>
            {locOpen ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-base border border-neutral-200 bg-white shadow-lg">
                <input
                  className="input-base border-0 border-b border-neutral-200 rounded-t-base rounded-b-none"
                  placeholder={t('inventory.search_locations')}
                  value={locQ}
                  onChange={(e) => setLocQ(e.target.value)}
                  aria-label={t('inventory.search_locations')}
                />
                {filteredLocations.map((l) => {
                  const checked = locIdsWatch?.includes(l.id);
                  return (
                    <label
                      key={l.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const cur = new Set(form.getValues('location_ids'));
                          if (cur.has(l.id)) cur.delete(l.id);
                          else cur.add(l.id);
                          form.setValue('location_ids', [...cur], { shouldValidate: true });
                        }}
                      />
                      <span className="text-sm">{l.name}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
          {locIdsWatch && locIdsWatch.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {locIdsWatch.map((id) => {
                const name = locations.find((x) => x.id === id)?.name ?? id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-caption font-medium text-primary-800"
                  >
                    {name}
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-primary-100"
                      aria-label={`Remove ${name}`}
                      onClick={() => {
                        form.setValue(
                          'location_ids',
                          locIdsWatch.filter((x) => x !== id),
                          { shouldValidate: true },
                        );
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          ) : null}
          {form.formState.errors.location_ids ? (
            <p className="error-text">{t('inventory.err_locations')}</p>
          ) : null}
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-neutral-200 pt-3 text-left text-sm font-medium text-primary-700"
          onClick={() => setZone2Open((o) => !o)}
          aria-expanded={zone2Open}
        >
          {t('inventory.add_details_optional')}
          <span className="text-neutral-400">{zone2Open ? '⌃' : '⌄'}</span>
        </button>
        {zone2Open ? (
          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3">
            <div className="form-field">
              <label htmlFor="driver_name" className="text-label font-medium text-neutral-700">
                {t('inventory.driver_name')}
              </label>
              <input id="driver_name" className="input-base" {...form.register('driver_name')} />
            </div>
            <div className="form-field">
              <label htmlFor="vehicle_number" className="text-label font-medium text-neutral-700">
                {t('inventory.vehicle_number')}
              </label>
              <input id="vehicle_number" className="input-base" {...form.register('vehicle_number')} />
            </div>
            <div className="form-field">
              <label htmlFor="notes" className="text-label font-medium text-neutral-700">
                {t('inventory.notes')}
              </label>
              <textarea id="notes" className="input-base min-h-[4rem]" {...form.register('notes')} />
            </div>
          </div>
        ) : null}

        {(createLot.isError || updateLot.isError) && (
          <p className="error-text">{t('save_error')}</p>
        )}

        <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white px-4 py-3 lg:left-48">
          <div className="mx-auto flex max-w-[560px] justify-between gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.back()}
            >
              {t('inventory.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!zone1Ready || createLot.isPending || updateLot.isPending}
            >
              {mode === 'create' ? t('inventory.submit') : t('inventory.save')}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
