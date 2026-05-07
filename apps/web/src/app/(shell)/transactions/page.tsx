'use client';

import { PAYMENT_METHOD } from '@growcold/shared';
import { Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateReceipt, useCustomersList, useReceiptsList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

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
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!dialogOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDialogOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialogOpen]);
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
        <p className="text-body-sm text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  const rows = listQ.data?.data ?? [];
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          (r.customer_name ?? '').toLowerCase().includes(q) ||
          (r.reference_number ?? '').toLowerCase().includes(q),
      )
    : rows;

  return (
    <div className="flex w-full flex-col gap-4 pb-28">
      {/* Header */}
      <h2 className="font-display text-2xl font-bold text-text-primary">{t('transactions.title')}</h2>

      {/* Search bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by party or reference…"
          className="input-base pl-9"
        />
      </div>

      {listQ.isPending && <p className="text-body-sm text-text-secondary">{t('loading')}</p>}
      {listQ.isError && <p className="text-outward text-body-sm">{t('error_load')}</p>}

      {!listQ.isPending && filtered.length === 0 && (
        <div className="card w-full">
          <p className="text-body-sm text-text-tertiary">{t('empty')}</p>
        </div>
      )}

      {filtered.length > 0 && (
        <>
          {/* Mobile card list */}
          <ul className="flex flex-col gap-2 lg:hidden">
            {filtered.map((row) => (
              <Link
                key={row.id}
                href={`/transaction/${row.kind}/${row.id}`}
                className="card active:scale-[0.985] transition-transform duration-fast block"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={row.kind === 'receipt' ? 'badge-inward' : 'badge-outward'}>
                        {row.kind === 'receipt' ? '↑ Receipt' : '↓ Payment'}
                      </span>
                      <p className="truncate font-display text-[20px] font-semibold text-text-primary">
                        {row.customer_name}
                      </p>
                    </div>
                    <p className="type-label mt-1">
                      {row.receipt_date}{row.payment_method ? ` · ${row.payment_method}` : ''}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 font-display text-[28px] font-bold tabular-nums ${
                      row.kind === 'receipt' ? 'text-inward' : 'text-outward'
                    }`}
                  >
                    {formatINR(Number(row.total_amount))}
                  </p>
                </div>
              </Link>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="type-label px-4 py-3 text-left">Date</th>
                  <th className="type-label px-4 py-3 text-left">Party</th>
                  <th className="type-label px-4 py-3 text-left">Type</th>
                  <th className="type-label px-4 py-3 text-left">Method</th>
                  <th className="type-label px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border transition-colors duration-fast hover:bg-surface-subtle cursor-pointer"
                    onClick={() => {
                      window.location.href = `/transaction/${row.kind}/${row.id}`;
                    }}
                  >
                    <td className="px-4 py-3 text-text-secondary">{row.receipt_date}</td>
                    <td className="px-4 py-3 font-semibold text-text-primary">{row.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={row.kind === 'receipt' ? 'badge-inward' : 'badge-outward'}>
                        {row.kind === 'receipt' ? '↑ Receipt' : '↓ Payment'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{row.payment_method ?? '—'}</td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        row.kind === 'receipt' ? 'text-inward' : 'text-outward'
                      }`}
                    >
                      {formatINR(Number(row.total_amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Contextual stacked FAB */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex flex-col items-end gap-2 lg:bottom-6">
        <Link
          href="/transactions/payments/new"
          className="flex h-10 items-center gap-2 rounded-full bg-surface-subtle px-4 text-small font-semibold text-text-primary shadow-md border border-border"
        >
          + Payment
        </Link>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-ui text-white shadow-lg transition-transform active:scale-95"
          aria-label="Record Receipt"
        >
          <Plus className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Receipt creation dialog */}
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
            <div className="flex items-center justify-between mb-3">
              <h2 id="receipt-title" className="h3">{t('transactions.dialog_title')}</h2>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-surface-subtle"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                <label className="type-label" htmlFor="rcustomer">
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
                <label className="type-label" htmlFor="rdate">
                  {t('transactions.date')} *
                </label>
                <input id="rdate" type="date" className="input-base" {...form.register('receipt_date')} />
              </div>
              <div className="form-field">
                <label className="type-label" htmlFor="ramount">
                  {t('transactions.amount')} *
                </label>
                <input id="ramount" inputMode="decimal" className="input-base" {...form.register('total_amount')} />
              </div>
              <div className="form-field">
                <label className="type-label" htmlFor="pmethod">
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
                <label className="type-label" htmlFor="ref">
                  Reference
                </label>
                <input id="ref" className="input-base" {...form.register('reference_number')} />
              </div>
              <div className="form-field">
                <label className="type-label" htmlFor="rnotes">
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
