export default function RecordDeliveryLoading() {
  return (
    <div className="flex max-w-[560px] flex-col gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card skeleton h-28 w-full animate-pulse bg-neutral-100" />
      ))}
    </div>
  );
}
