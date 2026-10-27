import "server-only";
import { createSupabaseClient } from "@/lib/supabase";

export type SharedBook = {
  id: string;
  user_id: string;
  book_id: string;
  display_name: string;
  comment: string | null;
  work_key: string;
  title: string;
  authors: string[];
  cover_id: number | null;
  first_publish_year: number | null;
  created_at: string;
};

const SHARE_COLUMNS =
  "id, user_id, book_id, display_name, comment, work_key, title, authors, cover_id, first_publish_year, created_at";

// Unlike shelves, shares are readable by every signed-in person (see the
// shared_books RLS policies). Only the owner can add or remove a share.

export async function listClub(limit = 50): Promise<SharedBook[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("shared_books")
    .select(SHARE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load the book club: ${error.message}`);
  return data as SharedBook[];
}

/** The signed-in person's share of one of their books, if any. */
export async function getShareForBook(bookId: string): Promise<SharedBook | null> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.from("shared_books").select(SHARE_COLUMNS).eq("book_id", bookId).maybeSingle();
  if (error) throw new Error(`Could not load share: ${error.message}`);
  return data as SharedBook | null;
}

/** The name this person used on their latest share, to prefill the next one. */
export async function getLastDisplayName(userId: string): Promise<string | null> {
  const supabase = await createSupabaseClient();
  const { data } = await supabase
    .from("shared_books")
    .select("display_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.display_name as string | undefined) ?? null;
}
