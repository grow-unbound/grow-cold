import { Suspense } from 'react';
import { VerifyOtpForm } from '@/components/auth/verify-otp-form';

export default function AuthVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-3 py-8">
      <Suspense
        fallback={<p className="text-sm text-neutral-600">Loading…</p>}
      >
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
