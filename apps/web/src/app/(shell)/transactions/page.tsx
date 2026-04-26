'use client';

import { PAYMENT_METHOD, formatINR } from '@growcold/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateReceipt, useCustomersList, useReceiptsList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

type ReceiptForm = {
  customer_id: string;
  receipt_date: string;
  total_amount: string;
  payment_method: string;
  reference_number: string;
  notes: string;
};

export default function TransactionsPage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const listQ = useReceiptsList(warehouseId);
  const customersQ = useCustomersList(warehouseId);
  const create = useCreateReceipt(warehouseId);

  const form = useForm<ReceiptForm>({
    defaultValues: {
      customer_id: '',
      receipt_date: new Date().toISOString().slice(0, 10),
      total_amount: '',
      payment_method: 'CASH',
      reference_number: '',
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
        <h1 className="h2">{t('transactions.title')}</h1>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          {t('transactions.record_receipt')}
        </button>
      </div>

      <p className="text-caption text-neutral-500">
        {t('transactions.receipt_badge')} — {t('transactions.payment_badge')} (coming soon) will appear together here.
      </p>

      {listQ.isPending && <p className="text-body-sm text-neutral-600">{t('loading')}</p>}
      {listQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

      {listQ.data && listQ.data.data.length === 0 && (
        <div className="card w-full">
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        </div>
      )}

      {listQ.data && listQ.data.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {listQ.data.data.map((row) => (
            <li
              key={row.id}
              className={cn(
                'card-elevated flex flex-col gap-1 border-0 border-l-4 border-solid sm:flex-row sm:items-center sm:justify-between',
                row.kind === 'receipt' ? 'border-l-accent-500' : 'border-l-primary-500',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-caption font-semibold',
                      row.kind === 'receipt'
                        ? 'bg-accent-100 text-accent-800'
                        : 'bg-primary-100 text-primary-800',
                    )}
                  >
                    {row.kind === 'receipt' ? t('transactions.receipt_badge') : t('transactions.payment_badge')}
                  </span>
                  <span className="text-sm font-semibold text-neutral-900">{row.customer_name}</span>
                </div>
                <p className="text-caption text-neutral-500">
                  {t('transactions.date')}: {row.receipt_date}
                  {row.payment_method ? ` · ${t('transactions.method')}: ${row.payment_method}` : null}
                </p>
                {row.reference_number ? (
                  <p className="text-caption text-neutral-500">Ref: {row.reference_number}</p>
                ) : null}
              </div>
              <p className="text-sm font-bold text-neutral-900">{formatINR(Number(row.total_amount))}</p>
            </li>
          ))}
        </ul>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="presentation"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="card-elevated max-h-[90vh] w-full max-w-md overflow-y-auto"
            role="dialog"
            aria-labelledby="receipt-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="receipt-title" className="h3 mb-3">
              {t('transactions.dialog_title')}
            </h2>
            <form
              className="flex flex-col gap-3"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await create.mutateAsync({
                    warehouse_id: warehouseId,
                    customer_id: values.customer_id,
                    receipt_date: values.receipt_date,
                    total_amount: values.total_amount,
                    payment_method:
                      values.payment_method && values.payment_method !== ''
                        ? (values.payment_method as (typeof PAYMENT_METHOD)[number])
                        : undefined,
                    reference_number: values.reference_number || undefined,
                    notes: values.notes || undefined,
                  });
                  setDialogOpen(false);
                  form.reset({
                    ...form.getValues(),
                    total_amount: '',
                    reference_number: '',
                    notes: '',
                  });
                } catch {
                  /* */
                }
              })}
            >
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="rcustomer">
                  {t('transactions.customer')} *
                </label>
                <select id="rcustomer" className="input-base" {...form.register('customer_id', { required: true })}>
                  <option value="">—</option>
                  {(customersQ.data?.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="rdate">
                  {t('transactions.date')} *
                </label>
                <input id="rdate" type="date" className="input-base" {...form.register('receipt_date')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="ramount">
                  {t('transactions.amount')} *
                </label>
                <input id="ramount" inputMode="decimal" className="input-base" {...form.register('total_amount')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="pmethod">
                  {t('transactions.method')}
                </label>
                <select id="pmethod" className="input-base" {...form.register('payment_method')}>
                  <option value="">—</option>
                  {PAYMENT_METHOD.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="ref">
                  Reference
                </label>
                <input id="ref" className="input-base" {...form.register('reference_number')} />
              </div>
              <div className="form-field">
                <label className="text-label-lg font-semibold text-neutral-700" htmlFor="rnotes">
                  Notes
                </label>
                <textarea id="rnotes" className="input-base min-h-[3rem]" {...form.register('notes')} />
              </div>
              {create.isError && <p className="error-text">{t('save_error')}</p>}
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={create.isPending}>
                  {t('parties.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
