import Link from "next/link";
import { BookCover } from "@/components/book-cover";

export type GridItem = {
  key: string;
  title: string;
  authors: string[];
  coverId: number | null;
  /** Makes the cover and title a link. */
  href?: string;
  /** A button under the card, e.g. Save. */
  action?: React.ReactNode;
};

/** A compact grid of covers with title and author. */
export function BookGrid({ items }: { items: GridItem[] }) {
  return (
    <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-4 gap-y-6">
      {items.map((item) => {
        const body = (
          <>
            <BookCover coverId={item.coverId} title={item.title} />
            <p className="mt-2 line-clamp-2 min-h-[2.75em] font-serif text-sm font-semibold leading-snug">{item.title}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{item.authors[0] ?? "Unknown author"}</p>
          </>
        );
        return (
          <li key={item.key} className="flex w-[112px] flex-col">
            {item.href ? (
              <Link href={item.href} className="hover:opacity-80">
                {body}
              </Link>
            ) : (
              body
            )}
            {item.action && <div className="mt-2">{item.action}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export function BookGridSkeleton({ count = 6, label }: { count?: number; label: string }) {
  return (
    <ul
      className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-4 gap-y-6"
      role="status"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="w-[112px] animate-pulse">
          <div className="h-[168px] w-[112px] rounded-md bg-accent-soft" />
          <div className="mt-2 h-3 w-4/5 rounded bg-accent-soft" />
          <div className="mt-1.5 h-2.5 w-1/2 rounded bg-accent-soft" />
        </li>
      ))}
    </ul>
  );
}
