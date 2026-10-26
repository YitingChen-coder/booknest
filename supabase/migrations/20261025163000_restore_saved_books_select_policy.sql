-- Restore the owner-only select policy on saved_books after the deliberate break.
drop policy "Users can view their own saved books" on public.saved_books;

create policy "Users can view their own saved books"
on public.saved_books for select to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);
