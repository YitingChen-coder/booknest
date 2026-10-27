-- BookNest: saved_books and book_notes, each row owned by one Clerk user.
-- The Clerk user id comes from the verified session token: auth.jwt() ->> 'sub'.

create table public.saved_books (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  work_key text not null check (work_key ~ '^OL[0-9]+W$'),
  title text not null check (char_length(title) between 1 and 500),
  authors text[] not null default '{}',
  cover_id integer,
  first_publish_year integer,
  status text not null default 'want' check (status in ('want', 'reading', 'read')),
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_key)
);

create index saved_books_user_id_idx on public.saved_books (user_id);

create table public.book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  book_id uuid not null references public.saved_books (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index book_notes_user_id_idx on public.book_notes (user_id);
create index book_notes_book_id_idx on public.book_notes (book_id);

-- Keep updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger saved_books_set_updated_at
before update on public.saved_books
for each row execute function public.set_updated_at();

-- Row-level security: each person can only see and change their own rows.
alter table public.saved_books enable row level security;
alter table public.book_notes enable row level security;

create policy "Users can view their own saved books"
on public.saved_books for select to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can save books to their own shelf"
on public.saved_books for insert to authenticated
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can update their own saved books"
on public.saved_books for update to authenticated
using ((select auth.jwt() ->> 'sub') = user_id)
with check ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can remove their own saved books"
on public.saved_books for delete to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can view their own notes"
on public.book_notes for select to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);

create policy "Users can add notes to their own books"
on public.book_notes for insert to authenticated
with check (
  (select auth.jwt() ->> 'sub') = user_id
  and exists (
    select 1 from public.saved_books b
    where b.id = book_id and b.user_id = (select auth.jwt() ->> 'sub')
  )
);

create policy "Users can delete their own notes"
on public.book_notes for delete to authenticated
using ((select auth.jwt() ->> 'sub') = user_id);
