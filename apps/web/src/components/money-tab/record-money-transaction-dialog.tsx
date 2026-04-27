'use client';

import {
  CreateReceiptRequestSchema,
  CreateWarehouseCashPaymentRequestSchema,
  PAYMENT_METHOD,
} from '@growcold/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import type { z } from 'zod';
import { useCreateMoneyPayment, useCreateReceipt, useCustomersList } from '@/lib/shell-queries';
import { cn } from '@/lib/utils';

const GREEN = '#16A34A';
const PURPLE = '#7C3AED';

type Mode = 'receipt' | 'payment';

const receiptFormSchema = CreateReceiptRequestSchema;
const paymentFormSchema = CreateWarehouseCashPaymentRequestSchema;
type ReceiptFormInput = {
  warehouse_id: string;
  customer_id: string;
  receipt_date: string;
  total_amount: string;
  payment_method?: z.infer<typeof CreateReceiptRequestSchema>['payment_method'];
  reference_number: string;
  notes: string;
};
type PaymentFormInput = {
  warehouse_id: string;
  payment_date: string;
  total_amount: string;
  payment_method?: z.infer<typeof CreateWarehouseCashPaymentRequestSchema>['payment_method'];
  recipient_name: string;
  notes: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
}

export function RecordMoneyTransactionDialog({ open, onClose, warehouseId }: Props) {
  const { t } = useTranslation('pages');
  const [mode, setMode] = useState<Mode>('receipt');
  const customersQ = useCustomersList(warehouseId);
  const createReceipt = useCreateReceipt(warehouseId);
  const createPayment = useCreateMoneyPayment(warehouseId);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const rForm = useForm<ReceiptFormInput>({
    resolver: zodResolver(receiptFormSchema) as Resolver<ReceiptFormInput>,
    defaultValues: {
      warehouse_id: warehouseId,
      customer_id: '',
      receipt_date: today,
      total_amount: '',
      payment_method: 'CASH',
      reference_number: '',
      notes: '',
    },
  });

  const pForm = useForm<PaymentFormInput>({
    resolver: zodResolver(paymentFormSchema) as Resolver<PaymentFormInput>,
    defaultValues: {
      warehouse_id: warehouseId,
      payment_date: today,
      total_amount: '',
      payment_method: 'CASH',
      recipient_name: '',
      notes: '',
    },
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="presentation"
      onClick={() => onClose()}
    >
      <div
        className="card-elevated max-h-[90vh] w-full max-w-md overflow-y-auto"
        role="dialog"
        aria-labelledby="money-record-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="money-record-title" className="h3 mb-3">
          {t('money.record_title')}
        </h2>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={cn('flex-1 rounded-lg py-2 text-label font-semibold text-white', mode === 'receipt' ? '' : 'opacity-50')}
            style={{ backgroundColor: mode === 'receipt' ? GREEN : '#9CA3AF' }}
            onClick={() => setMode('receipt')}
          >
            {t('money.mode_receipt')}
          </button>
          <button
            type="button"
            className={cn('flex-1 rounded-lg py-2 text-label font-semibold text-white', mode === 'payment' ? '' : 'opacity-50')}
            style={{ backgroundColor: mode === 'payment' ? PURPLE : '#9CA3AF' }}
            onClick={() => setMode('payment')}
          >
            {t('money.mode_payment')}
          </button>
        </div>

        {mode === 'receipt' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={rForm.handleSubmit(async (values) => {
              const parsed = CreateReceiptRequestSchema.parse(values);
              try {
                await createReceipt.mutateAsync(parsed);
                onClose();
                rForm.reset({ ...rForm.getValues(), total_amount: '', reference_number: '', notes: '' });
              } catch {
                /* */
              }
            })}
          >
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-customer">
                {t('transactions.customer')} *
              </label>
              <select
                id="m-customer"
                className="input-base"
                {...rForm.register('customer_id', { required: true })}
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
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-rdate">
                {t('transactions.date')} *
              </label>
              <input id="m-rdate" type="date" className="input-base" {...rForm.register('receipt_date')} />
            </div>
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-ramount">
                {t('transactions.amount')} *
              </label>
              <input id="m-ramount" inputMode="decimal" className="input-base" {...rForm.register('total_amount')} />
            </div>
            <div className="form-field">
              <p className="text-label-lg font-semibold text-neutral-700 mb-1">{t('transactions.method')}</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHOD.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      'rounded-full border-2 px-3 py-1.5 text-sm font-semibold',
                      rForm.watch('payment_method') === m ? 'bg-neutral-800 text-white border-neutral-800' : 'border-neutral-200',
                    )}
                    onClick={() => rForm.setValue('payment_method', m, { shouldValidate: true })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-rnotes">
                {t('stock.notes')}
              </label>
              <textarea id="m-rnotes" className="input-base min-h-[3rem]" {...rForm.register('notes')} />
            </div>
            {createReceipt.isError && <p className="error-text">{t('save_error')}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => onClose()}>
                {t('stock.cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={createReceipt.isPending}>
                {t('stock.save')}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={pForm.handleSubmit(async (values) => {
              const parsed = CreateWarehouseCashPaymentRequestSchema.parse(values);
              try {
                await createPayment.mutateAsync(parsed);
                onClose();
                pForm.reset({ ...pForm.getValues(), total_amount: '', recipient_name: '', notes: '' });
              } catch {
                /* */
              }
            })}
          >
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-recip">
                {t('money.recipient')} *
              </label>
              <input id="m-recip" className="input-base" {...pForm.register('recipient_name', { required: true })} />
            </div>
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-pdate">
                {t('transactions.date')} *
              </label>
              <input id="m-pdate" type="date" className="input-base" {...pForm.register('payment_date')} />
            </div>
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-pamount">
                {t('transactions.amount')} *
              </label>
              <input id="m-pamount" inputMode="decimal" className="input-base" {...pForm.register('total_amount')} />
            </div>
            <div className="form-field">
              <p className="text-label-lg font-semibold text-neutral-700 mb-1">{t('transactions.method')}</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHOD.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      'rounded-full border-2 px-3 py-1.5 text-sm font-semibold',
                      pForm.watch('payment_method') === m ? 'bg-neutral-800 text-white border-neutral-800' : 'border-neutral-200',
                    )}
                    onClick={() => pForm.setValue('payment_method', m, { shouldValidate: true })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="text-label-lg font-semibold text-neutral-700" htmlFor="m-pnotes">
                {t('stock.notes')}
              </label>
              <textarea id="m-pnotes" className="input-base min-h-[3rem]" {...pForm.register('notes')} />
            </div>
            {createPayment.isError && <p className="error-text">{t('save_error')}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button type="button" className="btn-secondary" onClick={() => onClose()}>
                {t('stock.cancel')}
              </button>
              <button type="submit" className="btn-primary" disabled={createPayment.isPending}>
                {t('stock.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
