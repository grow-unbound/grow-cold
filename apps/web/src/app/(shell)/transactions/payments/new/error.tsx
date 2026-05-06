'use client';

import Link from 'next/link';

export default function OperationalPaymentNewError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card w-full max-w-[560px]">
      <p className="text-body-sm text-outward">Something went wrong.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/transactions" className="btn-ghost">
          Back to transactions
        </Link>
      </div>
    </div>
  );
}
