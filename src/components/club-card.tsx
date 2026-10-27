import { unshareBook } from "@/app/actions";
import { BookCover } from "@/components/book-cover";
import { SaveButton } from "@/components/save-button";
import type { SharedBook } from "@/lib/club";
import { formatDate } from "@/lib/format";

type Props = {
  share: SharedBook;
  /** True when the signed-in person shared this. */
  mine: boolean;
  /** The viewer's own saved copy of this book, if any. */
  savedId: string | null;
};

export function ClubCard({ share, mine, savedId }: Props) {
  return (
    <li className="flex gap-4 rounded-xl border border-border bg-surface p-4" data-testid="club-share">
      <BookCover coverId={share.cover_id} title={share.title} />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="font-serif text-lg font-semibold leading-snug" data-testid="club-share-title">
          {share.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{share.authors.slice(0, 3).join(", ") || "Unknown author"}</p>
        {share.comment && (
          <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 text-sm leading-relaxed">
            {share.comment}
          </blockquote>
        )}
        <p className="mt-2 text-xs text-muted">
          {mine ? "Shared by you" : `Shared by ${share.display_name}`} · {formatDate(share.created_at)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          {mine ? (
            <form action={unshareBook.bind(null, share.id, null)}>
              <button className="text-sm text-muted hover:text-danger">Stop sharing</button>
            </form>
          ) : (
            <SaveButton
              book={{
                workKey: share.work_key,
                title: share.title,
                authors: share.authors,
                coverId: share.cover_id,
                firstPublishYear: share.first_publish_year,
              }}
              savedId={savedId}
            />
          )}
        </div>
      </div>
    </li>
  );
}
