-- 004_profiles_for_bylines.sql
-- Author bylines (ship-plan R7): every auth user gets a public.profiles row, so
-- reviews.author_id (FK -> profiles.id) can be set to the signed-in user's id.
--
-- Safe to re-run. Contains no emails or names. Admin roles and display names for
-- the two authors are set by hand afterwards; see docs/bylines-rollout.md.

-- 1. display_name is optional. The trigger below doesn't know a name, and the byline
--    renders nothing when it's null.
alter table public.profiles alter column display_name drop not null;

-- 2. Close the self-promotion hole before profile rows start existing.
--    001's "Users can update own profile" policy had no column limit and no WITH CHECK,
--    so any signed-in user could set their own role to 'admin' and unlock the admin
--    write policies. Anyone can become a signed-in user by requesting a magic link
--    (the allowlist is enforced in the app, not in Postgres). Nothing in the app uses
--    this policy (profile writes are done by hand or via the service role), so drop it.
drop policy if exists "Users can update own profile" on public.profiles;

-- 3. Create a profile for each new auth user. Always the non-admin 'reader' role:
--    never grant admin automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'reader')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Only the trigger should call this.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Backfill existing auth users (also as 'reader'), so the FK holds for anyone
--    who signed up before this trigger existed.
insert into public.profiles (id, role)
select u.id, 'reader'
from auth.users u
on conflict (id) do nothing;
