-- 010_listed_cafes_read_only.sql
-- public.listed_cafes (009) is a read-only list for the API roles. Safe to re-run.
--
-- Supabase's default privileges gave anon and authenticated every privilege on the new
-- view, and a simple view is auto-updatable. With security_invoker, writes through it
-- already hit the RLS on cafes (admins only), so this is defence in depth: the API roles
-- keep SELECT and lose everything else.

begin;

revoke insert, update, delete, truncate, references, trigger
  on public.listed_cafes from anon, authenticated;

grant select on public.listed_cafes to anon, authenticated;

commit;
