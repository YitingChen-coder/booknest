"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-xl border border-border bg-surface p-6" role="alert">
        <h1 className="font-serif text-xl font-semibold">Something went wrong loading this page</h1>
        <p className="mt-2 text-muted">Your books are safe. This is usually a brief connection problem.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-accent px-4 py-2 font-medium text-background hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
