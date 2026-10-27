import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { addNote, deleteNote } from "@/app/actions";
import { BookCover } from "@/components/book-cover";
import { BookGridSkeleton } from "@/components/book-grid";
import { BookSuggestions } from "@/components/book-suggestions";
import { BookControls } from "@/components/book-controls";
import { RemoveBookButton } from "@/components/remove-book-button";
import { formatDate } from "@/lib/format";
import { getAuthorBooks, getWorkDetails } from "@/lib/open-library";
import { getSavedBook, listNotes } from "@/lib/shelf";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookPage({ params }: PageProps<"/shelf/[id]">) {
  await auth.protect();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // RLS returns nothing for someone else's book, so it looks the same as a missing one.
  const book = await getSavedBook(id);
  if (!book) notFound();
  const notes = await listNotes(book.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/shelf" className="text-sm font-medium text-accent">
        ← My shelf
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <BookCover coverId={book.cover_id} title={book.title} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h1 className="font-serif text-3xl font-semibold leading-tight">{book.title}</h1>
          <p className="text-muted">
            {book.authors.join(", ") || "Unknown author"}
            {book.first_publish_year && ` · ${book.first_publish_year}`}
          </p>
          <p className="text-xs text-muted">
            Added {formatDate(book.created_at)}
            {book.finished_at && ` · Finished ${formatDate(book.finished_at)}`}
          </p>
          <div className="mt-2">
            <BookControls bookId={book.id} status={book.status} rating={book.rating} />
          </div>
          <a
            href={`https://openlibrary.org/works/${book.work_key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-accent underline"
          >
            View on Open Library
          </a>
        </div>
      </div>

      <Suspense fallback={<p className="mt-8 animate-pulse text-sm text-muted">Loading description from Open Library…</p>}>
        <About workKey={book.work_key} />
      </Suspense>

      <section className="mt-10">
        <h2 className="font-serif text-xl font-semibold">My notes</h2>
        <form action={addNote.bind(null, book.id)} className="mt-3 flex flex-col gap-2">
          <label htmlFor="body" className="sr-only">
            New note
          </label>
          <textarea
            id="body"
            name="body"
            required
            maxLength={2000}
            rows={3}
            placeholder="A quote, a thought, where you left off…"
            className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <button className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90">
            Add note
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No notes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-surface p-4" data-testid="note">
                <p className="whitespace-pre-wrap">{note.body}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted">
                  <time dateTime={note.created_at}>
                    {formatDate(note.created_at)}
                  </time>
                  <form action={deleteNote.bind(null, book.id, note.id)}>
                    <button className="hover:text-danger">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {book.authors[0] && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-semibold">More by {book.authors[0]}</h2>
          <Suspense fallback={<BookGridSkeleton count={5} label={`Loading more books by ${book.authors[0]}`} />}>
            <BookSuggestions
              load={() => getAuthorBooks(book.authors[0], book.work_key, 5)}
              unavailable="Open Library isn’t responding right now, so we can’t show more by this author."
            />
          </Suspense>
        </section>
      )}

      <div className="mt-12 border-t border-border pt-6">
        <RemoveBookButton bookId={book.id} title={book.title} />
      </div>
    </div>
  );
}

async function About({ workKey }: { workKey: string }) {
  const details = await getWorkDetails(workKey);
  if (!details) {
    return <p className="mt-8 text-sm text-muted">Open Library didn’t return a description right now.</p>;
  }
  if (!details.description && details.subjects.length === 0) return null;

  return (
    <section className="mt-8">
      {details.description && <p className="whitespace-pre-line leading-relaxed">{shorten(details.description, 1200)}</p>}
      {details.subjects.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {details.subjects.map((s) => (
            <li key={s} className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent">
              {s}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Cut long text at the last sentence end before `max` characters. */
function shorten(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"));
  return `${end > max / 2 ? cut.slice(0, end + 1) : cut.trimEnd()} …`;
}
