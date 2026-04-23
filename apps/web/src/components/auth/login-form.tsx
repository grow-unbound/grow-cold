'use client';

import { LoginPhoneRequestSchema, type LoginPhoneRequest } from '@growcold/shared';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { IndiaPhoneField } from '@/components/auth/india-phone-field';
import { SixDigitOtp } from '@/components/auth/six-digit-otp';

type Step = 'phone' | 'otp';

type VerifyOtpJson = {
  error?: string;
  code?: string;
  next?: string;
  attempts_remaining?: number;
};

export function LoginForm() {
  const { t } = useTranslation('login');
  const { t: tAuth } = useTranslation('authVerify');
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [otpHint, setOtpHint] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resending, setResending] = useState(false);
  const [national, setNational] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [mustResend, setMustResend] = useState(false);
  const verifyInFlightRef = useRef(false);

  useEffect(() => {
    verifyInFlightRef.current = false;
  }, [sessionId, otpResetKey]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const tmr = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tmr);
  }, [resendIn]);

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendingCode) return;
    setError(null);
    const values: LoginPhoneRequest = { phone: `+91${national}` };
    const parsed = LoginPhoneRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('config_error'));
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as {
        session_id?: string;
        otp_sent_to?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? t('config_error'));
        return;
      }
      if (json.session_id) {
        setSessionId(json.session_id);
        setOtpHint(json.otp_sent_to ?? '');
        setStep('otp');
        setOtpCode('');
        setMustResend(false);
        setResendIn(30);
        setOtpResetKey((k) => k + 1);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const verify = useCallback(
    async (code: string) => {
      if (!sessionId || verifyInFlightRef.current || mustResend) return;
      if (code.length !== 6 || !/^\d{6}$/.test(code)) return;
      verifyInFlightRef.current = true;
      setError(null);
      setVerifying(true);
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, code }),
        });
        const json = (await res.json()) as VerifyOtpJson;
        if (!res.ok) {
          if (json.code === 'MUST_RESEND') {
            setMustResend(true);
            setResendIn(0);
            setError(tAuth('must_resend_otp'));
            setOtpResetKey((k) => k + 1);
          } else if (json.code === 'INVALID_OTP' && typeof json.attempts_remaining === 'number') {
            setMustResend(false);
            setError(
              json.attempts_remaining === 1
                ? tAuth('incorrect_otp_attempts_left_one')
                : tAuth('incorrect_otp_attempts_left_other', { count: json.attempts_remaining }),
            );
            setOtpResetKey((k) => k + 1);
          } else {
            setError(json.error ?? t('config_error'));
            setOtpResetKey((k) => k + 1);
          }
          setVerifying(false);
          verifyInFlightRef.current = false;
          return;
        }
        const q = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const fromQuery = q.get('next');
        const destination =
          json.next === 'create_warehouse'
            ? '/onboarding/create-warehouse'
            : fromQuery?.startsWith('/')
              ? fromQuery
              : '/';
        router.replace(destination);
        router.refresh();
      } catch {
        setVerifying(false);
        verifyInFlightRef.current = false;
      }
    },
    [sessionId, mustResend, router, t, tAuth],
  );

  const onResend = async () => {
    if (!sessionId || resending) return;
    if (resendIn > 0 && !mustResend) return;
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
        setError(json.error ?? t('config_error'));
        return;
      }
      setMustResend(false);
      setResendIn(30);
      setOtpResetKey((k) => k + 1);
    } finally {
      setResending(false);
    }
  };

  const onOtpCodeChange = (code: string) => {
    setOtpCode(code);
    if (error && !mustResend) setError(null);
  };

  const onOtpComplete = useCallback(
    (code: string) => {
      if (mustResend || verifying || verifyInFlightRef.current) return;
      void verify(code);
    },
    [mustResend, verifying, verify],
  );

  const onChangeNumber = () => {
    setStep('phone');
    setSessionId(null);
    setOtpHint('');
    setOtpCode('');
    setResendIn(0);
    setError(null);
    setVerifying(false);
    setMustResend(false);
    setOtpResetKey((k) => k + 1);
    setNational('');
    verifyInFlightRef.current = false;
  };

  const phoneBusy = sendingCode;
  const otpBusy = verifying;

  return (
    <div className="auth-panel">
      {step === 'phone' ? (
        <>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{t('title')}</h1>
            <p className="mt-1 text-caption text-neutral-600">{t('subtitle')}</p>
          </div>
          <form className="flex flex-col gap-3" onSubmit={onSendOtp} noValidate>
            <IndiaPhoneField
              label={t('phone_label')}
              value={national}
              onChange={setNational}
              disabled={phoneBusy}
              errorMessage={null}
              placeholder={t('phone_placeholder')}
            />
            <Button type="submit" className="w-full" disabled={phoneBusy}>
              {phoneBusy ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  {t('sending_code')}
                </>
              ) : (
                t('send_otp')
              )}
            </Button>
          </form>
          {error ? (
            <p className="error-text" role="alert">
              {error}
            </p>
          ) : null}
          <p className="text-caption text-neutral-500">
            <Link href="/signup" className="text-primary-600 underline-offset-2 hover:underline">
              {t('create_account')}
            </Link>
          </p>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{tAuth('enter_otp_title')}</h1>
            <p className="mt-1 text-caption text-neutral-600">{tAuth('enter_otp_help')}</p>
          </div>
          <p className="text-center text-caption text-neutral-600">
            <span className="text-neutral-600">{tAuth('otp_sent_to_prefix')}</span>{' '}
            <span className="font-semibold text-neutral-900">{otpHint || '—'}</span>
          </p>
          <SixDigitOtp
            key={otpResetKey}
            disabled={otpBusy || mustResend}
            onChange={onOtpCodeChange}
            onComplete={onOtpComplete}
            error={!!error}
          />
          {error ? (
            <p className="error-text text-center" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={otpBusy || otpCode.length !== 6 || mustResend}
            onClick={() => void verify(otpCode)}
          >
            {otpBusy ? (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                {tAuth('verifying')}
              </>
            ) : (
              tAuth('verify_otp')
            )}
          </Button>
          <div className="flex flex-col items-center gap-1">
            {resendIn > 0 && !mustResend ? (
              <p className="text-caption text-neutral-500">
                {tAuth('resend_otp_in', { seconds: resendIn })}
              </p>
            ) : (
              <button
                type="button"
                disabled={resending || otpBusy}
                className="text-caption font-medium text-primary-600 underline-offset-2 hover:underline disabled:opacity-50"
                onClick={() => void onResend()}
              >
                {resending ? tAuth('resending') : tAuth('resend')}
              </button>
            )}
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onChangeNumber}
              className="inline-flex items-center gap-0.5 text-caption font-medium text-neutral-600 hover:text-neutral-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              {tAuth('change_number')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
