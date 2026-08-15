export function SkeletonLine({ width = "w-full" }: { width?: string }) {
  return <div className={`h-4 ${width} bg-[var(--nicole-border)] rounded animate-pulse`} />;
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-[var(--nicole-border)] bg-white space-y-2">
      <SkeletonLine width="w-1/3" />
      <SkeletonLine width="w-2/3" />
    </div>
  );
}

export function SkeletonMessage({ mine = false }: { mine?: boolean }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`w-2/3 h-10 rounded-2xl bg-[var(--nicole-border)] animate-pulse`} />
    </div>
  );
}
