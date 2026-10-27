-- created_at orders the book club feed, so the database sets it, not the
-- request. Otherwise a direct API call could pin a share to the top by
-- sending a future date.
create or replace function public.copy_shared_book_details()
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
  new.created_at := now();
  return new;
end;
$$;

revoke execute on function public.copy_shared_book_details() from public, anon, authenticated;
