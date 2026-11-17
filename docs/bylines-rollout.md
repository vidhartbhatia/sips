# Author bylines: rollout (ship-plan R7)

Reviews show a "— V." / "— L." signature on cafe pages, from `reviews.author_id` →
`profiles.display_name`. Before this change `profiles` was empty and every review saved with
`author_id = null`.

## Order (don't skip ahead)

1. **Apply migration `supabase/migrations/004_profiles_for_bylines.sql`** to production.
   It:
   - makes `profiles.display_name` nullable;
   - drops 001's `"Users can update own profile"` policy, which let any signed-in user set
     their own `role` to `admin` (anyone can get an `auth.users` row by asking for a magic link);
   - adds the `on_auth_user_created` trigger, which gives every new auth user a `reader` profile;
   - backfills a `reader` profile for every existing auth user.

   It's idempotent and holds no emails or names.
2. **Run the one-off SQL below** in the Supabase SQL editor. It gives both authors `admin` and
   their display names.
3. **Merge the code PR.** From then on, `createReview` stamps `author_id = user.id`.

Why this order: `reviews.author_id` is a foreign key to `profiles.id`. If the code ships before
step 1, every new review fails to save, because the author has no profile row.

## One-off SQL (step 2)

Replace the two `:v_email` / `:l_email` placeholders **by hand** with the real login emails
before running. The SQL editor does not bind `:name` parameters. Don't commit the filled-in
version.

```sql
-- Bylines: make both authors admins with their display names.
-- Each author must have logged in at least once, so their auth.users row exists.
insert into public.profiles (id, role, display_name)
values
  ((select id from auth.users where email = :v_email), 'admin', 'V.'),
  ((select id from auth.users where email = :l_email), 'admin', 'L.')
on conflict (id) do update
  set role = excluded.role,
      display_name = excluded.display_name;
```

A wrong or not-yet-signed-up email fails the whole statement loudly
(`null value in column "id"`), so nothing is half-applied. If L. hasn't logged in yet, have her
request a magic link once, then run it.

## Check it

```sql
select p.display_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, p.display_name;
```

You should see exactly two `admin` rows (`V.`, `L.`). Everyone else is `reader` with a null
`display_name`.

## Notes

- Existing reviews stay unattributed (`author_id` null), and their byline renders nothing. To
  credit an old review, set its `author_id` by hand. Editing a review in `/admin` never changes
  or claims its author.
- Google Takeout imports (`/admin/import`) still save with `author_id = null` on purpose.
- Display names are public. `profiles` has a public `select` policy, and the cafe page reads
  `display_name` through the anon client.
