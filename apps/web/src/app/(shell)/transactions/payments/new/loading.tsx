export default function LoadingOperationalPaymentPage() {
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-3">
      <div className="h-4 w-24 animate-pulse rounded bg-surface-inset" />
      <div className="h-8 w-48 animate-pulse rounded bg-surface-inset" />
      <div className="h-40 animate-pulse rounded-base bg-surface-subtle" />
    </div>
  );
}
