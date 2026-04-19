'use client';

import type { CustomerCategory } from '@growcold/shared';
import { CUSTOMER_CATEGORY } from '@growcold/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCreateCustomer, useCustomersList } from '@/lib/shell-queries';
import { useSessionStore } from '@/stores/session-store';

type PartyForm = {
  customer_code: string;
  customer_name: string;
  phone: string;
  mobile: string;
  category: CustomerCategory;
  address: string;
  notes: string;
};

export default function PartiesPage() {
  const { t } = useTranslation('pages');
  const warehouseId = useSessionStore((s) => s.selectedWarehouseId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const listQ = useCustomersList(warehouseId);
  const create = useCreateCustomer(warehouseId);

  const form = useForm<PartyForm>({
    defaultValues: {
      customer_code: '',
      customer_name: '',
      phone: '',
      mobile: '',
      category: 'TRADER',
      address: '',
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
        <h1 className="h2">{t('parties.title')}</h1>
        <button type="button" className="btn-primary btn-base w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
          {t('parties.add_party')}
        </button>
      </div>

      {listQ.isPending && <p className="text-body-sm text-neutral-600">{t('loading')}</p>}
      {listQ.isError && <p className="text-danger-600 text-body-sm">{t('error_load')}</p>}

      {listQ.data && listQ.data.data.length === 0 && (
        <div className="card w-full">
          <p className="text-body-sm text-neutral-500">{t('empty')}</p>
        </div>
      )}

      {listQ.data && listQ.data.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {listQ.data.data.map((c) => (
            <li key={c.id} className="card">
              <p className="text-sm font-semibold text-neutral-900">{c.customer_name}</p>
              <p className="text-caption text-neutral-600">
                {c.customer_code} · {c.category}
              </p>
              <p className="text-caption text-neutral-600">
                {t('parties.phone')}: {c.phone}
              </p>
              {c.address ? <p className="mt-0.5 text-caption text-neutral-500">{c.address}</p> : null}
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
            className="card max-h-[90vh] w-full max-w-md overflow-y-auto"
            role="dialog"
            aria-labelledby="party-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="party-title" className="h3 mb-3">
              {t('parties.create_title')}
            </h2>
            <form
              className="flex flex-col gap-3"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await create.mutateAsync({
                    warehouse_id: warehouseId,
                    customer_code: values.customer_code,
                    customer_name: values.customer_name,
                    phone: values.phone,
                    mobile: values.mobile || undefined,
                    category: values.category,
                    credit_limit: '0',
                    address: values.address || undefined,
                    notes: values.notes || undefined,
                  });
                  setDialogOpen(false);
                  form.reset();
                } catch {
                  /* */
                }
              })}
            >
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="customer_code">
                  {t('parties.customer_code')} *
                </label>
                <input
                  id="customer_code"
                  className="input-base"
                  placeholder="A/BC/DEF.GH"
                  {...form.register('customer_code', { required: true })}
                />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="customer_name">
                  {t('parties.name')} *
                </label>
                <input
                  id="customer_name"
                  className="input-base"
                  {...form.register('customer_name', { required: true })}
                />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="category">
                  {t('parties.category')}
                </label>
                <select id="category" className="input-base" {...form.register('category')}>
                  {CUSTOMER_CATEGORY.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="phone">
                  {t('parties.phone')} *
                </label>
                <input id="phone" className="input-base" {...form.register('phone', { required: true })} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="mobile">
                  {t('parties.mobile_alt')}
                </label>
                <input id="mobile" className="input-base" {...form.register('mobile')} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="address">
                  Address
                </label>
                <textarea id="address" className="input-base min-h-[3rem]" {...form.register('address')} />
              </div>
              <div className="form-field">
                <label className="text-label font-semibold text-neutral-700" htmlFor="pnotes">
                  Notes
                </label>
                <textarea id="pnotes" className="input-base min-h-[3rem]" {...form.register('notes')} />
              </div>
              {create.isError && <p className="text-caption text-danger-600">{t('save_error')}</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button type="button" className="btn-secondary btn-base" onClick={() => setDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary btn-base" disabled={create.isPending}>
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
