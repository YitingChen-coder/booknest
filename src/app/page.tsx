import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { BookCover } from "@/components/book-cover";
import { BookGrid, BookGridSkeleton } from "@/components/book-grid";
import { BookSuggestions } from "@/components/book-suggestions";
import { getTrending } from "@/lib/open-library";
import { getShelfStats, listShelf, STATUS_LABELS, STATUSES } from "@/lib/shelf";

export default async function Home() {
  const { userId } = await auth();
  return userId ? <Overview /> : <Landing />;
}

function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <div className="flex items-center justify-between gap-10">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-accent">Your reading shelf</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            Find your next book. Keep track of every one you love.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Search millions of titles from Open Library, save them to your shelf, mark what you want to read, are reading,
            and have finished, and jot down notes as you go.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90">
              Create a free account
            </Link>
            <Link href="/sign-in" className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-accent-soft">
              I already have one
            </Link>
          </div>
        </div>
        <Suspense fallback={null}>
          <HeroCovers />
        </Suspense>
      </div>

      <ul className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          ["Search & browse", "Look up any title or author, or browse a subject’s best-rated books."],
          ["Save", "Put books on your shelf: want to read, reading, or read."],
          ["Remember", "Add notes and ratings. They’re there on any device you sign in from."],
        ].map(([title, body]) => (
          <li key={title} className="rounded-xl border border-border bg-surface p-5">
            <h2 className="font-serif text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A few of today's trending covers next to the landing headline. Hidden if Open Library is down. */
async function HeroCovers() {
  const result = await getTrending(24);
  const books = result.ok ? result.books.filter((b) => b.coverId).slice(0, 6) : [];
  if (books.length < 6) return null;
  return (
    <div className="hidden shrink-0 lg:block" aria-hidden="true">
      <div className="flex gap-3">
        {[0, 1, 2].map((col) => (
          // Middle column sits lower, like books on a shelf.
          <div key={col} className={`flex flex-col gap-3 ${col === 1 ? "pt-8" : ""}`}>
            {[books[col], books[col + 3]].map((book) => (
              <BookCover key={book.workKey} coverId={book.coverId} title={book.title} />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 text-right text-xs text-muted">Trending on Open Library today</p>
    </div>
  );
}

async function Overview() {
  const [stats, reading, recent] = await Promise.all([
    getShelfStats(),
    listShelf({ status: "reading", limit: 3 }),
    listShelf({ limit: 6 }),
  ]);
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold">Welcome back</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATUSES.map((s) => (
          <Link key={s} href={`/shelf?status=${s}`} className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <p className="text-sm text-muted">{STATUS_LABELS[s]}</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{stats.byStatus[s]}</p>
          </Link>
        ))}
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-4">
          <p className="text-sm text-accent">Finished in {year}</p>
          <p className="mt-1 font-serif text-3xl font-semibold text-accent">{stats.finishedThisYear}</p>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold">Currently reading</h2>
          {stats.byStatus.reading > reading.length && (
            <Link href="/shelf?status=reading" className="text-sm font-medium text-accent">
              See all {stats.byStatus.reading}
            </Link>
          )}
        </div>

        {reading.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-muted">
            {stats.total === 0 ? (
              <>
                Your shelf is empty.{" "}
                <Link href="/search" className="font-medium text-accent underline">
                  Find a book to start with
                </Link>
                .
              </>
            ) : (
              <>
                Nothing in progress. Pick something from{" "}
                <Link href="/shelf?status=want" className="font-medium text-accent underline">
                  Want to read
                </Link>{" "}
                and mark it Reading.
              </>
            )}
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-3">
            {reading.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/shelf/${book.id}`}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-3 hover:border-accent"
                >
                  <BookCover coverId={book.cover_id} title={book.title} size="sm" />
                  <div className="min-w-0">
                    <p className="font-serif font-semibold leading-snug">{book.title}</p>
                    <p className="mt-1 text-sm text-muted">{book.authors[0] ?? "Unknown author"}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-serif text-xl font-semibold">Recently added</h2>
            <Link href="/shelf" className="text-sm font-medium text-accent">
              Open my shelf
            </Link>
          </div>
          <BookGrid
            items={recent.map((book) => ({
              key: book.id,
              title: book.title,
              authors: book.authors,
              coverId: book.cover_id,
              href: `/shelf/${book.id}`,
            }))}
          />
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl font-semibold">Trending on Open Library today</h2>
          <Link href="/search" className="text-sm font-medium text-accent">
            Search for more
          </Link>
        </div>
        <Suspense fallback={<BookGridSkeleton label="Loading trending books" />}>
          <BookSuggestions load={() => getTrending(6)} unavailable="Open Library’s trending list isn’t available right now." />
        </Suspense>
      </section>
    </div>
  );
}
