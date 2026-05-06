'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { MovementChargesEditor } from '@/components/inventory/movement-charges-editor';
import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';
import type { RowDraft } from '@/lib/movement-charges-draft';
import { buildDraftRecord } from '@/lib/movement-charges-draft';
import { buildSaveChargesBody } from '@/lib/build-save-charges-body';
import { isoDateDisplayDDMMYYYY } from '@/lib/charges-defaults';
import { useChargesBootstrap, useLotDeliveries, useSaveCharges } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

type Movement = 'lodgement' | 'delivery';
type ChargesData = ChargesBootstrapResponse['data'];
type BootstrapDelivery = ChargesData['deliveries'][number];

interface AddChargesFormBodyProps {
  lotId: string;
  warehouseId: string | null;
  movement: Movement;
  setMovement: Dispatch<SetStateAction<Movement>>;
  deliveryList: BootstrapDelivery[];
  setDeliveryId: Dispatch<SetStateAction<string | null>>;
  resolvedDeliveryId: string | null;
  onlineHint: boolean;
  data: ChargesData;
}

function AddChargesFormBody({
  lotId,
  warehouseId,
  movement,
  setMovement,
  deliveryList,
  setDeliveryId,
  resolvedDeliveryId,
  onlineHint,
  data,
}: AddChargesFormBodyProps) {
  const { t } = useTranslation('charges');
  const { t: tPages } = useTranslation('pages');
  const router = useRouter();

  const [draft, setDraft] = useState(() => buildDraftRecord(data));

  const save = useSaveCharges(warehouseId);

  const movementBlocked = movement === 'delivery' && !resolvedDeliveryId;

  const hasAnyCharge =
    data.charge_rows.some((row) => {
      const dr = draft[row.product_charge_type_id];
      return dr && (dr.recv > 0 || (row.has_labor && dr.paid > 0));
    });

  const originalBags = data.lot.original_bags;

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

  async function submit() {
    for (const row of data.charge_rows) {
      const dr = draft[row.product_charge_type_id];
      if (!dr) continue;
      if (!row.is_transport && dr.bags > originalBags) {
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
    if (!hasAnyCharge) {
      toast.error(t('no_charges_save'));
      return;
    }
    try {
      const body = buildSaveChargesBody(
        data,
        draft,
        movement,
        movement === 'delivery' ? resolvedDeliveryId : null,
      );
      await save.mutateAsync({ lotId, body });
      toast.success(t('saved_toast'));
      router.push(`/inventory/${lotId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('network_error_toast'));
    }
  }

  const chipDate = isoDateDisplayDDMMYYYY(data.charge_date);
  const partyChip = `${data.party.customer_code} — ${data.party.customer_name}`;
  const deliveryOptions = movement === 'delivery' ? deliveryList : data.deliveries;

  return (
    <>
      <div className="mx-auto mb-28 flex max-w-[560px] flex-col gap-4 pb-4">
        <div>
          <Link href={`/inventory/${lotId}`} className="text-caption font-medium text-primary-600 hover:underline">
            ← {t('back_lot')}
          </Link>
          <h1 className="mt-2 h2 text-neutral-900">{t('title')}</h1>
        </div>

        {!onlineHint ? (
          <p className="text-caption text-neutral-500">{t('offline_note')}</p>
        ) : null}

        <div className="card grid gap-2 text-body-sm">
          <div className="flex flex-wrap gap-2">
            <span className="text-caption font-medium text-neutral-500">{t('party_locked')}</span>
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-900">
              {partyChip}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-caption font-medium text-neutral-500">{t('lot_locked')}</span>
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-900">
              {data.lot.lot_number}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-medium text-neutral-500">{t('movement')}</span>
            <select
              aria-label={t('movement')}
              className="input-base max-w-[12rem]"
              value={movement}
              onChange={(e) => {
                const mv = e.target.value as Movement;
                setMovement(mv);
                if (mv === 'lodgement') setDeliveryId(null);
              }}
            >
              <option value="lodgement">{t('movement_lodgement')}</option>
              <option value="delivery" disabled={deliveryList.length === 0}>
                {t('movement_delivery')}
              </option>
            </select>
          </div>
          {movement === 'delivery' && deliveryOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-medium text-neutral-500">{t('which_delivery')}</span>
              <select
                aria-label={t('which_delivery')}
                className="input-base min-w-[12rem]"
                value={resolvedDeliveryId ?? ''}
                onChange={(e) => setDeliveryId(e.target.value || null)}
              >
                <option value="" disabled hidden>
                  {t('pick_delivery')}
                </option>
                {deliveryOptions.map((dl) => (
                  <option key={dl.id} value={dl.id}>
                    {isoDateDisplayDDMMYYYY(dl.delivery_date)} · {dl.num_bags_out}{' '}
                    {tPages('inventory.bags_suffix')}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <span className="text-caption font-medium text-neutral-500">{t('date_label')}</span>
            <span>{chipDate}</span>
          </div>
        </div>

        <MovementChargesEditor bagsMax={originalBags} data={data} draft={draft} setRow={setRow} />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white px-4 py-3 lg:left-48">
        <div className="mx-auto flex max-w-[560px] justify-between gap-3">
          <button type="button" className="btn-secondary min-h-touch" onClick={() => router.back()}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn-primary min-h-touch"
            title={hasAnyCharge ? undefined : t('no_charges_save')}
            disabled={!hasAnyCharge || save.isPending || movementBlocked}
            onClick={() => void submit()}
          >
            {t('save')}
          </button>
        </div>
      </footer>
    </>
  );
}

export function AddChargesForm({ lotId }: { lotId: string }) {
  const { t } = useTranslation('charges');
  const { t: tPages } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const prefDeliveryId = useSearchParams().get('deliveryId');

  const [movement, setMovement] = useState<Movement>(() => (prefDeliveryId ? 'delivery' : 'lodgement'));
  const [deliveryId, setDeliveryId] = useState<string | null>(prefDeliveryId);
  const [onlineHint, setOnlineHint] = useState(true);

  useEffect(() => {
    function apply() {
      setOnlineHint(typeof navigator !== 'undefined' ? navigator.onLine : true);
    }
    apply();
    window.addEventListener('online', apply);
    window.addEventListener('offline', apply);
    return () => {
      window.removeEventListener('online', apply);
      window.removeEventListener('offline', apply);
    };
  }, []);

  const delQ = useLotDeliveries(lotId);
  const deliveryList = useMemo(() => delQ.data?.data.deliveries ?? [], [
    delQ.data?.data.deliveries,
  ]);

  const resolvedDeliveryId = useMemo(() => {
    if (movement !== 'delivery' || deliveryList.length === 0) return null;
    if (deliveryId && deliveryList.some((d) => d.id === deliveryId)) return deliveryId;
    if (prefDeliveryId && deliveryList.some((d) => d.id === prefDeliveryId)) return prefDeliveryId;
    return deliveryList[0]!.id;
  }, [movement, deliveryList, deliveryId, prefDeliveryId]);

  useEffect(() => {
    if (!prefDeliveryId || movement !== 'delivery' || !delQ.isFetched || deliveryList.length === 0) {
      return;
    }
    if (deliveryList.some((d) => d.id === prefDeliveryId)) return;
    toast.error(tPages('error_load'));
    router.replace(`/inventory/${lotId}/charges`, { scroll: false });
  }, [prefDeliveryId, movement, delQ.isFetched, deliveryList, router, lotId, tPages]);

  const deliveryReady = movement === 'lodgement' || Boolean(resolvedDeliveryId);
  const qb = useChargesBootstrap(lotId, movement, resolvedDeliveryId);
  const data = qb.data?.data;

  const noDeliveries = movement === 'delivery' && delQ.isFetched && deliveryList.length === 0;

  const loadingDeliveriesMeta = movement === 'delivery' && delQ.isPending;
  const loadingCharges = deliveryReady && (qb.isPending || qb.isFetching);

  const showSkeleton = loadingDeliveriesMeta || loadingCharges;

  if (noDeliveries) {
    return (
      <div className="mx-auto mb-28 max-w-[560px]">
        <Link href={`/inventory/${lotId}`} className="text-caption font-medium text-primary-600 hover:underline">
          ← {t('back_lot')}
        </Link>
        <h1 className="mt-2 h2">{t('title')}</h1>
        <p className="mt-4 text-body-sm text-neutral-600">{t('no_deliveries_hint')}</p>
        <Link href={`/inventory/${lotId}`} className="btn-primary mt-4 inline-flex">
          {tPages('back')}
        </Link>
      </div>
    );
  }

  if (qb.isError) {
    return (
      <div className="card w-full">
        <p className="error-text">{tPages('error_load')}</p>
        <Link href={`/inventory/${lotId}`} className="btn-secondary mt-2 inline-flex">
          {t('back_lot')}
        </Link>
      </div>
    );
  }

  if (showSkeleton || !data) {
    return (
      <div className="flex max-w-[560px] flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card skeleton h-28 w-full animate-pulse bg-neutral-100" />
        ))}
      </div>
    );
  }

  const formKey = `${movement}-${resolvedDeliveryId ?? 'lodgement'}-${data.charge_date}`;

  return (
    <AddChargesFormBody
      key={formKey}
      lotId={lotId}
      warehouseId={warehouseId}
      movement={movement}
      setMovement={setMovement}
      deliveryList={deliveryList}
      setDeliveryId={setDeliveryId}
      resolvedDeliveryId={resolvedDeliveryId}
      onlineHint={onlineHint}
      data={data}
    />
  );
}
