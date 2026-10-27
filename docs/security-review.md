# Security review

Run with `/security-review` on the `dev` branch against `main`, before merging. Scope: every change on `dev` (Server Actions, Supabase client, RLS migrations, pages, proxy, config).

## Result

No high- or medium-confidence vulnerabilities.

What was checked:

- **RLS, final state:** every policy is `to authenticated` and requires `auth.jwt() ->> 'sub' = user_id`; `anon` has no policies. Update can't change `user_id` (USING + WITH CHECK). Notes have no update policy, and inserting a note checks the book belongs to the caller. The on-purpose `using (true)` policy is replaced by the restore migration.
- **Server Actions:** each checks sign-in and validates input (UUID, work key, status allow-list, rating 1–5, text length). `user_id` is never taken from the browser. Inserts list their columns explicitly.
- **Supabase client:** publishable key + Clerk session token only, no service-role key, so RLS always applies. Server-only.
- **Query building:** filter values are validated or allow-listed; sort columns are fixed; no raw filter strings from user input.
- **Open Library:** fixed base URL, query encoded with `URLSearchParams`, work keys regex-checked.
- **Rendering:** no `dangerouslySetInnerHTML`; error pages don't show error messages; external links use `rel="noopener noreferrer"`.
- **Secrets:** `.env*` ignored by git (except `.env.example`, which has names only); agent deny rule blocks reading `.env` files.
- **Database functions:** trigger functions use `search_path = ''` with EXECUTE revoked; the built-in `rls_auto_enable()` SECURITY DEFINER function had EXECUTE revoked (flagged earlier by the Supabase security advisor, which now reports no findings).

## Findings handled

| Finding | Impact | Action |
|---|---|---|
| `isSubject` / `isSort` used `value in OBJ`, so inherited keys like `constructor` passed the check | Odd page heading, harmless value sent to Open Library; no security impact | Changed to `Object.hasOwn(OBJ, value)` |
| A client calling PostgREST directly could choose the `id` on insert | Only reveals whether a random UUID exists | Accepted; UUIDs are not guessable |

## Book club follow-up

The book club adds the first table other people can read, so it was checked separately:

- `shared_books` select is `using (true)` for `authenticated` only; signed-out visitors read nothing. Shelves and notes keep their owner-only policies.
- Insert checks `user_id` is yours and `book_id` is on your shelf. A trigger copies the title, authors and cover from your saved book, so a share can't claim a book you don't have or show a made-up title.
- No update policy; delete only your own.

| Finding | Impact | Action |
|---|---|---|
| A direct API call could set `created_at` and pin a share to the top of the feed | Feed ordering only | Trigger now sets `created_at = now()` (migration `20261026203000`) |
| `display_name` is whatever the sharer types | A person could pick a misleading name; it can't act as anyone else | Accepted; shown as a nickname |
| Every signed-in user can read sharers' Clerk user ids | Ids are not secret and grant nothing | Accepted; needed to show "Shared by you" |
