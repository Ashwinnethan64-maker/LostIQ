export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 animate-pulse">
      <div className="h-40 w-full bg-accent/50 rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-accent/70 rounded" />
        <div className="h-3 w-1/2 bg-accent/40 rounded" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-accent/30 rounded" />
        <div className="h-3 w-4/5 bg-accent/30 rounded" />
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 w-2/3">
          <div className="h-3 w-20 bg-accent/50 rounded" />
          <div className="h-4 w-full bg-accent/70 rounded" />
        </div>
        <div className="h-6 w-16 bg-accent/60 rounded-full" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-2 w-full bg-accent/40 rounded" />
        <div className="h-2 w-full bg-accent/40 rounded" />
        <div className="h-2 w-full bg-accent/40 rounded" />
      </div>
      <div className="h-12 w-full bg-accent/30 rounded-lg" />
    </div>
  );
}
