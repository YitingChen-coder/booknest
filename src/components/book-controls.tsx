"use client";

import { useState, useTransition } from "react";
import { updateBook } from "@/app/actions";

const STATUS_OPTIONS = [
  { value: "want", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
] as const;

type Props = {
  bookId: string;
  status: string;
  rating: number | null;
  showRating?: boolean;
};

export function BookControls({ bookId, status: initialStatus, rating: initialRating, showRating = true }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [rating, setRating] = useState(initialRating);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(changes: { status?: string; rating?: number | null }, undo: () => void) {
    startTransition(async () => {
      setError(null);
      const result = await updateBook(bookId, changes);
      if (!result.ok) {
        undo();
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">Reading status</span>
        <select
          value={status}
          disabled={pending}
          onChange={(e) => {
            const previous = status;
            setStatus(e.target.value);
            save({ status: e.target.value }, () => setStatus(previous));
          }}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {showRating && (
        <div className="flex items-center gap-0.5" role="group" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={pending}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onClick={() => {
                const previous = rating;
                const next = rating === n ? null : n; // click the same star again to clear
                setRating(next);
                save({ rating: next }, () => setRating(previous));
              }}
              className={`text-xl leading-none ${rating && n <= rating ? "text-accent" : "text-border"} hover:text-accent`}
            >
              ★
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
