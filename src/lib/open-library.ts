import "server-only";

// Open Library asks apps to identify themselves with a User-Agent.
const USER_AGENT = "BookNest/0.1 (class project; https://github.com/YitingChen-coder/booknest)";
const BASE_URL = "https://openlibrary.org";
const TIMEOUT_MS = 8000;
const SEARCH_FIELDS = "key,title,author_name,cover_i,first_publish_year,edition_count";
export const PAGE_SIZE = 20;

export type BookSummary = {
  workKey: string; // e.g. "OL27482W"
  title: string;
  authors: string[];
  coverId: number | null;
  firstPublishYear: number | null;
  editionCount: number | null;
};

export type SearchResult =
  | { ok: true; total: number; books: BookSummary[] }
  | { ok: false; reason: "unavailable" };

export type WorkDetails = {
  description: string | null;
  subjects: string[];
};

type SearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  edition_count?: number;
};

const WORK_KEY_RE = /^OL\d+W$/;

export function isWorkKey(value: string): boolean {
  return WORK_KEY_RE.test(value);
}

export function coverUrl(coverId: number | null, size: "S" | "M" | "L" = "M"): string | null {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;
}

async function getJson(path: string): Promise<{ status: number; body: unknown } | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Cache identical requests on our server for an hour to stay well under rate limits.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { status: res.status, body: null };
    return { status: res.status, body: await res.json() };
  } catch {
    // Network error, timeout, or invalid JSON.
    return null;
  }
}

/** Subjects offered for browsing. Keys are Open Library subject names. */
export const SUBJECTS = {
  fantasy: "Fantasy",
  science_fiction: "Science fiction",
  mystery: "Mystery",
  romance: "Romance",
  historical_fiction: "Historical fiction",
  biography: "Biography",
  poetry: "Poetry",
  philosophy: "Philosophy",
} as const;
export type Subject = keyof typeof SUBJECTS;

export function isSubject(value: unknown): value is Subject {
  return typeof value === "string" && Object.hasOwn(SUBJECTS, value);
}

/** Search by free text, or browse a subject (most highly rated first). */
export async function searchBooks(
  search: { q: string } | { subject: Subject },
  page = 1,
): Promise<SearchResult> {
  const params = new URLSearchParams({ fields: SEARCH_FIELDS, limit: String(PAGE_SIZE), page: String(page) });
  if ("q" in search) params.set("q", search.q);
  else {
    params.set("subject", search.subject);
    params.set("sort", "rating");
  }
  const res = await getJson(`/search.json?${params}`);
  if (!res || res.status !== 200 || !res.body) return { ok: false, reason: "unavailable" };

  const body = res.body as { numFound?: number; docs?: SearchDoc[] };
  const books = (body.docs ?? [])
    .map((doc): BookSummary | null => {
      const workKey = doc.key?.replace("/works/", "") ?? "";
      if (!isWorkKey(workKey) || !doc.title) return null;
      return {
        workKey,
        title: doc.title,
        authors: doc.author_name ?? [],
        coverId: doc.cover_i ?? null,
        firstPublishYear: doc.first_publish_year ?? null,
        editionCount: doc.edition_count ?? null,
      };
    })
    .filter((b): b is BookSummary => b !== null);

  return { ok: true, total: body.numFound ?? books.length, books };
}

/** Extra details for one work. Returns null if Open Library is down or the work is unknown. */
export async function getWorkDetails(workKey: string): Promise<WorkDetails | null> {
  if (!isWorkKey(workKey)) return null;
  const res = await getJson(`/works/${workKey}.json`);
  if (!res || !res.body) return null;

  const body = res.body as { description?: string | { value?: string }; subjects?: string[] };
  const raw = typeof body.description === "string" ? body.description : body.description?.value ?? null;
  // Descriptions are user-edited Markdown-ish text; drop bold/italic markers and link syntax.
  const description = raw
    ? raw
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
        .replace(/-{3,}[\s\S]*$/, "") // trailing "----------" source/footnote blocks
        .trim() || null
    : null;
  return { description, subjects: (body.subjects ?? []).slice(0, 8) };
}
