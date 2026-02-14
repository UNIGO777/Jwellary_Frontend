const cn = (...parts) => parts.filter(Boolean).join(' ')

export default function PageLoader({ rows = 7, className }) {
  return (
    <div className={cn('rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8', className)}>
      <div className="animate-pulse space-y-5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200/80" />
            <div className="min-w-0 flex-1 space-y-2 pt-1.5">
              <div className={cn('h-3 rounded bg-zinc-200/80', idx % 3 === 0 ? 'w-11/12' : idx % 3 === 1 ? 'w-10/12' : 'w-9/12')} />
              <div className={cn('h-3 rounded bg-zinc-200/70', idx % 2 === 0 ? 'w-10/12' : 'w-8/12')} />
              <div className={cn('h-3 rounded bg-zinc-200/60', idx % 4 === 0 ? 'w-7/12' : 'w-6/12')} />
            </div>
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-zinc-200/70" />
          </div>
        ))}
      </div>
    </div>
  )
}

