import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Suspense } from "react";
import { BookCover } from "@/components/book-cover";
import { SaveButton } from "@/components/save-button";
import { isSubject, PAGE_SIZE, searchBooks, SUBJECTS, type Subject } from "@/lib/open-library";
import { getSavedIds } from "@/lib/shelf";

type Props = { searchParams: Promise<{ q?: string; subject?: string; page?: string }> };

type Search = { q: string } | { subject: Subject };

function searchHref(search: Search, page = 1) {
  const params = new URLSearchParams("q" in search ? { q: search.q } : { subject: search.subject });
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

export default async function SearchPage({ searchParams }: Props) {
  await auth.protect();
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 200);
  const subject = isSubject(params.subject) ? params.subject : null;
  const page = Math.min(Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1), 50);
  const search: Search | null = q ? { q } : subject ? { subject } : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">
        {subject && !q ? `Browse: ${SUBJECTS[subject]}` : "Search books"}
      </h1>

      <form action="/search" className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Title or author
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Try “Le Guin” or “The Remains of the Day”"
          maxLength={200}
          autoFocus={!search}
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90">
          Search
        </button>
      </form>

      <SubjectChips active={q ? null : subject} />

      {search ? (
        // A new key restarts the loading state for every new search.
        <Suspense key={searchHref(search, page)} fallback={<ResultsSkeleton />}>
          <Results search={search} page={page} />
        </Suspense>
      ) : (
        <p className="mt-10 text-muted">
          Search by title or author, or pick a subject above to see its most highly rated books. Results come from
          Open Library.
        </p>
      )}
    </div>
  );
}

function SubjectChips({ active }: { active: Subject | null }) {
  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Browse by subject">
      <span className="py-1 text-muted">Browse:</span>
      {(Object.keys(SUBJECTS) as Subject[]).map((key) => (
        <Link
          key={key}
          href={searchHref({ subject: key })}
          aria-current={active === key ? "page" : undefined}
          className={`rounded-full border px-3 py-1 ${
            active === key ? "border-accent bg-accent text-background" : "border-border hover:bg-accent-soft"
          }`}
        >
          {SUBJECTS[key]}
        </Link>
      ))}
    </nav>
  );
}

async function Results({ search, page }: { search: Search; page: number }) {
  const result = await searchBooks(search, page);
  const label = "q" in search ? `“${search.q}”` : SUBJECTS[search.subject];

  if (!result.ok) {
    return (
      <StateBox title="Open Library isn’t responding right now">
        <p>This is on their side, not yours. Your shelf still works while search is down.</p>
        <div className="mt-4 flex gap-3">
          <Link href={searchHref(search, page)} className="font-medium text-accent underline">
            Try again
          </Link>
          <Link href="/shelf" className="font-medium text-accent underline">
            Go to my shelf
          </Link>
        </div>
      </StateBox>
    );
  }

  if (result.books.length === 0) {
    return (
      <StateBox title={`No books found for ${label}`}>
        <p>Check the spelling, try fewer words, or search by the author’s last name.</p>
      </StateBox>
    );
  }

  let savedIds = new Map<string, string>();
  let shelfError = false;
  try {
    savedIds = await getSavedIds(result.books.map((b) => b.workKey));
  } catch {
    shelfError = true;
  }

  const lastPage = Math.min(Math.ceil(result.total / PAGE_SIZE), 50);

  return (
    <section className="mt-8" aria-live="polite">
      <p className="text-sm text-muted">
        {result.total.toLocaleString()} {"q" in search ? "results" : "books, most highly rated first"}
        {lastPage > 1 && ` · page ${page} of ${lastPage}`}
      </p>
      {shelfError && (
        <p role="alert" className="mt-3 rounded-md border border-danger/40 px-3 py-2 text-sm text-danger">
          We couldn’t check your shelf right now, so saving may not work.
        </p>
      )}

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {result.books.map((book) => (
          <li key={book.workKey} className="flex gap-4 rounded-xl border border-border bg-surface p-4" data-testid="search-result">
            <BookCover coverId={book.coverId} title={book.title} />
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="font-serif text-lg font-semibold leading-snug">{book.title}</h2>
              <p className="mt-1 text-sm text-muted">{book.authors.slice(0, 3).join(", ") || "Unknown author"}</p>
              <p className="mt-1 text-xs text-muted">
                {[
                  book.firstPublishYear && `First published ${book.firstPublishYear}`,
                  book.editionCount && `${book.editionCount} edition${book.editionCount === 1 ? "" : "s"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-auto pt-3">
                <SaveButton book={book} savedId={savedIds.get(book.workKey) ?? null} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {lastPage > 1 && (
        <nav className="mt-8 flex justify-between text-sm" aria-label="Pages">
          {page > 1 ? (
            <Link href={searchHref(search, page - 1)} className="font-medium text-accent">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {page < lastPage && (
            <Link href={searchHref(search, page + 1)} className="font-medium text-accent">
              Next →
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}

function StateBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-xl border border-border bg-surface p-6" role="status">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-muted">{children}</div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8" role="status" aria-label="Searching Open Library">
      <p className="text-sm text-muted">Searching Open Library…</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex animate-pulse gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="h-[168px] w-[112px] rounded-md bg-accent-soft" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 w-3/4 rounded bg-accent-soft" />
              <div className="h-3 w-1/2 rounded bg-accent-soft" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
