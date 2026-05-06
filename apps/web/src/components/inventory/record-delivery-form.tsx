'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatINR } from '@growcold/shared';
import type { LotDetailRow, RecordDeliveryRequest } from '@growcold/shared';
import { MovementChargesEditor } from '@/components/inventory/movement-charges-editor';
import { buildRecordDeliveryChargeRows } from '@/lib/build-record-delivery-charge-rows';
import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';
import { todayInBusinessTimezone } from '@/lib/business-date';
import type { RowDraft } from '@/lib/movement-charges-draft';
import { buildDraftRecord } from '@/lib/movement-charges-draft';
import {
  useChargesBootstrap,
  useCustomerOutstanding,
  useLotDetail,
  useRecordDelivery,
} from '@/lib/shell-queries';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/stores/session-store';

type RecordDeliveryBody = RecordDeliveryRequest;

type ChargesData = ChargesBootstrapResponse['data'];

/** Inner form remounts when bootstrap refetches so draft/locations initialize without effects. */
function RecordDeliveryFormLoaded({
  lotId,
  warehouseId,
  lot,
  data,
  dues,
}: {
  lotId: string;
  warehouseId: string;
  lot: LotDetailRow;
  data: ChargesData;
  dues: { rent: number; charges: number; total: number } | undefined;
}) {
  const { t } = useTranslation('charges');
  const { t: tp } = useTranslation('pages');
  const router = useRouter();
  const record = useRecordDelivery(warehouseId);

  const today = useMemo(() => todayInBusinessTimezone(), []);
  const [numBagsOut, setNumBagsOut] = useState<number | ''>('');
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [laborPaymentDate, setLaborPaymentDate] = useState(today);
  const [notes, setNotes] = useState('');

  const [selectedLocs, setSelectedLocs] = useState(() => new Set(lot.location_ids ?? []));
  const [draft, setDraft] = useState(() => buildDraftRecord(data));

  function setRow(pctId: string, patch: Partial<RowDraft>) {
    setDraft((prev) => ({
      ...prev,
      [pctId]: {
        ...(prev[pctId] ?? {
          bags: 0,
          recv: 0,
          recvManual: false,
          paid: 0,
          method: '',
        }),
        ...patch,
      },
    }));
  }

  const bagsMax = useMemo(() => {
    const n = numBagsOut === '' ? lot.balance_bags : Number(numBagsOut);
    if (!Number.isFinite(n) || n < 1) return Math.max(0, lot.balance_bags);
    return Math.min(lot.balance_bags, Math.floor(n));
  }, [lot, numBagsOut]);

  const hasAnyCharge = data.charge_rows.some((row) => {
    const dr = draft[row.product_charge_type_id];
    return dr && (dr.recv > 0 || (row.has_labor && dr.paid > 0));
  });

  const chips = useMemo(() => {
    if (lot.locations?.length) {
      const idSet = new Set(lot.location_ids ?? []);
      return lot.locations.filter((c) => idSet.has(c.id));
    }
    return (lot.location_ids ?? []).map((id) => ({ id, name: id.slice(0, 8) }));
  }, [lot]);

  function toggleLoc(id: string) {
    setSelectedLocs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    const n = numBagsOut === '' ? NaN : Number(numBagsOut);
    if (!Number.isFinite(n) || n < 1 || n > lot.balance_bags) {
      toast.error(tp('inventory.record_delivery_bags_invalid'));
      return;
    }
    const locIds = [...selectedLocs];
    if (locIds.length < 1) {
      toast.error(tp('inventory.err_locations'));
      return;
    }
    const laborPaymentDateFinal = laborPaymentDate.trim() || deliveryDate;

    for (const row of data.charge_rows) {
      const dr = draft[row.product_charge_type_id];
      if (!dr) continue;
      if (!row.is_transport && dr.bags > bagsMax) {
        toast.error(t('bags_error_max'));
        return;
      }
      if (
        row.has_labor &&
        dr.paid > 0 &&
        dr.method !== 'CASH' &&
        dr.method !== 'UPI' &&
        dr.method !== 'OTHER'
      ) {
        toast.error(t('method_error'));
        setRow(row.product_charge_type_id, { methodError: t('method_error') });
        return;
      }
    }

    try {
      const chargeRows = buildRecordDeliveryChargeRows(data, draft);
      const chargePositive = chargeRows.some((r) => {
        const recv = Number(r.receivable_amount);
        const paid = Number(r.labor_paid);
        return recv > 0 || paid > 0;
      });

      const body: RecordDeliveryBody = {
        warehouse_id: warehouseId,
        num_bags_out: Math.floor(n),
        location_ids: locIds,
        delivery_date: deliveryDate,
        labor_payment_date: laborPaymentDateFinal !== deliveryDate ? laborPaymentDateFinal : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
        ...(chargePositive ? { charge_rows: chargeRows } : {}),
      };

      await record.mutateAsync({ lotId, body });
      toast.success(t('record_delivery_saved'));
      router.push(`/inventory/${lotId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tp('error_load'));
    }
  }

  return (
    <>
      <div className="mx-auto mb-28 flex max-w-[560px] flex-col gap-4 pb-4">
        <div>
          <Link href={`/inventory/${lotId}`} className="text-caption font-medium text-brand-text hover:underline">
            ← {t('back_lot')}
          </Link>
          <h1 className="mt-2 h2 text-text-primary">{tp('inventory.record_delivery_title')}</h1>
          <p className="mt-1 text-body-sm text-text-secondary">{tp('inventory.record_delivery_sub')}</p>
        </div>

        {dues ? (
          <div className="card border border-amber-200 bg-amber-50">
            <p className="text-caption font-semibold text-amber-900">{tp('inventory.outstanding_card')}</p>
            <dl className="mt-2 grid gap-1 text-body-sm text-amber-950">
              <div className="flex justify-between gap-2">
                <dt>{tp('inventory.outstanding_rent')}</dt>
                <dd>{formatINR(dues.rent)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{tp('inventory.outstanding_charges')}</dt>
                <dd>{formatINR(dues.charges)}</dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-amber-200 pt-2 font-semibold">
                <dt>{tp('inventory.outstanding_total')}</dt>
                <dd>{formatINR(dues.total)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="card grid gap-3 text-body-sm">
          <p className="text-caption font-medium text-text-tertiary">{tp('inventory.record_delivery_zone1')}</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-caption font-medium text-text-tertiary">{t('party_locked')}</span>
            <span className="inline-flex rounded-full bg-surface-subtle px-3 py-1 text-sm font-medium text-text-primary">
              {data.party.customer_code} — {data.party.customer_name}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-caption font-medium text-text-tertiary">{t('lot_locked')}</span>
            <span className="inline-flex rounded-full bg-surface-subtle px-3 py-1 text-sm font-medium text-text-primary">
              {data.lot.lot_number} · {lot.balance_bags}/{lot.original_bags} {tp('inventory.bags_suffix')}
            </span>
          </div>
          <label className="form-field gap-1">
            <span className="text-label">{tp('inventory.record_delivery_bags_out')}</span>
            <input
              type="number"
              inputMode="numeric"
              className="input-base max-w-[8rem]"
              min={1}
              max={lot.balance_bags}
              value={numBagsOut}
              placeholder={String(lot.balance_bags)}
              onChange={(e) => {
                const v = e.target.value;
                setNumBagsOut(v === '' ? '' : Number.parseInt(v, 10));
              }}
            />
          </label>
          <label className="form-field gap-1">
            <span className="text-label">{tp('inventory.record_delivery_date')}</span>
            <input
              type="date"
              className="input-base max-w-[11rem]"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </label>
          <label className="form-field gap-1">
            <span className="text-label">{tp('inventory.record_delivery_labor_date')}</span>
            <input
              type="date"
              className="input-base max-w-[11rem]"
              value={laborPaymentDate}
              onChange={(e) => setLaborPaymentDate(e.target.value)}
            />
            <span className="text-caption text-text-tertiary">{tp('inventory.record_delivery_labor_date_hint')}</span>
          </label>
          <div className="form-field gap-2">
            <span className="text-label">{tp('inventory.record_delivery_locations')}</span>
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm',
                    selectedLocs.has(c.id) ? 'border-brand-ui bg-brand-subtle' : 'border-border bg-white',
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedLocs.has(c.id)}
                    onChange={() => toggleLoc(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <label className="form-field gap-1">
            <span className="text-label">{tp('inventory.notes')}</span>
            <textarea className="input-base min-h-[4rem]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <div>
          <h2 className="mb-2 text-body-sm font-semibold text-text-primary">{tp('inventory.record_delivery_zone2')}</h2>
          <MovementChargesEditor bagsMax={Math.max(bagsMax, 1)} data={data} draft={draft} setRow={setRow} />
          {!hasAnyCharge ? (
            <p className="mt-2 text-caption text-text-tertiary">{tp('inventory.record_delivery_charges_optional')}</p>
          ) : null}
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white px-4 py-3 lg:left-48">
        <div className="mx-auto flex max-w-[560px] justify-between gap-3">
          <button type="button" className="btn-secondary min-h-touch" onClick={() => router.back()}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn-primary min-h-touch"
            disabled={record.isPending || numBagsOut === '' || selectedLocs.size < 1}
            onClick={() => void submit()}
          >
            {tp('inventory.record_delivery_save')}
          </button>
        </div>
      </footer>
    </>
  );
}

export function RecordDeliveryForm({ lotId }: { lotId: string }) {
  const { t } = useTranslation('charges');
  const { t: tp } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);

  const lotQ = useLotDetail(lotId);
  const lot = lotQ.data?.data;
  const bootstrapQ = useChargesBootstrap(lotId, 'lodgement', null, { forNewDelivery: true });
  const data = bootstrapQ.data?.data;

  const outstandingQ = useCustomerOutstanding(lot?.customer_id ?? null, warehouseId);
  const dues = outstandingQ.data?.data;

  if (!warehouseId && lotQ.isFetched) {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="error-text">{tp('select_warehouse')}</p>
        <Link href={`/inventory/${lotId}`} className="btn-secondary mt-2 inline-flex">
          {tp('back')}
        </Link>
      </div>
    );
  }

  if (lotQ.isPending || bootstrapQ.isPending) {
    return (
      <div className="flex max-w-[560px] flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card skeleton h-28 w-full animate-pulse bg-surface-subtle" />
        ))}
      </div>
    );
  }

  if (lotQ.isError || !lot || bootstrapQ.isError || !data) {
    return (
      <div className="card w-full max-w-[560px]">
        <p className="error-text">{tp('error_load')}</p>
        <Link href={`/inventory/${lotId}`} className="btn-secondary mt-2 inline-flex">
          {tp('back')}
        </Link>
      </div>
    );
  }

  if (lot.balance_bags <= 0) {
    return (
      <div className="mx-auto mb-28 max-w-[560px]">
        <Link href={`/inventory/${lotId}`} className="text-caption font-medium text-brand-text hover:underline">
          ← {t('back_lot')}
        </Link>
        <h1 className="mt-2 h2">{tp('inventory.record_delivery_title')}</h1>
        <p className="mt-4 text-body-sm text-text-secondary">{tp('inventory.record_delivery_no_balance')}</p>
      </div>
    );
  }

  if (!(lot.location_ids?.length ?? 0)) {
    return (
      <div className="mx-auto mb-28 max-w-[560px]">
        <Link href={`/inventory/${lotId}`} className="text-caption font-medium text-brand-text hover:underline">
          ← {t('back_lot')}
        </Link>
        <h1 className="mt-2 h2">{tp('inventory.record_delivery_title')}</h1>
        <p className="mt-4 text-body-sm text-outward">{tp('inventory.record_delivery_no_locations')}</p>
      </div>
    );
  }

  if (!warehouseId) {
    return null;
  }

  return (
    <RecordDeliveryFormLoaded
      key={bootstrapQ.dataUpdatedAt}
      lotId={lotId}
      warehouseId={warehouseId}
      lot={lot}
      data={data}
      dues={dues}
    />
  );
}
