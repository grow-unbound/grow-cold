'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoginPhoneRequestSchema, type LoginPhoneRequest } from '@growcold/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SixDigitOtp } from '@/components/auth/six-digit-otp';

type Step = 'need_sid' | 'otp';

export function VerifyOtpForm() {
  const { t } = useTranslation('authVerify');
  const { t: tLogin } = useTranslation('login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const hint = searchParams.get('hint') ?? '';

  const [step, setStep] = useState<Step>(() => (sid ? 'otp' : 'need_sid'));
  const [sessionId, setSessionId] = useState<string | null>(sid);
  const [otpHint, setOtpHint] = useState(hint);
  const [error, setError] = useState<string | null>(null);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resending, setResending] = useState(false);
  const verifyInFlightRef = useRef(false);

  useEffect(() => {
    verifyInFlightRef.current = false;
  }, [sessionId, otpResetKey]);

  useEffect(() => {
    if (sid) {
      setSessionId(sid);
      setOtpHint(hint);
      setStep('otp');
    }
  }, [sid, hint]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const tmr = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tmr);
  }, [resendIn]);

  const phoneForm = useForm<LoginPhoneRequest>({
    resolver: zodResolver(LoginPhoneRequestSchema),
    defaultValues: { phone: '' },
  });

  const verify = useCallback(
    async (code: string) => {
      if (!sessionId || verifyInFlightRef.current) return;
      verifyInFlightRef.current = true;
      setError(null);
      setVerifying(true);
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, code }),
        });
        const json = (await res.json()) as { error?: string; next?: string; code?: string };
        if (!res.ok) {
          setError(json.error ?? t('error_generic'));
          setOtpResetKey((k) => k + 1);
          setVerifying(false);
          verifyInFlightRef.current = false;
          return;
        }
        setRedirecting(true);
        const next = json.next === 'create_warehouse' ? '/onboarding/create-warehouse' : '/';
        router.replace(next);
        router.refresh();
      } catch {
        setVerifying(false);
        verifyInFlightRef.current = false;
      }
    },
    [sessionId, router, t],
  );

  const onSendPhone = phoneForm.handleSubmit(async (values) => {
    if (sendingCode || redirecting) return;
    setError(null);
    setSendingCode(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as {
        session_id?: string;
        otp_sent_to?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? t('error_generic'));
        return;
      }
      if (json.session_id) {
        setSessionId(json.session_id);
        setOtpHint(json.otp_sent_to ?? '');
        setStep('otp');
        setResendIn(30);
        setOtpResetKey((k) => k + 1);
      }
    } finally {
      setSendingCode(false);
    }
  });

  const onResend = async () => {
    if (!sessionId || resendIn > 0 || resending || redirecting) return;
    setError(null);
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? t('error_generic'));
        return;
      }
      setResendIn(30);
      setOtpResetKey((k) => k + 1);
    } finally {
      setResending(false);
    }
  };

  const phoneBusy = phoneForm.formState.isSubmitting || sendingCode || redirecting;
  const otpBusy = verifying || redirecting;

  if (step === 'need_sid') {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-base border border-neutral-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
          <p className="mt-1 text-caption text-neutral-600">{t('need_session')}</p>
        </div>
        <form className="flex flex-col gap-3" onSubmit={onSendPhone} noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-caption-sm font-medium text-neutral-800">
              {t('phone_label')}
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              disabled={phoneBusy}
              className="rounded-base border border-neutral-200 px-3 py-2 text-sm outline-none ring-primary-500 focus:border-primary-500 focus:ring-1 disabled:bg-neutral-50"
              {...phoneForm.register('phone')}
            />
            {phoneForm.formState.errors.phone?.message ? (
              <p className="text-caption text-red-600" role="alert">
                {phoneForm.formState.errors.phone.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={phoneBusy}>
            {phoneBusy ? tLogin('sending_code') : t('send_code')}
          </Button>
        </form>
        {error ? (
          <p className="text-caption text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <p className="text-caption text-neutral-500">
          <Link href="/signup" className="text-primary-600 underline-offset-2 hover:underline">
            {t('create_account')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-base border border-neutral-200 bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">{t('title_verify')}</h1>
        <p className="mt-1 text-caption text-neutral-600">
          {t('sent_prefix')}{' '}
          <span className="font-medium text-neutral-800">{otpHint || '—'}</span>
        </p>
      </div>
      <SixDigitOtp key={otpResetKey} disabled={otpBusy} onComplete={(code) => void verify(code)} />
      {otpBusy ? (
        <p className="text-center text-caption text-neutral-600" role="status">
          {redirecting ? tLogin('redirecting') : t('verifying')}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {resendIn > 0 ? (
          <p className="text-caption text-neutral-500">
            {t('resend_in', { seconds: resendIn })}
          </p>
        ) : (
          <button
            type="button"
            disabled={resending || otpBusy}
            className="text-left text-caption font-medium text-primary-600 underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => void onResend()}
          >
            {resending ? t('verifying') : t('resend')}
          </button>
        )}
        <Link href="/signup" className="text-caption text-primary-600 underline-offset-2 hover:underline">
          {t('change_email')}
        </Link>
      </div>
      {error ? (
        <p className="text-caption text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
