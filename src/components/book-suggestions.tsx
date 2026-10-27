import { BookGrid } from "@/components/book-grid";
import { SaveButton } from "@/components/save-button";
import type { BookList } from "@/lib/open-library";
import { getSavedIds } from "@/lib/shelf";

/**
 * Books from Open Library with a Save button each. Shows a short message if
 * Open Library is down, and nothing if the list is empty.
 */
export async function BookSuggestions({ load, unavailable }: { load: () => Promise<BookList>; unavailable: string }) {
  const result = await load();
  if (!result.ok) return <p className="mt-3 text-sm text-muted">{unavailable}</p>;
  if (result.books.length === 0) return null;

  let savedIds = new Map<string, string>();
  try {
    savedIds = await getSavedIds(result.books.map((b) => b.workKey));
  } catch {
    // Still show the books; Save will report its own error if the shelf is down.
  }

  return (
    <BookGrid
      items={result.books.map((book) => ({
        key: book.workKey,
        title: book.title,
        authors: book.authors,
        coverId: book.coverId,
        action: <SaveButton book={book} savedId={savedIds.get(book.workKey) ?? null} compact />,
      }))}
    />
  );
}
