export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true" className="bg-white md:rounded-2xl border-y md:border border-slate-200 overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 p-4">
            <span className="w-10 h-10 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <span className="block h-3 w-40 rounded bg-slate-100" />
              <span className="block h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="aspect-[16/10] bg-slate-100" />
          <div className="p-4 space-y-2">
            <span className="block h-4 w-2/3 rounded bg-slate-100" />
            <span className="block h-4 w-1/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </>
  );
}
