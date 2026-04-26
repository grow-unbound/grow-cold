import { Suspense } from 'react';
import { AuthBrandLogo } from '@/components/auth/auth-brand-logo';
import { VerifyOtpForm } from '@/components/auth/verify-otp-form';

export default function AuthVerifyPage() {
  return (
    <div className="auth-page">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
        <AuthBrandLogo />
        <Suspense fallback={<p className="text-sm text-neutral-600">Loading…</p>}>
          <VerifyOtpForm />
        </Suspense>
      </div>
    </div>
  );
}
