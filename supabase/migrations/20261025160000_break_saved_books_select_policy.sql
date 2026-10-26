-- ON PURPOSE, to watch the isolation test fail: let any signed-in user read
-- every row in saved_books, not just their own. Reverted by the next migration.
drop policy "Users can view their own saved books" on public.saved_books;

create policy "Users can view their own saved books"
on public.saved_books for select to authenticated
using (true);
