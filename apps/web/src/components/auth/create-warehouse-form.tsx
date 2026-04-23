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
    <div className="auth-panel">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-caption text-neutral-600">{t('subtitle')}</p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="wh-name" className="text-label-lg font-semibold text-neutral-700">
            {t('name_label')}
          </label>
          <input id="wh-name" disabled={busy} className="input-base" {...form.register('name')} />
          {form.formState.errors.name?.message ? (
            <p className="error-text" role="alert">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="wh-loc" className="text-label-lg font-semibold text-neutral-700">
            {t('location_label')}
          </label>
          <input id="wh-loc" disabled={busy} className="input-base" {...form.register('location')} />
        </div>
        <div className="form-field">
          <label htmlFor="wh-cap" className="text-label-lg font-semibold text-neutral-700">
            {t('capacity_label')}
          </label>
          <input
            id="wh-cap"
            type="number"
            inputMode="numeric"
            min={1}
            disabled={busy}
            className="input-base"
            {...form.register('capacity_bags')}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? t('submitting') : t('submit')}
        </Button>
      </form>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
