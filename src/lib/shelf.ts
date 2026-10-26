import "server-only";
import { createSupabaseClient } from "@/lib/supabase";

export const STATUSES = ["want", "reading", "read"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  want: "Want to read",
  reading: "Reading",
  read: "Read",
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export type SavedBook = {
  id: string;
  work_key: string;
  title: string;
  authors: string[];
  cover_id: number | null;
  first_publish_year: number | null;
  status: Status;
  rating: number | null;
  created_at: string;
};

export type BookNote = {
  id: string;
  body: string;
  created_at: string;
};

const BOOK_COLUMNS = "id, work_key, title, authors, cover_id, first_publish_year, status, rating, created_at";

// No user_id filters below: row-level security in Supabase only returns the
// signed-in person's rows.

export async function listShelf(status?: Status): Promise<SavedBook[]> {
  const supabase = await createSupabaseClient();
  let query = supabase.from("saved_books").select(BOOK_COLUMNS).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load shelf: ${error.message}`);
  return data as SavedBook[];
}

/** Map of work_key -> saved book id, for the given Open Library works. */
export async function getSavedIds(workKeys: string[]): Promise<Map<string, string>> {
  if (workKeys.length === 0) return new Map();
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("saved_books").select("id, work_key").in("work_key", workKeys);
  if (error) throw new Error(`Could not load saved books: ${error.message}`);
  return new Map(data.map((row) => [row.work_key as string, row.id as string]));
}

export async function getSavedBook(id: string): Promise<SavedBook | null> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("saved_books").select(BOOK_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load book: ${error.message}`);
  return data as SavedBook | null;
}

export async function listNotes(bookId: string): Promise<BookNote[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("book_notes")
    .select("id, body, created_at")
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load notes: ${error.message}`);
  return data as BookNote[];
}
