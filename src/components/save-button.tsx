"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveBook, type SaveBookInput } from "@/app/actions";

type Props = {
  book: SaveBookInput;
  savedId: string | null;
};

export function SaveButton({ book, savedId: initialSavedId }: Props) {
  const [savedId, setSavedId] = useState(initialSavedId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (savedId) {
    return (
      <Link
        href={`/shelf/${savedId}`}
        className="inline-flex items-center gap-1 rounded-md bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
      >
        ✓ On your shelf
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await saveBook(book);
            if (result.ok) setSavedId(result.data.id);
            else setError(result.error);
          })
        }
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save to shelf"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
