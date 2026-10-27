"use client";

import { useActionState } from "react";
import { shareBook, type ShareState } from "@/app/actions";

export function ShareBookForm({ bookId, defaultName }: { bookId: string; defaultName: string }) {
  const [state, formAction, pending] = useActionState<ShareState, FormData>(shareBook.bind(null, bookId), {
    error: null,
  });

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="display_name" className="text-sm font-medium">
          Show my name as
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          maxLength={40}
          defaultValue={defaultName}
          placeholder="e.g. Yiting"
          className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="comment" className="text-sm font-medium">
          Why you recommend it <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          maxLength={280}
          rows={2}
          placeholder="One or two sentences for the club"
          className="rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <p className="text-xs text-muted">
        Everyone signed in to BookNest will see this book, your name and your note. Your shelf, status, rating and
        notes stay private.
      </p>
      <button
        disabled={pending}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sharing…" : "Share to book club"}
      </button>
    </form>
  );
}
