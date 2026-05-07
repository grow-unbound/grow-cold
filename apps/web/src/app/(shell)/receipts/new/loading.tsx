export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-1">
      <div className="h-8 w-48 rounded-base bg-surface-inset" />
      <div className="h-11 w-full rounded-base bg-surface-inset" />
      <div className="h-11 w-full rounded-base bg-surface-inset" />
      <div className="h-11 w-full rounded-base bg-surface-inset" />
    </div>
  );
}
