import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import { BookControls } from "@/components/book-controls";
import { isStatus, listShelf, STATUS_LABELS, STATUSES, type Status } from "@/lib/shelf";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function ShelfPage({ searchParams }: Props) {
  // The proxy already blocks signed-out visitors; this is a second check on the server.
  await auth.protect();
  const { status: rawStatus } = await searchParams;
  const status: Status | undefined = isStatus(rawStatus) ? rawStatus : undefined;

  const books = await listShelf(status);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold">My shelf</h1>
        <Link href="/search" className="text-sm font-medium text-accent">
          + Find more books
        </Link>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        <FilterLink href="/shelf" active={!status}>
          All
        </FilterLink>
        {STATUSES.map((s) => (
          <FilterLink key={s} href={`/shelf?status=${s}`} active={status === s}>
            {STATUS_LABELS[s]}
          </FilterLink>
        ))}
      </nav>

      {books.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center" role="status">
          <h2 className="font-serif text-xl font-semibold">
            {status ? `Nothing in “${STATUS_LABELS[status]}” yet` : "Your shelf is empty"}
          </h2>
          <p className="mt-2 text-muted">Search for a book you love and save it here.</p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90"
          >
            Search books
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
                <Link href={`/shelf/${book.id}`} className="font-serif text-lg font-semibold leading-snug hover:underline">
                  {book.title}
                </Link>
                <p className="text-sm text-muted">{book.authors.slice(0, 2).join(", ") || "Unknown author"}</p>
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

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-accent bg-accent text-background" : "border-border hover:bg-accent-soft"
      }`}
    >
      {children}
    </Link>
  );
}
