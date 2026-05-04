'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { OP_PAYMENT_STATUS, PAYMENT_METHOD, type PaymentMethod } from '@growcold/shared';
import { Button } from '@/components/ui/button';
import {
  useCreateOperationalPayment,
  useLotDeliveries,
  useLotsList,
  useOperationalPaymentDetail,
  usePaymentTypes,
  useUpdateOperationalPayment,
} from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

const opFormSchema = z
  .object({
    payment_date: z.string().min(1),
    payment_type_id: z.string().uuid({ message: 'Select payment type' }),
    amount: z
      .string()
      .min(1)
      .refine((v) => Number.parseFloat(v.replace(/,/g, '')) > 0, 'Enter amount greater than zero'),
    payment_method: z.enum(PAYMENT_METHOD),
    status: z.enum(OP_PAYMENT_STATUS),
    party_name: z.string().max(200).optional(),
    party_phone: z
      .string()
      .max(20)
      .optional()
      .refine((s) => !s || /^\d{10}$/.test(s), 'Enter 10-digit mobile'),
    lot_id: z.string().optional(),
    delivery_id: z.string().optional(),
    notes: z.string().max(2000).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.delivery_id && v.delivery_id.length > 0 && !v.lot_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select lot for delivery', path: ['lot_id'] });
    }
  });

type OpFormValues = z.infer<typeof opFormSchema>;

function paymentMethodLabelKey(m: PaymentMethod): `operational_payment.${string}` {
  const map: Record<PaymentMethod, `operational_payment.${string}`> = {
    CASH: 'operational_payment.payment_cash',
    UPI: 'operational_payment.payment_upi',
    BANK_TRANSFER: 'operational_payment.payment_neft',
    CHEQUE: 'operational_payment.payment_cheque',
    OTHER: 'operational_payment.payment_other',
  };
  return map[m];
}

export interface OperationalPaymentFormProps {
  mode: 'create' | 'edit';
  paymentId?: string | null;
  initialLotId?: string | null;
}

export function OperationalPaymentForm({ mode, paymentId = null, initialLotId = null }: OperationalPaymentFormProps) {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [zone2Open, setZone2Open] = useState(false);
  const [wide, setWide] = useState(false);

  const paymentTypesQ = usePaymentTypes(warehouseId);
  const lotsQ = useLotsList(warehouseId);
  const create = useCreateOperationalPayment(warehouseId);
  const update = useUpdateOperationalPayment(warehouseId, mode === 'edit' ? paymentId : null);
  const detailQ = useOperationalPaymentDetail(mode === 'edit' ? paymentId : null);

  const form = useForm<OpFormValues>({
    resolver: zodResolver(opFormSchema),
    defaultValues: {
      payment_date: new Date().toISOString().slice(0, 10),
      payment_type_id: '',
      amount: '',
      payment_method: 'CASH',
      status: 'PAID',
      party_name: '',
      party_phone: '',
      lot_id: initialLotId ?? '',
      delivery_id: '',
      notes: '',
    },
    mode: 'onBlur',
  });

  const lotId = useWatch({ control: form.control, name: 'lot_id' });
  const deliveriesQ = useLotDeliveries(lotId && lotId.length > 0 ? lotId : null, Boolean(lotId && lotId.length > 0));
  const lotField = form.register('lot_id');

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    function apply() {
      setWide(mq.matches);
      setZone2Open(mq.matches);
    }
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !detailQ.data?.data) return;
    const d = detailQ.data.data;
    form.reset({
      payment_date: d.payment_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      payment_type_id: d.payment_type_id ?? '',
      amount: String(d.amount),
      payment_method: (d.payment_method as PaymentMethod) ?? 'CASH',
      status: d.status,
      party_name: d.party_name ?? '',
      party_phone: d.party_phone ?? '',
      lot_id: d.lot_id ?? '',
      delivery_id: d.delivery_id ?? '',
      notes: d.notes ?? '',
    });
  }, [mode, detailQ.data, form]);

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (paymentTypesQ.isError) {
    return <p className="text-danger-600 text-body-sm">{t('error_load')}</p>;
  }

  if (mode === 'edit' && detailQ.isPending) {
    return <p className="text-body-sm text-neutral-600">{t('loading')}</p>;
  }

  if (mode === 'edit' && (detailQ.isError || !detailQ.data)) {
    return <p className="text-danger-600 text-body-sm">{t('error_load')}</p>;
  }

  const types = paymentTypesQ.data?.data ?? [];
  const lots = lotsQ.data?.data ?? [];
  const deliveries = deliveriesQ.data?.data.deliveries ?? [];

  return (
    <div className="w-full max-w-[560px]">
      <form
        className="flex flex-col gap-3 pb-24"
        onSubmit={form.handleSubmit(async (values) => {
          const lotIdVal = values.lot_id && values.lot_id.length > 0 ? values.lot_id : undefined;
          const delVal = values.delivery_id && values.delivery_id.length > 0 ? values.delivery_id : undefined;
          try {
            if (mode === 'create') {
              await create.mutateAsync({
                warehouse_id: warehouseId,
                payment_type_id: values.payment_type_id,
                amount: values.amount,
                payment_method: values.payment_method,
                status: values.status,
                payment_date: values.payment_date,
                lot_id: lotIdVal,
                delivery_id: delVal,
                party_name: values.party_name || undefined,
                party_phone: values.party_phone || undefined,
                notes: values.notes || undefined,
              });
            } else {
              await update.mutateAsync({
                payment_type_id: values.payment_type_id,
                amount: values.amount,
                payment_method: values.payment_method,
                status: values.status,
                payment_date: values.payment_date,
                lot_id: lotIdVal ?? null,
                delivery_id: delVal ?? null,
                party_name: values.party_name || null,
                party_phone: values.party_phone || null,
                notes: values.notes || null,
              });
            }
            toast.success(t('operational_payment.save_toast'));
            router.push('/transactions');
          } catch {
            /* mutation surfaces via isError */
          }
        })}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="form-field">
            <label className="text-label font-medium text-neutral-800" htmlFor="op_date">
              {t('operational_payment.date_label')} *
            </label>
            <input id="op_date" type="date" className="input-base w-full" {...form.register('payment_date')} />
          </div>
          <div className="form-field">
            <label className="text-label font-medium text-neutral-800" htmlFor="op_ptype">
              {t('operational_payment.payment_type_label')} *
            </label>
            <select id="op_ptype" className="input-base w-full" {...form.register('payment_type_id')}>
              <option value="">{t('operational_payment.select_payment_type')}</option>
              {types.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
            {form.formState.errors.payment_type_id ? (
              <p className="error-text">{t('operational_payment.type_required')}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="form-field">
            <label className="text-label font-medium text-neutral-800" htmlFor="op_amt">
              {t('operational_payment.amount_label')} *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">₹</span>
              <input
                id="op_amt"
                inputMode="decimal"
                className="input-base w-full pl-8"
                {...form.register('amount')}
              />
            </div>
            {form.formState.errors.amount ? (
              <p className="error-text">{t('operational_payment.amount_required')}</p>
            ) : null}
          </div>
          <div className="form-field">
            <label className="text-label font-medium text-neutral-800" htmlFor="op_pm">
              {t('operational_payment.payment_method_label')} *
            </label>
            <select id="op_pm" className="input-base w-full" {...form.register('payment_method')}>
              {PAYMENT_METHOD.map((m) => (
                <option key={m} value={m}>
                  {t(paymentMethodLabelKey(m))}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field sm:max-w-none">
          <label className="text-label font-medium text-neutral-800" htmlFor="op_st">
            {t('operational_payment.status_label')} *
          </label>
          <select id="op_st" className="input-base w-full sm:max-w-xs" {...form.register('status')}>
            <option value="PAID">{t('operational_payment.status_paid')}</option>
            <option value="PENDING">{t('operational_payment.status_pending')}</option>
          </select>
        </div>

        <button
          type="button"
          className="flex min-h-touch w-full items-center justify-between border-y border-dashed border-neutral-200 py-3 text-left text-body-sm text-primary-600"
          onClick={() => setZone2Open((z) => !z)}
          aria-expanded={zone2Open}
        >
          <span>{t('operational_payment.zone2_toggle')}</span>
          <span aria-hidden>{zone2Open ? '⌃' : '⌄'}</span>
        </button>

        {zone2Open ? (
          <>
            <div className="form-field">
              <label className="text-label font-medium text-neutral-800" htmlFor="op_party">
                {t('operational_payment.recipient_name_label')}
              </label>
              <input id="op_party" className="input-base w-full" {...form.register('party_name')} />
            </div>
            <div className="form-field">
              <label className="text-label font-medium text-neutral-800" htmlFor="op_phone">
                {t('operational_payment.recipient_phone_label')}
              </label>
              <input id="op_phone" inputMode="numeric" className="input-base w-full" {...form.register('party_phone')} />
              {form.formState.errors.party_phone ? (
                <p className="error-text">{t('operational_payment.phone_invalid')}</p>
              ) : null}
            </div>
            <div className="form-field">
              <label className="text-label font-medium text-neutral-800" htmlFor="op_lot">
                {t('operational_payment.lot_label')}
              </label>
              <select
                id="op_lot"
                className="input-base w-full"
                {...lotField}
                onChange={(e) => {
                  lotField.onChange(e);
                  form.setValue('delivery_id', '', { shouldValidate: true });
                }}
              >
                <option value="">{t('operational_payment.select_lot')}</option>
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lot_number} — {l.product_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="text-label font-medium text-neutral-800" htmlFor="op_del">
                {t('operational_payment.delivery_label')}
              </label>
              <select
                id="op_del"
                className="input-base w-full"
                disabled={!lotId}
                {...form.register('delivery_id')}
              >
                <option value="">{t('operational_payment.select_delivery')}</option>
                {deliveries.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.delivery_date} · {d.num_bags_out} {t('inventory.bags_suffix')}
                  </option>
                ))}
              </select>
              {lotId && !deliveriesQ.isPending && deliveries.length === 0 ? (
                <p className="help-text text-caption text-neutral-500">{t('operational_payment.no_deliveries')}</p>
              ) : null}
            </div>
            <div className="form-field">
              <label className="text-label font-medium text-neutral-800" htmlFor="op_notes">
                {t('operational_payment.notes_label')}
              </label>
              <textarea id="op_notes" className="input-base min-h-[88px] w-full" {...form.register('notes')} />
            </div>
          </>
        ) : null}

        {(create.isError || update.isError) && <p className="error-text">{t('save_error')}</p>}

        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-neutral-200 bg-white p-3 lg:relative lg:z-0 lg:mt-4 lg:border-t-0 lg:bg-transparent lg:p-0',
            wide && 'lg:sticky lg:bottom-0',
          )}
        >
          <Button type="button" variant="ghost" className="min-h-touch flex-1" asChild>
            <Link href="/transactions">{t('operational_payment.cancel')}</Link>
          </Button>
          <Button
            type="submit"
            className="btn-primary min-h-touch flex-[2]"
            disabled={
              create.isPending ||
              update.isPending ||
              types.length === 0 ||
              (mode === 'edit' && detailQ.isPending)
            }
          >
            {t('operational_payment.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
