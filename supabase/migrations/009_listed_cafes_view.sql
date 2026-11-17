-- 009_listed_cafes_view.sql
-- The public cafe list: published cafes with at least one published review
-- (docs/superpowers/specs/2026-11-17-launch-design.md). Safe to re-run. Rewrites no data.
--
-- lib/supabase/queries.ts reads every public cafe list and the cafe page from this view,
-- so a cafe with only drafts (or no reviews) is never listed and its page 404s.
--
-- security_invoker: the view runs with the caller's privileges, so the RLS on cafes and
-- reviews still applies (Postgres 15+). The status filters are explicit as well, because
-- an admin's session can read drafts through RLS and must still get the public list.

begin;

create or replace view public.listed_cafes
with (security_invoker = true)
as
select c.*
from public.cafes c
where c.status = 'published'
  and exists (
    select 1
    from public.reviews r
    where r.cafe_id = c.id
      and r.status = 'published'
  );

grant select on public.listed_cafes to anon, authenticated;

commit;
