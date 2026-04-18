'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

const Schema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().max(200).optional(),
  capacity_bags: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export function CreateWarehouseForm() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', location: '', capacity_bags: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (redirecting) return;
    setError(null);
    let capacity_bags: number | undefined;
    const capRaw = values.capacity_bags?.trim();
    if (capRaw) {
      const n = Number(capRaw);
      if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
        setError(t('capacity_invalid'));
        return;
      }
      capacity_bags = n;
    }

    const res = await fetch('/api/onboarding/warehouse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name.trim(),
        location: values.location?.trim() || undefined,
        capacity_bags,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? t('error_generic'));
      return;
    }
    setRedirecting(true);
    router.replace('/');
    router.refresh();
  });

  const busy = form.formState.isSubmitting || redirecting;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-base border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-caption text-neutral-600">{t('subtitle')}</p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="wh-name" className="text-caption-sm font-medium text-neutral-800">
            {t('name_label')}
          </label>
          <input
            id="wh-name"
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('name')}
          />
          {form.formState.errors.name?.message ? (
            <p className="text-caption text-red-600" role="alert">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="wh-loc" className="text-caption-sm font-medium text-neutral-800">
            {t('location_label')}
          </label>
          <input
            id="wh-loc"
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('location')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="wh-cap" className="text-caption-sm font-medium text-neutral-800">
            {t('capacity_label')}
          </label>
          <input
            id="wh-cap"
            type="number"
            inputMode="numeric"
            min={1}
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('capacity_bags')}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t('submitting') : t('submit')}
        </Button>
      </form>
      {error ? (
        <p className="text-caption text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
