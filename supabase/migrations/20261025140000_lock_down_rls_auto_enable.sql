-- Supabase's security advisor flagged public.rls_auto_enable(), a SECURITY DEFINER
-- helper that ships with new projects, as callable by anon and authenticated
-- users through /rest/v1/rpc. Nothing in BookNest calls it over the API, so only
-- the database owner keeps EXECUTE.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
