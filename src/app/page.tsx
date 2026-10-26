import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Your reading shelf</p>
      <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
        Find your next book. Keep track of every one you love.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Search millions of titles from Open Library, save them to your shelf, mark what you want to
        read, are reading, and have finished, and jot down notes as you go.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {userId ? (
          <>
            <Link href="/search" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90">
              Search books
            </Link>
            <Link href="/shelf" className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-accent-soft">
              Open my shelf
            </Link>
          </>
        ) : (
          <>
            <Link href="/sign-up" className="rounded-lg bg-accent px-5 py-2.5 font-medium text-background hover:opacity-90">
              Create a free account
            </Link>
            <Link href="/sign-in" className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-accent-soft">
              I already have one
            </Link>
          </>
        )}
      </div>

      <ul className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          ["Search", "Look up any title or author on Open Library."],
          ["Save", "Put books on your shelf: want to read, reading, or read."],
          ["Remember", "Add notes and ratings. They're there on any device you sign in from."],
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
