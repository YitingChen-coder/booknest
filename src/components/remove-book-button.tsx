"use client";

import { useState, useTransition } from "react";
import { removeBookAndReturn } from "@/app/actions";

export function RemoveBookButton({ bookId, title }: { bookId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm text-danger hover:underline">
        Remove from my shelf
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm" role="alertdialog" aria-label="Confirm removal">
      <span>Remove “{title}” and its notes?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removeBookAndReturn(bookId))}
        className="rounded-md bg-danger px-3 py-1.5 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Removing…" : "Yes, remove"}
      </button>
      <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="text-muted hover:text-foreground">
        Cancel
      </button>
    </div>
  );
}
