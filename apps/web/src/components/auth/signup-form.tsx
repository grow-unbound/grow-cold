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
    <div className="auth-panel">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-caption text-neutral-600">{t('subtitle')}</p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="full_name" className="text-label-lg font-semibold text-neutral-700">
            {t('full_name')}
          </label>
          <input
            id="full_name"
            autoComplete="name"
            disabled={busy}
            className="input-base"
            {...form.register('full_name')}
          />
          {form.formState.errors.full_name?.message ? (
            <p className="error-text" role="alert">
              {form.formState.errors.full_name.message}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="phone" className="text-label-lg font-semibold text-neutral-700">
            {t('phone')}
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('phone_placeholder')}
            disabled={busy}
            className="input-base"
            {...form.register('phone')}
          />
          {form.formState.errors.phone?.message ? (
            <p className="error-text" role="alert">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="email" className="text-label-lg font-semibold text-neutral-700">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('email_placeholder')}
            disabled={busy}
            className="input-base"
            {...form.register('email')}
          />
          {form.formState.errors.email?.message ? (
            <p className="error-text" role="alert">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="company_name" className="text-label-lg font-semibold text-neutral-700">
            {t('company')}
          </label>
          <input
            id="company_name"
            autoComplete="organization"
            disabled={busy}
            className="input-base"
            {...form.register('company_name')}
          />
          {form.formState.errors.company_name?.message ? (
            <p className="error-text" role="alert">
              {form.formState.errors.company_name.message}
            </p>
          ) : null}
        </div>
        <label className="flex cursor-pointer items-start gap-3 py-1 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 rounded border-2 border-neutral-300"
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
          <p className="error-text" role="alert">
            {form.formState.errors.agreed_to_terms.message}
          </p>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? t('submitting') : t('submit')}
        </Button>
      </form>
      {error ? (
        <p className="error-text" role="alert">
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
