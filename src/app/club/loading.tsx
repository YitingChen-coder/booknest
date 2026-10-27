export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10" role="status" aria-label="Loading the book club">
      <div className="h-8 w-40 animate-pulse rounded bg-accent-soft" />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex animate-pulse gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="h-[168px] w-[112px] rounded-md bg-accent-soft" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 w-3/4 rounded bg-accent-soft" />
              <div className="h-3 w-1/2 rounded bg-accent-soft" />
              <div className="h-10 w-full rounded bg-accent-soft" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
