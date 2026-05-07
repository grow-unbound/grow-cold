export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-1">
      <div className="h-8 w-56 rounded-base bg-surface-inset" />
      <div className="h-24 w-full rounded-base bg-surface-inset" />
      <div className="h-24 w-full rounded-base bg-surface-inset" />
    </div>
  );
}
