'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { SignupRequestSchema, type SignupRequest } from '@growcold/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function SignupForm() {
  const { t } = useTranslation('signup');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const form = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequestSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      company_name: '',
      agreed_to_terms: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (redirecting) return;
    setError(null);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as {
      session_id?: string;
      otp_sent_to?: string;
      error?: string;
      code?: string;
    };
    if (!res.ok) {
      setError(json.error ?? t('error_generic'));
      return;
    }
    if (json.session_id && json.otp_sent_to) {
      setRedirecting(true);
      const q = new URLSearchParams({ sid: json.session_id, hint: json.otp_sent_to });
      router.push(`/auth/verify?${q.toString()}`);
    }
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
          <label htmlFor="full_name" className="text-caption-sm font-medium text-neutral-800">
            {t('full_name')}
          </label>
          <input
            id="full_name"
            autoComplete="name"
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('full_name')}
          />
          {form.formState.errors.full_name?.message ? (
            <p className="text-caption text-red-600" role="alert">
              {form.formState.errors.full_name.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-caption-sm font-medium text-neutral-800">
            {t('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('phone_placeholder')}
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('phone')}
          />
          {form.formState.errors.phone?.message ? (
            <p className="text-caption text-red-600" role="alert">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-caption-sm font-medium text-neutral-800">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('email_placeholder')}
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('email')}
          />
          {form.formState.errors.email?.message ? (
            <p className="text-caption text-red-600" role="alert">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="company_name" className="text-caption-sm font-medium text-neutral-800">
            {t('company')}
          </label>
          <input
            id="company_name"
            autoComplete="organization"
            disabled={busy}
            className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
            {...form.register('company_name')}
          />
          {form.formState.errors.company_name?.message ? (
            <p className="text-caption text-red-600" role="alert">
              {form.formState.errors.company_name.message}
            </p>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-caption text-neutral-700">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-neutral-300"
            disabled={busy}
            {...form.register('agreed_to_terms')}
          />
          <span>
            {t('terms_prefix')}{' '}
            <Link href="/terms" className="text-primary-600 underline-offset-2 hover:underline">
              {t('terms_link')}
            </Link>{' '}
            {t('terms_and')}{' '}
            <Link href="/privacy" className="text-primary-600 underline-offset-2 hover:underline">
              {t('privacy_link')}
            </Link>
          </span>
        </label>
        {form.formState.errors.agreed_to_terms?.message ? (
          <p className="text-caption text-red-600" role="alert">
            {form.formState.errors.agreed_to_terms.message}
          </p>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? t('submitting') : t('submit')}
        </Button>
      </form>
      {error ? (
        <p className="text-caption text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-caption text-neutral-500">
        <Link href="/login" className="text-primary-600 underline-offset-2 hover:underline">
          {t('have_account')}
        </Link>
      </p>
    </div>
  );
}
