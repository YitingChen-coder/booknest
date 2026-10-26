import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { BookControls } from "@/components/book-controls";
import { formatDate } from "@/lib/format";
import {
  getShelfStats,
  isSort,
  isStatus,
  listShelf,
  SORTS,
  STATUS_LABELS,
  STATUSES,
  type Sort,
  type Status,
} from "@/lib/shelf";

type Props = { searchParams: Promise<{ status?: string; sort?: string }> };

function shelfHref(status: Status | undefined, sort: Sort) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (sort !== "recent") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/shelf?${qs}` : "/shelf";
}

export default async function ShelfPage({ searchParams }: Props) {
  // The proxy already blocks signed-out visitors; this is a second check on the server.
  await auth.protect();
  const params = await searchParams;
  const status: Status | undefined = isStatus(params.status) ? params.status : undefined;
  const sort: Sort = isSort(params.sort) ? params.sort : "recent";

  const [books, stats] = await Promise.all([listShelf({ status, sort }), getShelfStats()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">My shelf</h1>
          {stats.total > 0 && (
            <p className="mt-1 text-sm text-muted">
              {stats.total} book{stats.total === 1 ? "" : "s"} · {stats.finishedThisYear} finished in{" "}
              {new Date().getFullYear()}
            </p>
          )}
        </div>
        <Link href="/search" className="text-sm font-medium text-accent">
          + Find more books
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
          <Chip href={shelfHref(undefined, sort)} active={!status} count={stats.total}>
            All
          </Chip>
          {STATUSES.map((s) => (
            <Chip key={s} href={shelfHref(s, sort)} active={status === s} count={stats.byStatus[s]}>
              {STATUS_LABELS[s]}
            </Chip>
          ))}
        </nav>

        {books.length > 1 && (
          <nav className="flex items-center gap-1 text-sm" aria-label="Sort">
            <span className="text-muted">Sort:</span>
            {(Object.keys(SORTS) as Sort[]).map((s) => (
              <Link
                key={s}
                href={shelfHref(status, s)}
                aria-current={sort === s ? "true" : undefined}
                className={`rounded-md px-2 py-1 ${sort === s ? "font-medium text-accent" : "text-muted hover:text-foreground"}`}
              >
                {SORTS[s]}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {books.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center" role="status">
          <h2 className="font-serif text-xl font-semibold">
            {status ? `Nothing in “${STATUS_LABELS[status]}” yet` : "Your shelf is empty"}
          </h2>
          <p className="mt-2 text-muted">
            {status
              ? "Change a book’s status from its card, or find a new one."
              : "Search for a book you love, or browse a subject, and save it here."}
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Find books
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <li key={book.id} className="flex gap-4 rounded-xl border border-border bg-surface p-4" data-testid="shelf-book">
              <Link href={`/shelf/${book.id}`} className="shrink-0">
                <BookCover coverId={book.cover_id} title={book.title} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/shelf/${book.id}`}
                  className="font-serif text-lg font-semibold leading-snug hover:underline"
                  data-testid="shelf-book-title"
                >
                  {book.title}
                </Link>
                <p className="text-sm text-muted">{book.authors.slice(0, 2).join(", ") || "Unknown author"}</p>
                {book.finished_at && <p className="text-xs text-accent">Finished {formatDate(book.finished_at)}</p>}
                <div className="mt-auto pt-2">
                  <BookControls bookId={book.id} status={book.status} rating={book.rating} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
        active ? "border-accent bg-accent text-background" : "border-border hover:bg-accent-soft"
      }`}
    >
      {children}
      <span className={`text-xs ${active ? "opacity-80" : "text-muted"}`}>{count}</span>
    </Link>
  );
}
