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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChargesBootstrapResponseSchema, ChargesBootstrapRowSchema } from '@/lib/charges-api-schemas';
import { buildSaveChargesBody } from '@/lib/build-save-charges-body';
import {
  checkLotNumberAvailable,
  useCreateLot,
  useCustomersList,
  useLocationsList,
  useLodgementChargePreview,
  useLotDetail,
  useProductsList,
  useSaveCharges,
  useSuggestLotNumber,
  useUpdateLot,
} from '@/lib/shell-queries';
import type { RowDraft } from '@/lib/movement-charges-draft';
import { buildDraftRecord, round2 } from '@/lib/movement-charges-draft';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/use-debounced-value';

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
type ChargeRow = z.infer<typeof ChargesBootstrapRowSchema>;

function partyLabel(code: string, name: string): string {
  return `${code} — ${name}`;
}

function mergeChargeDraftForSave(
  boot: z.infer<typeof ChargesBootstrapResponseSchema>['data'],
  user: Record<string, RowDraft>,
): Record<string, RowDraft> {
  const base = buildDraftRecord(boot);
  for (const row of boot.charge_rows) {
    const u = user[row.product_charge_type_id];
    if (!u) continue;
    base[row.product_charge_type_id] = {
      ...base[row.product_charge_type_id],
      bags: u.bags,
      recv: u.recv,
      recvManual: u.recvManual,
      paid: u.paid,
      method: u.method,
    };
  }
  return base;
}

function chargesHaveEntries(rows: ChargeRow[], draft: Record<string, RowDraft>): boolean {
  for (const row of rows) {
    const d = draft[row.product_charge_type_id];
    if (!d) continue;
    if (d.recv > 0) return true;
    if (row.has_labor && d.paid > 0) return true;
  }
  return false;
}

function buildInitialChargeDraft(rows: ChargeRow[]): Record<string, RowDraft> {
  const out: Record<string, RowDraft> = {};
  for (const row of rows) {
    let bags = row.is_transport ? 0 : row.default_bags ?? 0;
    bags = Math.max(0, Math.floor(bags));
    const rate = row.rate_per_bag ?? 0;
    const recv = row.is_transport ? 0 : round2(bags * rate);
    out[row.product_charge_type_id] = { bags, recv, recvManual: false, paid: 0, method: '' };
  }
  return out;
}

function LocationsMultiSelect(props: {
  locations: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: boolean;
  placeholder: string;
  searchPlaceholder: string;
  tRemove: (name: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return props.locations;
    return props.locations.filter((l) => l.name.toLowerCase().includes(s));
  }, [props.locations, q]);

  function toggle(id: string) {
    const cur = new Set(props.value);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    props.onChange([...cur]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className={cn(
          'input-base flex min-h-touch w-full flex-wrap items-center gap-1 text-left',
          props.error && 'border-outward-border',
        )}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {props.value.length === 0 ? (
          <span className="text-text-tertiary">{props.placeholder}</span>
        ) : (
          props.value.map((id) => {
            const name = props.locations.find((x) => x.id === id)?.name ?? id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-0.5 rounded-full bg-brand-subtle px-2 py-0.5 text-caption font-medium text-brand-text"
              >
                {name}
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded px-0.5 hover:bg-brand-subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onChange(props.value.filter((x) => x !== id));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      props.onChange(props.value.filter((x) => x !== id));
                    }
                  }}
                  aria-label={props.tRemove(name)}
                >
                  ×
                </span>
              </span>
            );
          })
        )}
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-base border border-border bg-white shadow-lg">
          <input
            className="input-base border-0 border-b border-border rounded-t-base rounded-b-none"
            placeholder={props.searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={props.searchPlaceholder}
          />
          <ul className="py-1" role="listbox">
            {filtered.map((l) => {
              const sel = props.value.includes(l.id);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={sel}
                    className={cn(
                      'flex w-full px-3 py-2.5 text-left text-sm hover:bg-surface-subtle',
                      sel && 'bg-brand-subtle/40',
                    )}
                    onClick={() => toggle(l.id)}
                  >
                    <span className="font-medium text-text-primary">{l.name}</span>
                    {sel ? <span className="ml-auto text-caption text-brand-text">✓</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export interface LotFormScreenProps {
  mode: 'create' | 'edit';
  lotId?: string;
  /** `route`: create from /inventory/new (desktop uses dialog). */
  presentation?: 'route' | 'embedded';
}

export function LotFormScreen({ mode, lotId, presentation = 'route' }: LotFormScreenProps) {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const role = useSessionStore((s) => s.role);

  const [dialogOpen, setDialogOpen] = useState(true);

  const [isDesktop, setIsDesktop] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(mode === 'edit' ? 3 : 1);
  const [transportOpen, setTransportOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [chargeDraft, setChargeDraft] = useState<Record<string, RowDraft>>({});

  const [partyQ, setPartyQ] = useState('');
  const [productQ, setProductQ] = useState('');

  const [lotNumberManual, setLotNumberManual] = useState(mode === 'edit');
  const [lotNumberUniqueError, setLotNumberUniqueError] = useState<string | null>(null);

  const [confirmUnlockLotNumber, setConfirmUnlockLotNumber] = useState(false);
  const [lotNumberUnlocked, setLotNumberUnlocked] = useState(false);

  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingNavigate, setPendingNavigate] = useState<'back' | 'close' | null>(null);

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
  const customerIdWatch = form.watch('customer_id');
  const productIdWatch = form.watch('product_id');
  const lotNumberWatch = form.watch('lot_number');
  const debouncedLotNumber = useDebouncedValue(lotNumberWatch?.trim() ?? '', 400);

  const suggestQ = useSuggestLotNumber(
    warehouseId,
    typeof bagsWatch === 'number' && bagsWatch > 0 ? bagsWatch : 1,
    mode === 'create' && !lotNumberManual,
  );

  const chargePreviewQ = useLodgementChargePreview(
    warehouseId,
    productIdWatch || null,
    typeof bagsWatch === 'number' && bagsWatch > 0 ? bagsWatch : 1,
    mode === 'create' && createStep === 3 && Boolean(productIdWatch),
  );

  const createLot = useCreateLot(warehouseId);
  const updateLot = useUpdateLot(warehouseId);
  const saveCharges = useSaveCharges(warehouseId);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    function apply() {
      setIsDesktop(mq.matches);
    }
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    lotAppliedRef.current = false;
    setLotNumberUnlocked(false);
    setLotNumberManual(mode === 'edit');
    setConfirmUnlockLotNumber(false);
    if (mode === 'create') setCreateStep(1);
  }, [lotId, mode]);

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

  useEffect(() => {
    const rows = chargePreviewQ.data?.data.charge_rows;
    if (mode !== 'create' || !rows) return;
    setChargeDraft(buildInitialChargeDraft(rows));
  }, [mode, chargePreviewQ.data?.data.charge_rows]);

  useEffect(() => {
    if (!warehouseId || mode !== 'create') return;
    const v = debouncedLotNumber;
    if (!v) return;
    void (async () => {
      const ok = await checkLotNumberAvailable(warehouseId, v);
      if (!ok) {
        setLotNumberUniqueError(t('inventory.lot_number_taken'));
        form.setError('lot_number', { message: t('inventory.lot_number_taken') });
      } else {
        setLotNumberUniqueError(null);
        form.clearErrors('lot_number');
      }
    })();
  }, [debouncedLotNumber, warehouseId, mode, form, t]);

  const lotDetail = lotQ.data?.data;
  const hasDeliveries = lotDetail?.has_deliveries ?? false;
  const lotNumberLocked = mode === 'edit' && !lotNumberUnlocked;

  const customers = useMemo(() => customersQ.data?.data ?? [], [customersQ.data?.data]);
  const products = useMemo(() => productsQ.data?.data ?? [], [productsQ.data?.data]);
  const locations = useMemo(() => locationsQ.data?.data ?? [], [locationsQ.data?.data]);

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

  function requestExit(target: 'back' | 'close') {
    if (form.formState.isDirty) {
      setPendingNavigate(target);
      setUnsavedOpen(true);
      return;
    }
    doNavigate(target);
  }

  function doNavigate(target: 'back' | 'close') {
    const closeOverlay = mode === 'create' && presentation === 'route' && isDesktop;
    if (target === 'back') {
      if (mode === 'create') {
        if (createStep === 2) {
          setCreateStep(1);
          setProductQ('');
          return;
        }
        if (createStep === 3) {
          setCreateStep(2);
          return;
        }
      }
      if (closeOverlay) setDialogOpen(false);
      router.push(mode === 'edit' && lotId ? `/inventory/${lotId}` : '/inventory');
      return;
    }
    if (closeOverlay) setDialogOpen(false);
    router.push('/inventory');
  }

  function patchChargeRow(pctId: string, patch: Partial<RowDraft>) {
    setChargeDraft((prev) => ({
      ...prev,
      [pctId]: { ...(prev[pctId] ?? { bags: 0, recv: 0, recvManual: false, paid: 0, method: '' }), ...patch },
    }));
  }

  function selectParty(id: string) {
    form.setValue('customer_id', id, { shouldValidate: true, shouldDirty: true });
    setPartyQ('');
    if (mode === 'create') setCreateStep(2);
  }

  function selectProduct(id: string) {
    form.setValue('product_id', id, { shouldValidate: true, shouldDirty: true });
    setProductQ('');
    if (mode === 'create') {
      setCreateStep(3);
      setLotNumberManual(false);
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!warehouseId || role === 'STAFF') return;
    const uniqueOk = await validateLotNumberUnique();
    if (!uniqueOk) return;

    try {
      if (mode === 'create') {
        const created = await createLot.mutateAsync({
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
        const newLotId = created.data.id;
        const previewRows = chargePreviewQ.data?.data.charge_rows ?? [];
        if (previewRows.length > 0 && chargesHaveEntries(previewRows, chargeDraft)) {
          const bootRes = await fetch(
            `${window.location.origin}/api/lots/${newLotId}/charges/bootstrap?movement=lodgement`,
          );
          const bootJson: unknown = await bootRes.json();
          const bootParsed = ChargesBootstrapResponseSchema.safeParse(bootJson);
          if (bootParsed.success) {
            const merged = mergeChargeDraftForSave(bootParsed.data.data, chargeDraft);
            const body = buildSaveChargesBody(bootParsed.data.data, merged, 'lodgement', null);
            try {
              await saveCharges.mutateAsync({ lotId: newLotId, body });
            } catch {
              toast.error(t('save_error'));
            }
          }
        }
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
      if (!hasDeliveries) {
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
        <p className="text-body-sm text-text-secondary">{t('error_load')}</p>
        <Link href={lotId ? `/inventory/${lotId}` : '/inventory'} className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  if (!warehouseId) {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-body-sm text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (role === 'STAFF' && mode === 'create') {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="text-body-sm text-text-secondary">{t('error_load')}</p>
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
        <p className="text-outward text-body-sm">{t('error_load')}</p>
        <Link href="/inventory" className="btn-secondary mt-2 inline-flex">
          {t('back')}
        </Link>
      </div>
    );
  }

  const headerTitle =
    mode === 'create' ? t('inventory.new_lot_title') : t('inventory.edit_lot_title');
  const useDialogShell = mode === 'create' && presentation === 'route' && isDesktop;

  const headerRow = (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
      <button
        type="button"
        className="min-h-touch min-w-touch text-lg font-semibold text-text-primary hover:text-brand-text"
        aria-label={t('inventory.back_a11y')}
        onClick={() => requestExit('back')}
      >
        ←
      </button>
      <h1 className="h2 flex-1 pr-8">{headerTitle}</h1>
    </div>
  );

  const footerRow = (
    <footer className="shrink-0 border-t border-border bg-white px-3 py-3 sm:px-4">
      <div className="flex justify-between gap-3">
        <Button type="button" variant="secondary" className="min-h-touch" onClick={() => requestExit('close')}>
          {t('inventory.cancel')}
        </Button>
        {createStep === 3 ? (
          <Button
            type="submit"
            form="lot-form-main"
            className="min-h-touch"
            disabled={!zone1Ready || createLot.isPending || updateLot.isPending}
          >
            {mode === 'create' ? t('inventory.submit') : t('inventory.save')}
          </Button>
        ) : null}
      </div>
    </footer>
  );

  const step1 = (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-h3 text-text-primary">{t('inventory.step_which_party')}</p>
      <input
        className="input-base"
        placeholder={t('inventory.search_party')}
        value={partyQ}
        onChange={(e) => setPartyQ(e.target.value)}
        aria-label={t('inventory.search_party')}
      />
      <ul className="max-h-[50vh] overflow-auto rounded-base border border-border">
        {filteredParties.map((c) => (
          <li key={c.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              className="flex w-full flex-col px-3 py-3 text-left hover:bg-surface-subtle"
              onClick={() => selectParty(c.id)}
            >
              <span className="font-semibold text-text-primary">{c.customer_name}</span>
              <span className="text-caption text-text-tertiary">{c.customer_code}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const step2 = (
    <div className="flex flex-col gap-3 p-4">
      {selectedParty ? (
        <p className="rounded-base bg-brand-subtle px-3 py-2 text-body-sm font-medium text-brand-text">
          {partyLabel(selectedParty.customer_code, selectedParty.customer_name)}
        </p>
      ) : null}
      <p className="text-h3 text-text-primary">{t('inventory.step_which_product')}</p>
      <input
        className="input-base"
        placeholder={t('inventory.search_product')}
        value={productQ}
        onChange={(e) => setProductQ(e.target.value)}
        aria-label={t('inventory.search_product')}
      />
      <ul className="max-h-[50vh] overflow-auto rounded-base border border-border">
        {filteredProducts.map((p) => (
          <li key={p.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              className="w-full px-3 py-3 text-left font-medium hover:bg-surface-subtle"
              onClick={() => selectProduct(p.id)}
            >
              {p.product_name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const chargeRows = chargePreviewQ.data?.data.charge_rows ?? [];

  const step3 = (
    <form id="lot-form-main" onSubmit={onSubmit} className="flex flex-col gap-3 overflow-y-auto p-4 pb-2">
      {mode === 'create' ? (
        <div className="flex flex-col gap-1 rounded-base bg-surface-subtle p-3 text-body-sm">
          {selectedParty ? (
            <span className="font-medium text-text-primary">
              {partyLabel(selectedParty.customer_code, selectedParty.customer_name)}
            </span>
          ) : null}
          {selectedProduct ? (
            <span className="text-text-secondary">{selectedProduct.product_name}</span>
          ) : null}
        </div>
      ) : null}

      {mode === 'edit' && hasDeliveries ? (
        <p className="rounded-base bg-pending-bg px-3 py-2 text-caption text-text-primary">
          {t('inventory.warn_party_product_deliveries')}
        </p>
      ) : null}

      {mode === 'edit' && hasDeliveries ? (
        <>
          <div className="form-field">
            <span className="type-label">{t('inventory.party')} *</span>
            <div className="input-base min-h-touch bg-surface-subtle text-text-primary">
              {selectedParty
                ? partyLabel(selectedParty.customer_code, selectedParty.customer_name)
                : '—'}
            </div>
          </div>
          <div className="form-field">
            <span className="type-label">{t('inventory.product')} *</span>
            <div className="input-base min-h-touch bg-surface-subtle text-text-primary">
              {selectedProduct?.product_name ?? '—'}
            </div>
          </div>
        </>
      ) : null}

      {mode === 'edit' && !hasDeliveries ? (
        <>
          <div className="form-field">
            <label className="type-label" htmlFor="party_pick">
              {t('inventory.party')} *
            </label>
            <select
              id="party_pick"
              className="input-base min-h-touch w-full"
              value={customerIdWatch}
              onChange={(e) =>
                form.setValue('customer_id', e.target.value, { shouldValidate: true, shouldDirty: true })
              }
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {partyLabel(c.customer_code, c.customer_name)}
                </option>
              ))}
            </select>
            {form.formState.errors.customer_id ? (
              <p className="error-text">{t('inventory.err_party')}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label className="type-label" htmlFor="product_pick">
              {t('inventory.product')} *
            </label>
            <select
              id="product_pick"
              className="input-base min-h-touch w-full"
              value={productIdWatch}
              onChange={(e) =>
                form.setValue('product_id', e.target.value, { shouldValidate: true, shouldDirty: true })
              }
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
            {form.formState.errors.product_id ? (
              <p className="error-text">{t('inventory.err_product')}</p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="form-field">
          <label htmlFor="original_bags" className="type-label">
            {t('inventory.bags')} *
          </label>
          <div className="flex items-center gap-2">
            <input
              id="original_bags"
              type="text"
              inputMode="numeric"
              className={cn('input-base flex-1', form.formState.errors.original_bags && 'border-outward-border')}
              aria-invalid={Boolean(form.formState.errors.original_bags)}
              {...form.register('original_bags', {
                valueAsNumber: true,
                onChange: () => {
                  if (mode === 'create') setLotNumberManual(false);
                },
              })}
            />
            <span className="text-body-sm text-text-secondary">{t('inventory.bags_suffix')}</span>
          </div>
          {form.formState.errors.original_bags ? (
            <p className="error-text">{t('inventory.err_bags')}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="lot_number" className="type-label">
            {t('inventory.lot_number')} *
          </label>
          <div className="flex items-start gap-2">
            <input
              id="lot_number"
              className={cn(
                'input-base flex-1',
                (form.formState.errors.lot_number || lotNumberUniqueError) && 'border-outward-border',
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
                className="min-h-touch min-w-touch shrink-0 text-text-secondary"
                aria-label={t('inventory.unlock')}
                onClick={() => setConfirmUnlockLotNumber(true)}
              >
                <Lock className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          {confirmUnlockLotNumber ? (
            <div className="mt-2 rounded-base border border-pending-border bg-pending-bg p-2 text-body-sm text-text-primary">
              <p>{t('inventory.confirm_edit_lot_number')}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="btn-primary py-2 px-3 text-sm"
                  onClick={() => {
                    setLotNumberUnlocked(true);
                    setConfirmUnlockLotNumber(false);
                  }}
                >
                  {t('inventory.confirm')}
                </button>
                <button
                  type="button"
                  className="btn-secondary py-2 px-3 text-sm"
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
        <span className="type-label">{t('inventory.locations')} *</span>
        <LocationsMultiSelect
          locations={locations}
          value={locIdsWatch ?? []}
          onChange={(ids) => form.setValue('location_ids', ids, { shouldValidate: true, shouldDirty: true })}
          error={Boolean(form.formState.errors.location_ids)}
          placeholder={t('inventory.pick_locations')}
          searchPlaceholder={t('inventory.search_locations')}
          tRemove={(name) => `Remove ${name}`}
        />
        {form.formState.errors.location_ids ? (
          <p className="error-text">{t('inventory.err_locations')}</p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="notes" className="type-label">
          {t('inventory.notes')}
        </label>
        <textarea id="notes" className="input-base min-h-[4rem]" {...form.register('notes')} />
      </div>

      <div className="rounded-base border border-border bg-surface-subtle/40 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left type-label"
          onClick={() => setTransportOpen((o) => !o)}
          aria-expanded={transportOpen}
        >
          {t('inventory.transport_details_optional')}
          <span className="text-text-tertiary">{transportOpen ? '⌃' : '⌄'}</span>
        </button>
        {transportOpen ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="form-field">
              <label htmlFor="driver_name" className="type-label">
                {t('inventory.driver_name')}
              </label>
              <input id="driver_name" className="input-base" {...form.register('driver_name')} />
            </div>
            <div className="form-field">
              <label htmlFor="vehicle_number" className="type-label">
                {t('inventory.vehicle_number')}
              </label>
              <input id="vehicle_number" className="input-base" {...form.register('vehicle_number')} />
            </div>
          </div>
        ) : null}
      </div>

      {mode === 'create' && chargeRows.length > 0 ? (
        <div className="rounded-base border border-border bg-surface-subtle/40 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left type-label"
            onClick={() => setChargesOpen((o) => !o)}
            aria-expanded={chargesOpen}
          >
            {t('inventory.add_charges_optional')}
            <span className="text-text-tertiary">{chargesOpen ? '⌃' : '⌄'}</span>
          </button>
          {chargesOpen ? (
            <div className="mt-3 flex flex-col gap-4">
              {chargeRows.map((row) => {
                const dr = chargeDraft[row.product_charge_type_id];
                if (!dr) return null;
                const rateLabel =
                  row.rate_per_bag != null ?
                    ` (₹${row.rate_per_bag}/bag)`
                  : '';
                return (
                  <div
                    key={row.product_charge_type_id}
                    className="rounded-base border border-border bg-white p-3 shadow-sm"
                  >
                    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-primary">
                      {row.display_name}
                      {rateLabel}
                    </p>
                    {row.is_transport ? (
                      <div className="form-field mt-2">
                        <label className="type-label">
                          {t('inventory.charges_receivable')}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input-base"
                          value={String(dr.recv)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            patchChargeRow(row.product_charge_type_id, {
                              recv: Number.isFinite(n) ? round2(Math.max(0, n)) : 0,
                              recvManual: true,
                            });
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="form-field mt-2">
                          <label className="type-label">
                            {t('inventory.num_bags_charge')}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="input-base"
                            value={String(dr.bags)}
                            onChange={(e) => {
                              const bags = Math.max(0, Math.floor(Number(e.target.value)));
                              const rate = row.rate_per_bag ?? 0;
                              patchChargeRow(row.product_charge_type_id, {
                                bags,
                                recv: round2(bags * rate),
                                recvManual: false,
                              });
                            }}
                          />
                        </div>
                        <p className="text-body-sm text-text-secondary">
                          {t('inventory.charges_receivable')}: ₹{dr.recv.toFixed(2)}
                        </p>
                      </>
                    )}
                    {row.has_labor ? (
                      <div className="form-field mt-2">
                        <label className="type-label">
                          {t('inventory.charges_paid_field')}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="input-base"
                          value={String(dr.paid)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            patchChargeRow(row.product_charge_type_id, {
                              paid: Number.isFinite(n) ? round2(Math.max(0, n)) : 0,
                            });
                          }}
                        />
                        {dr.paid > 0 ? (
                          <select
                            className="input-base mt-2 min-h-touch"
                            value={dr.method}
                            onChange={(e) =>
                              patchChargeRow(row.product_charge_type_id, {
                                method: e.target.value as RowDraft['method'],
                              })
                            }
                          >
                            <option value="">Method</option>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="OTHER">Other</option>
                          </select>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-primary">
                {t('inventory.total_receivable')}: ₹
                {round2(
                  chargeRows.reduce((s, r) => s + (chargeDraft[r.product_charge_type_id]?.recv ?? 0), 0),
                ).toFixed(2)}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {(createLot.isError || updateLot.isError) && (
        <p className="error-text">{t('save_error')}</p>
      )}
    </form>
  );

  const body =
    mode === 'create' && createStep !== 3 ?
      createStep === 1 ? step1
      : step2
    : step3;

  const mainColumn = (
    <div className="flex h-full max-h-[min(92vh,880px)] flex-col bg-white">
      {headerRow}
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      {createStep === 3 || mode === 'edit' ? footerRow : (
        <footer className="shrink-0 border-t border-border bg-white px-3 py-3 sm:px-4">
          <Button type="button" variant="secondary" className="min-h-touch w-full sm:w-auto" onClick={() => requestExit('close')}>
            {t('inventory.cancel')}
          </Button>
        </footer>
      )}
    </div>
  );

  const dialogs = (
    <>
      <AlertDialog open={unsavedOpen} onOpenChange={setUnsavedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inventory.discard_unsaved_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('inventory.discard_unsaved_body')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingNavigate(null);
              }}
            >
              {t('inventory.keep_editing')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = pendingNavigate ?? 'back';
                setUnsavedOpen(false);
                setPendingNavigate(null);
                doNavigate(target);
              }}
            >
              {t('inventory.discard_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  const wrapped =
    useDialogShell ?
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (form.formState.isDirty) {
              setPendingNavigate('close');
              setUnsavedOpen(true);
              queueMicrotask(() => setDialogOpen(true));
            } else {
              void doNavigate('close');
            }
          }
        }}
      >
        <DialogContent hideClose className="flex max-h-[min(92vh,900px)] max-w-xl flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          {mainColumn}
        </DialogContent>
      </Dialog>
    : <div className={cn('w-full max-w-[560px]', mode === 'create' && 'min-h-[calc(100vh-6rem)]')}>{mainColumn}</div>;

  return (
    <>
      {wrapped}
      {dialogs}
    </>
  );
}
