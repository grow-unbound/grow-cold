'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  SendOtpRequestSchema,
  VerifyOtpRequestSchema,
  sendPhoneOtp,
  verifyPhoneOtp,
  type SendOtpRequest,
  type VerifyOtpRequest,
} from '@growcold/shared';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

type Step = 'phone' | 'otp';

export function LoginForm() {
  const { t } = useTranslation('login');
  const [step, setStep] = useState<Step>('phone');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phoneForm = useForm<SendOtpRequest>({
    resolver: zodResolver(SendOtpRequestSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<VerifyOtpRequest>({
    resolver: zodResolver(VerifyOtpRequestSchema),
    defaultValues: { phone: '', token: '' },
  });

  const onSendOtp = phoneForm.handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const result = await sendPhoneOtp(supabase, values);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      otpForm.setValue('phone', values.phone);
      setStep('otp');
      setMessage(t('otp_sent'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('config_error'));
    }
  });

  const onVerify = otpForm.handleSubmit(async (values) => {
    setError(null);
    setMessage(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const result = await verifyPhoneOtp(supabase, values);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessage(t('signed_in'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('config_error'));
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-base border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-caption text-neutral-600">{t('subtitle')}</p>
      </div>

      {step === 'phone' ? (
        <form className="flex flex-col gap-3" onSubmit={onSendOtp} noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-caption-sm font-medium text-neutral-800">
              {t('phone_label')}
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder={t('phone_placeholder')}
              className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1"
              {...phoneForm.register('phone')}
            />
            {phoneForm.formState.errors.phone?.message ? (
              <p className="text-caption text-red-600" role="alert">
                {phoneForm.formState.errors.phone.message}
              </p>
            ) : null}
          </div>
          <Button type="submit">{t('send_otp')}</Button>
        </form>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onVerify} noValidate>
          <input type="hidden" {...otpForm.register('phone')} />
          <div className="flex flex-col gap-1">
            <label htmlFor="token" className="text-caption-sm font-medium text-neutral-800">
              {t('otp_label')}
            </label>
            <input
              id="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1"
              {...otpForm.register('token')}
            />
            {otpForm.formState.errors.token?.message ? (
              <p className="text-caption text-red-600" role="alert">
                {otpForm.formState.errors.token.message}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('phone')}>
              {t('back')}
            </Button>
            <Button type="submit" className="flex-1">
              {t('verify')}
            </Button>
          </div>
        </form>
      )}

      {message ? (
        <p className="text-caption text-green-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-caption text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-caption text-neutral-500">
        <Link href="/" className="text-primary-600 underline-offset-2 hover:underline">
          {t('back_home')}
        </Link>
      </p>
    </div>
  );
}
