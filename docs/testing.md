# Testing: shelf isolation

Test: [`e2e/shelf-isolation.spec.ts`](../e2e/shelf-isolation.spec.ts). Run with `npm run test:e2e` (starts `next dev` if it isn't running; needs `.env.local`).

Two Clerk test users (`+clerk_test` emails, created by `e2e/global.setup.ts`) sign in from separate browser contexts. A saves one book, B saves another. The test checks:

1. B's shelf does not show A's book, and A's shelf does not show B's.
2. Each shelf holds exactly its owner's one book.
3. A gets a 404 when opening B's book by its exact `/shelf/<id>` URL.
4. A signed-out visitor is sent to `/sign-in` and sees no books.

## Watching it fail: RLS broken on purpose

Migration `20261025160000_break_saved_books_select_policy.sql` replaced the `saved_books` select policy with `using (true)`, so any signed-in user could read every row.

```
✘  [chromium] › e2e/shelf-isolation.spec.ts › two readers cannot see each other's shelves
   Error: B can see A's book on B's shelf
   expect(received).not.toContain(expected)
   Expected value: not "The Left Hand of Darkness"
   Received array:     ["The Left Hand of Darkness"]
     > 59 |   expect(await shelfTitles(pageB), "B can see A's book on B's shelf").not.toContain(bookA.title);
1 failed, 3 passed
```

The app code didn't change. It never filters by `user_id` itself; it relies on RLS. With the policy gone, Supabase returned A's row to B.

The first broken run failed only by timing out: the test's clean-up step saw other people's books that it couldn't delete (the delete policy was still correct). The test was rewritten to check the other shelf right after each save, with a message that names the leak.
