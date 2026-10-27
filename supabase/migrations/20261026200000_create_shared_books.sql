-- Book club: a person can share a book from their own shelf with a short
-- recommendation. Every signed-in person can read shares; only the owner can
-- add or remove theirs. Shelves and notes stay private.

create table public.shared_books (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  -- Removing the book from your shelf also removes the share.
  book_id uuid not null unique references public.saved_books (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  comment text check (char_length(comment) between 1 and 280),
  -- Copied from saved_books by the trigger below, never from the request.
  work_key text not null,
  title text not null,
  authors text[] not null default '{}',
  cover_id integer,
  first_publish_year integer,
  created_at timestamptz not null default now()
);

create index shared_books_created_at_idx on public.shared_books (created_at desc);
create index shared_books_user_id_idx on public.shared_books (user_id);

-- Fill book details from the sharer's own saved book, so a share always
-- matches a real book on their shelf.
create function public.copy_shared_book_details()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  b public.saved_books%rowtype;
begin
  select * into b from public.saved_books where id = new.book_id and user_id = new.user_id;
  if not found then
    raise exception 'book is not on your shelf' using errcode = '42501';
  end if;
  new.work_key := b.work_key;
  new.title := b.title;
  new.authors := b.authors;
  new.cover_id := b.cover_id;
  new.first_publish_year := b.first_publish_year;
  return new;
end;
$$;

revoke execute on function public.copy_shared_book_details() from public, anon, authenticated;

create trigger shared_books_copy_details
before insert on public.shared_books
for each row execute function public.copy_shared_book_details();

alter table public.shared_books enable row level security;

-- Shares are meant to be seen: any signed-in person can read them.
-- Signed-out visitors (anon) have no policy and read nothing.
create policy "Signed-in users can view the book club"
on public.shared_books for select to authenticated
using (true);

create policy "Users can share books from their own shelf"
on public.shared_books for insert to authenticated
with check (
  (select auth.jwt() ->> 'sub') = user_id
  and exists (
    select 1 from public.saved_books b
    where b.id = book_id and b.user_id = (select auth.jwt() ->> 'sub')
  )
);

create policy "Users can stop sharing their own books"
on public.shared_books for delete to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);
