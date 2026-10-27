import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ClubCard } from "@/components/club-card";
import { listClub } from "@/lib/club";
import { getSavedIds } from "@/lib/shelf";

export default async function ClubPage() {
  const { userId } = await auth.protect();
  const shares = await listClub();

  let savedIds = new Map<string, string>();
  try {
    savedIds = await getSavedIds([...new Set(shares.map((s) => s.work_key))]);
  } catch {
    // Still show the club; Save reports its own error.
  }
  const readers = new Set(shares.map((s) => s.user_id)).size;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Book club</h1>
          <p className="mt-1 text-sm text-muted">
            {shares.length === 0
              ? "Books BookNest readers recommend to each other."
              : `${shares.length} book${shares.length === 1 ? "" : "s"} shared by ${readers} reader${readers === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/shelf" className="text-sm font-medium text-accent">
          Share one from my shelf
        </Link>
      </div>

      {shares.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted">
          <p className="font-serif text-lg text-foreground">No one has shared a book yet.</p>
          <p className="mt-1">
            Open a book on{" "}
            <Link href="/shelf" className="font-medium text-accent underline">
              your shelf
            </Link>{" "}
            and press “Share to book club” to be the first.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {shares.map((share) => (
            <ClubCard
              key={share.id}
              share={share}
              mine={share.user_id === userId}
              savedId={savedIds.get(share.work_key) ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
