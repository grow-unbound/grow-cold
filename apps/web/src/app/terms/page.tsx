import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-sm text-neutral-700">
      <h1 className="text-lg font-semibold text-neutral-900">Terms &amp; Conditions</h1>
      <p className="mt-2">Placeholder — replace with your legal terms.</p>
      <Link href="/signup" className="mt-4 inline-block text-primary-600 underline-offset-2 hover:underline">
        Back to signup
      </Link>
    </div>
  );
}
