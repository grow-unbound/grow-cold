'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card border-outward-border p-4">
      <h2 className="text-sm font-semibold text-text-primary">Something went wrong</h2>
      <p className="mt-1 text-body-sm text-outward">{error.message}</p>
      <button type="button" className="btn-secondary mt-3 min-h-touch" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
