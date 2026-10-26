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
  finished_at: string | null;
};

export type BookNote = {
  id: string;
  body: string;
  created_at: string;
};

export const SORTS = {
  recent: "Recently added",
  title: "Title",
  rating: "My rating",
} as const;
export type Sort = keyof typeof SORTS;

export function isSort(value: unknown): value is Sort {
  return typeof value === "string" && Object.hasOwn(SORTS, value);
}

export type ShelfStats = {
  total: number;
  byStatus: Record<Status, number>;
  finishedThisYear: number;
};

const BOOK_COLUMNS =
  "id, work_key, title, authors, cover_id, first_publish_year, status, rating, created_at, finished_at";

// No user_id filters below: row-level security in Supabase only returns the
// signed-in person's rows.

export async function listShelf(
  options: { status?: Status; sort?: Sort; limit?: number } = {},
): Promise<SavedBook[]> {
  const { status, sort = "recent", limit } = options;
  const supabase = await createSupabaseClient();
  let query = supabase.from("saved_books").select(BOOK_COLUMNS);
  if (status) query = query.eq("status", status);
  if (sort === "title") query = query.order("title", { ascending: true });
  else if (sort === "rating") query = query.order("rating", { ascending: false, nullsFirst: false });
  query = query.order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load shelf: ${error.message}`);
  return data as SavedBook[];
}

export async function getShelfStats(): Promise<ShelfStats> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("saved_books").select("status, finished_at");
  if (error) throw new Error(`Could not load shelf: ${error.message}`);

  const year = new Date().getFullYear();
  const stats: ShelfStats = { total: data.length, byStatus: { want: 0, reading: 0, read: 0 }, finishedThisYear: 0 };
  for (const row of data) {
    if (isStatus(row.status)) stats.byStatus[row.status] += 1;
    if (row.finished_at && new Date(row.finished_at).getFullYear() === year) stats.finishedThisYear += 1;
  }
  return stats;
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
