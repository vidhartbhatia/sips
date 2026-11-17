-- 005_items_photos_follow_review_status.sql
-- Items and photos are only publicly readable when their parent review is published
-- and that review's cafe is published.
--
-- 001 gave `items` and `photos` a `using (true)` select policy, so anyone with the
-- public anon key could read the drink notes, ratings, captions and photo URLs of
-- draft reviews (createReview saves items and photos for drafts too).
--
-- Fail-closed: a row with no parent review (review_id is null, which only happens
-- when a review is deleted, since the FK is `on delete set null`) is not public.
--
-- Admins are unaffected. The "Admins can manage items/photos" policies from 001 are
-- `for all`, so they already cover select, and permissive policies are OR'd. The
-- admin UI reads through the service-role client, which bypasses RLS anyway.
--
-- The status checks are written out explicitly instead of relying on the RLS of
-- `reviews` and `cafes` applying inside the subquery.
--
-- Safe to re-run.

begin;

drop policy if exists "Public can view items" on public.items;
drop policy if exists "Public can view published items" on public.items;

create policy "Public can view published items"
  on public.items for select
  using (
    exists (
      select 1
      from public.reviews r
      join public.cafes c on c.id = r.cafe_id
      where r.id = items.review_id
        and r.cafe_id = items.cafe_id
        and r.status = 'published'
        and c.status = 'published'
    )
  );

drop policy if exists "Public can view photos" on public.photos;
drop policy if exists "Public can view published photos" on public.photos;

create policy "Public can view published photos"
  on public.photos for select
  using (
    exists (
      select 1
      from public.reviews r
      join public.cafes c on c.id = r.cafe_id
      where r.id = photos.review_id
        and r.cafe_id = photos.cafe_id
        and r.status = 'published'
        and c.status = 'published'
    )
  );

-- The new policy looks photos up by review_id; items already has this index.
create index if not exists idx_photos_review_id on public.photos (review_id);

commit;
