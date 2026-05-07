'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { PaymentMethod } from '@growcold/shared';
import { formatINR } from '@growcold/shared';
import { ReceiptAllocationEditor } from '@/components/receipts/receipt-allocation-editor';
import { Button } from '@/components/ui/button';
import {
  useCreateReceipt,
  useCustomersList,
  useReceiptDetail,
  useUpdateReceipt,
} from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';
import { cn } from '@/lib/utils';

function partyLabel(code: string, name: string): string {
  return `${code} — ${name}`;
}

function normalizeReceiptPaymentMethod(
  p: PaymentMethod | null | undefined,
): 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' {
  if (p === 'UPI' || p === 'BANK_TRANSFER' || p === 'CHEQUE') return p;
  return 'CASH';
}

const receiptFormSchema = z.object({
  customer_id: z.string().uuid({ message: 'Party required' }),
  receipt_date: z.string().min(1),
  total_amount: z
    .string()
    .min(1)
    .refine((v) => Number.parseFloat(v.replace(/,/g, '')) > 0, 'Amount required'),
  payment_method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
  reference_number: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

const PAYMENT_OPTIONS = [
  { value: 'CASH', labelKey: 'receipts.payment_cash' },
  { value: 'UPI', labelKey: 'receipts.payment_upi' },
  { value: 'BANK_TRANSFER', labelKey: 'receipts.payment_neft' },
  { value: 'CHEQUE', labelKey: 'receipts.payment_cheque' },
] as const;

export interface AddReceiptFlowProps {
  lockedCustomerId?: string | null;
  mode?: 'create' | 'edit';
  receiptId?: string | null;
}

export function AddReceiptFlow({
  lockedCustomerId = null,
  mode = 'create',
  receiptId: initialReceiptId = null,
}: AddReceiptFlowProps) {
  const { t } = useTranslation('pages');
  const router = useRouter();
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);

  const [zone2Open, setZone2Open] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const [partyQ, setPartyQ] = useState('');
  const [wide, setWide] = useState(false);
  const [savedReceiptId, setSavedReceiptId] = useState<string | null>(initialReceiptId);
  const [postSavePrompt, setPostSavePrompt] = useState(false);

  const customersQ = useCustomersList(warehouseId);
  const createReceipt = useCreateReceipt(warehouseId);
  const updateReceipt = useUpdateReceipt(warehouseId, savedReceiptId);
  const receiptDetailQ = useReceiptDetail(mode === 'edit' ? initialReceiptId : null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      customer_id: lockedCustomerId ?? '',
      receipt_date: new Date().toISOString().slice(0, 10),
      total_amount: '',
      payment_method: 'CASH',
      reference_number: '',
      notes: '',
    },
    mode: 'onBlur',
  });

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
    if (lockedCustomerId) {
      form.setValue('customer_id', lockedCustomerId);
    }
  }, [lockedCustomerId, form]);

  useEffect(() => {
    const row = receiptDetailQ.data?.data;
    if (mode !== 'edit' || !row) return;
    form.reset({
      customer_id: row.customer_id,
      receipt_date: row.receipt_date.slice(0, 10),
      total_amount: row.total_amount,
      payment_method: normalizeReceiptPaymentMethod(row.payment_method ?? undefined),
      reference_number: row.reference_number ?? '',
      notes: row.notes ?? '',
    });
    setSavedReceiptId(row.id);
  }, [mode, receiptDetailQ.data?.data, form]);

  const customer_id = form.watch('customer_id');
  const total_amount = form.watch('total_amount');

  const selectedParty = useMemo(() => {
    const list = customersQ.data?.data ?? [];
    return list.find((c) => c.id === customer_id);
  }, [customersQ.data?.data, customer_id]);

  const filteredParties = useMemo(() => {
    const q = partyQ.trim().toLowerCase();
    const list = customersQ.data?.data ?? [];
    if (!q) return list;
    return list.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(q) || c.customer_code.toLowerCase().includes(q),
    );
  }, [customersQ.data?.data, partyQ]);

  const receiptAmountNum = Number.parseFloat(total_amount.replace(/,/g, ''));
  const receiptAmountOk = Number.isFinite(receiptAmountNum) && receiptAmountNum > 0;

  async function onSaveReceipt(values: ReceiptFormValues): Promise<void> {
    if (!warehouseId) return;
    try {
      const amt = values.total_amount.replace(/,/g, '');
      if (savedReceiptId) {
        await updateReceipt.mutateAsync({
          receipt_date: values.receipt_date,
          total_amount: amt,
          payment_method: values.payment_method,
          reference_number: values.reference_number || undefined,
          notes: values.notes || undefined,
        });
        toast.success(t('receipts.save_toast'));
      } else {
        const res = await createReceipt.mutateAsync({
          warehouse_id: warehouseId,
          customer_id: values.customer_id,
          receipt_date: values.receipt_date,
          total_amount: amt,
          payment_method: values.payment_method,
          reference_number: values.reference_number || undefined,
          notes: values.notes || undefined,
        });
        setSavedReceiptId(res.data.id);
        toast.success(t('receipts.save_toast'));
        if (!wide) {
          setPostSavePrompt(true);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('save_error'));
    }
  }

  if (!warehouseId) {
    return (
      <div className="card w-full">
        <p className="text-body-sm text-text-secondary">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (mode === 'edit' && receiptDetailQ.isPending) {
    return <p className="text-body-sm text-text-secondary">{t('receipts.loading_receipt')}</p>;
  }

  if (mode === 'edit' && receiptDetailQ.data?.data.allocation_confirmed_at) {
    return (
      <div className="card border-pending-border bg-pending-bg p-4">
        <p className="text-body-sm text-text-primary">{t('receipts.cannot_edit_confirmed')}</p>
        <Link href="/transactions" className="btn-secondary mt-3 inline-flex min-h-touch">
          {t('transactions.title')}
        </Link>
      </div>
    );
  }

  const showAllocationPanel =
    wide &&
    savedReceiptId &&
    customer_id &&
    receiptAmountOk &&
    mode === 'create';

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 pb-28 lg:pb-8">
      <header className="flex items-center gap-2">
        <Button type="button" variant="ghost" className="min-h-touch shrink-0 px-2" asChild>
          <Link href="/transactions">{t('back')}</Link>
        </Button>
        <h1 className="h2 flex-1 truncate">
          {mode === 'edit' ? t('receipts.edit_title') : t('receipts.add_title')}
        </h1>
      </header>

      <div
        className={cn(
          'flex flex-1 flex-col gap-6 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,560px)_1fr] lg:items-start lg:gap-8',
        )}
      >
        <section className="flex min-w-0 flex-col gap-3 lg:max-w-[560px]">
          <form
            className="flex flex-col gap-3"
            onSubmit={form.handleSubmit((v) => void onSaveReceipt(v))}
          >
            <div className="form-field">
              <label className="text-label font-medium text-text-primary" htmlFor="receipt_date">
                {t('receipts.date_label')} *
              </label>
              <input id="receipt_date" type="date" className="input-base w-full" {...form.register('receipt_date')} />
              {form.formState.errors.receipt_date ? (
                <p className="error-text">{form.formState.errors.receipt_date.message}</p>
              ) : null}
            </div>

            <div className="form-field relative">
              <label className="text-label font-medium text-text-primary" htmlFor="party_trigger">
                {t('receipts.party_label')} *
              </label>
              <button
                id="party_trigger"
                type="button"
                disabled={Boolean(lockedCustomerId) || mode === 'edit'}
                className={cn(
                  'input-base flex min-h-touch w-full items-center justify-between text-left',
                  (lockedCustomerId || mode === 'edit') && 'cursor-not-allowed opacity-80',
                )}
                onClick={() => !lockedCustomerId && mode !== 'edit' && setPartyOpen((o) => !o)}
              >
                <span className={cn(!customer_id && 'text-text-tertiary')}>
                  {selectedParty
                    ? partyLabel(selectedParty.customer_code, selectedParty.customer_name)
                    : t('receipts.select_party')}
                </span>
                <span aria-hidden className="text-text-tertiary">
                  ▼
                </span>
              </button>
              {form.formState.errors.customer_id ? (
                <p className="error-text">{t('receipts.party_required')}</p>
              ) : null}

              {partyOpen && !lockedCustomerId && mode !== 'edit' ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-base border border-border bg-white shadow-lg">
                  <input
                    type="search"
                    className="input-base sticky top-0 z-10 border-b border-border"
                    placeholder={t('receipts.search_party')}
                    value={partyQ}
                    onChange={(e) => setPartyQ(e.target.value)}
                    autoFocus
                  />
                  <ul className="py-1">
                    {filteredParties.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex min-h-touch w-full px-3 py-2 text-left text-body-sm hover:bg-surface-subtle"
                          onClick={() => {
                            form.setValue('customer_id', c.id, { shouldValidate: true });
                            setPartyOpen(false);
                            setPartyQ('');
                          }}
                        >
                          {partyLabel(c.customer_code, c.customer_name)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <input type="hidden" {...form.register('customer_id')} />
            </div>

            <div className="form-field">
              <label className="text-label font-medium text-text-primary" htmlFor="total_amount">
                {t('receipts.amount_label')} *
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  ₹
                </span>
                <input
                  id="total_amount"
                  inputMode="decimal"
                  className="input-base w-full pl-8"
                  {...form.register('total_amount')}
                />
              </div>
              {form.formState.errors.total_amount ? (
                <p className="error-text">{form.formState.errors.total_amount.message}</p>
              ) : null}
            </div>

            <div className="form-field">
              <label className="text-label font-medium text-text-primary" htmlFor="payment_method">
                {t('receipts.payment_method_label')} *
              </label>
              <select id="payment_method" className="input-base w-full" {...form.register('payment_method')}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="flex min-h-touch w-full items-center justify-between border-y border-dashed border-border py-3 text-left text-body-sm text-brand-text"
              onClick={() => setZone2Open((z) => !z)}
              aria-expanded={zone2Open}
            >
              <span>{t('receipts.zone2_toggle')}</span>
              <span aria-hidden>{zone2Open ? '⌃' : '⌄'}</span>
            </button>

            {zone2Open ? (
              <>
                <div className="form-field">
                  <label className="text-label font-medium text-text-primary" htmlFor="reference_number">
                    {t('receipts.reference_label')}
                  </label>
                  <input id="reference_number" className="input-base w-full" {...form.register('reference_number')} />
                </div>
                <div className="form-field">
                  <label className="text-label font-medium text-text-primary" htmlFor="notes">
                    {t('receipts.notes_label')}
                  </label>
                  <textarea id="notes" className="input-base min-h-[88px] w-full" {...form.register('notes')} />
                </div>
              </>
            ) : null}

            {postSavePrompt && !wide ? (
              <div className="card rounded-base border border-inward-border bg-inward-bg p-4">
                <p className="text-sm font-semibold text-text-primary">{t('receipts.receipt_saved')}</p>
                <p className="mt-1 text-body-sm text-text-primary">
                  {formatINR(receiptAmountNum)} {t('receipts.received_suffix')}
                </p>
                <p className="mt-2 text-body-sm text-text-primary">{t('receipts.allocate_question')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-touch flex-1"
                    onClick={() => router.back()}
                  >
                    {t('receipts.later')}
                  </Button>
                  <Button
                    type="button"
                    className="btn-primary min-h-touch flex-1"
                    onClick={() => savedReceiptId && router.push(`/receipts/${savedReceiptId}/allocate`)}
                  >
                    {t('receipts.allocate_now')}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-2 border-t border-border bg-white p-3 lg:relative lg:z-0 lg:border-t-0 lg:bg-transparent lg:p-0">
              <Button type="button" variant="ghost" className="min-h-touch flex-1" asChild>
                <Link href="/transactions">{t('receipts.cancel')}</Link>
              </Button>
              <Button
                type="submit"
                className="btn-primary min-h-touch flex-[2]"
                disabled={
                  createReceipt.isPending ||
                  updateReceipt.isPending ||
                  (mode === 'edit' && Boolean(receiptDetailQ.data?.data.allocation_confirmed_at))
                }
              >
                {t('receipts.save_receipt')}
              </Button>
            </div>
          </form>
        </section>

        {showAllocationPanel && savedReceiptId && selectedParty ? (
          <section className="flex min-h-[420px] flex-col rounded-base border border-border bg-surface-subtle/80 p-4 lg:min-h-[560px]">
            <ReceiptAllocationEditor
              warehouseId={warehouseId}
              receiptId={savedReceiptId}
              customerId={customer_id}
              customerName={selectedParty.customer_name}
              receiptAmount={receiptAmountNum}
              layout="rows"
              showSyncNote
              onConfirmed={() => router.push('/transactions')}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
