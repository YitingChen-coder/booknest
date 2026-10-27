-- Remember when a book was marked "read", so the shelf can show finish dates
-- and how many books were finished this year. The database sets it, not the app.
alter table public.saved_books add column finished_at timestamptz;

create function public.set_finished_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'read' then
    if tg_op = 'INSERT' or old.status is distinct from 'read' then
      new.finished_at = now();
    else
      new.finished_at = old.finished_at;
    end if;
  else
    new.finished_at = null;
  end if;
  return new;
end;
$$;

create trigger saved_books_set_finished_at
before insert or update on public.saved_books
for each row execute function public.set_finished_at();

-- Trigger functions are never called over the API.
revoke execute on function public.set_finished_at() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
