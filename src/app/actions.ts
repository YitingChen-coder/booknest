"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isWorkKey } from "@/lib/open-library";
import { isStatus } from "@/lib/shelf";
import { createSupabaseClient } from "@/lib/supabase";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server Actions are public HTTP endpoints, so each one checks sign-in and
// validates its input. user_id is never taken from the browser: the database
// fills it from the Clerk token, and RLS rejects rows that aren't yours.
async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  return userId;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

function cleanInt(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export type SaveBookInput = {
  workKey: string;
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;
};

export async function saveBook(input: SaveBookInput): Promise<ActionResult<{ id: string }>> {
  await requireUser();

  const title = cleanText(input?.title, 500);
  if (!isWorkKey(String(input?.workKey)) || !title) return { ok: false, error: "That book can't be saved." };
  const authors = Array.isArray(input.authors)
    ? input.authors.map((a) => cleanText(a, 200)).filter((a): a is string => a !== null).slice(0, 10)
    : [];

  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("saved_books")
    .insert({
      work_key: input.workKey,
      title,
      authors,
      cover_id: cleanInt(input.coverId, 1, 2_000_000_000),
      first_publish_year: cleanInt(input.firstPublishYear, 0, 3000),
    })
    .select("id")
    .single();

  if (error) {
    // Already on this person's shelf: return the existing row.
    if (error.code === "23505") {
      const existing = await supabase.from("saved_books").select("id").eq("work_key", input.workKey).single();
      if (existing.data) return { ok: true, data: { id: existing.data.id } };
    }
    return { ok: false, error: "Couldn't save this book. Please try again." };
  }

  revalidatePath("/shelf");
  return { ok: true, data: { id: data.id } };
}

export async function removeBook(bookId: string): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(bookId)) return { ok: false, error: "Unknown book." };

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("saved_books").delete().eq("id", bookId);
  if (error) return { ok: false, error: "Couldn't remove this book." };

  revalidatePath("/shelf");
  revalidatePath("/search");
  return { ok: true, data: undefined };
}

export async function updateBook(
  bookId: string,
  changes: { status?: string; rating?: number | null },
): Promise<ActionResult> {
  await requireUser();
  if (!UUID_RE.test(bookId)) return { ok: false, error: "Unknown book." };

  const patch: { status?: string; rating?: number | null } = {};
  if (changes.status !== undefined) {
    if (!isStatus(changes.status)) return { ok: false, error: "Unknown status." };
    patch.status = changes.status;
  }
  if (changes.rating !== undefined) {
    const rating = changes.rating === null ? null : cleanInt(changes.rating, 1, 5);
    if (changes.rating !== null && rating === null) return { ok: false, error: "Rating must be 1 to 5." };
    patch.rating = rating;
  }
  if (Object.keys(patch).length === 0) return { ok: true, data: undefined };

  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("saved_books").update(patch).eq("id", bookId);
  if (error) return { ok: false, error: "Couldn't update this book." };

  revalidatePath("/shelf");
  revalidatePath(`/shelf/${bookId}`);
  return { ok: true, data: undefined };
}

export async function addNote(bookId: string, formData: FormData): Promise<void> {
  await requireUser();
  const body = cleanText(formData.get("body"), 2000);
  if (!UUID_RE.test(bookId) || !body) return;

  const supabase = await createSupabaseClient();
  await supabase.from("book_notes").insert({ book_id: bookId, body });
  revalidatePath(`/shelf/${bookId}`);
}

export async function deleteNote(bookId: string, noteId: string): Promise<void> {
  await requireUser();
  if (!UUID_RE.test(bookId) || !UUID_RE.test(noteId)) return;

  const supabase = await createSupabaseClient();
  await supabase.from("book_notes").delete().eq("id", noteId);
  revalidatePath(`/shelf/${bookId}`);
}

export async function removeBookAndReturn(bookId: string): Promise<void> {
  const result = await removeBook(bookId);
  if (result.ok) redirect("/shelf");
}
