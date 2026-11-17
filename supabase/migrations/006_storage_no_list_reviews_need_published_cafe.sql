-- 006_storage_no_list_reviews_need_published_cafe.sql
-- Two read-access tightenings. Safe to re-run.
--
-- 1. Storage: stop anonymous listing of the `photos` bucket.
--    001 added a SELECT policy on storage.objects for bucket 'photos' with no role
--    limit. A public bucket doesn't need it for downloads (public object URLs are
--    served without RLS), but it does allow listing every object path through the
--    Storage API. Nothing in the app lists the bucket; uploads and deletes use the
--    service-role client, which bypasses RLS. The bucket stays public, so existing
--    image URLs keep working.
--
-- 2. Reviews: public can read a published review only if its cafe is published too,
--    matching the items/photos policies from 005. Admins keep full access through
--    001's "Admins can manage reviews" (FOR ALL) policy and the service-role client.

begin;

drop policy if exists "Public can view photos" on storage.objects;

drop policy if exists "Public can view published reviews" on public.reviews;

create policy "Public can view published reviews"
  on public.reviews for select
  using (
    status = 'published'
    and exists (
      select 1 from public.cafes c
      where c.id = reviews.cafe_id
        and c.status = 'published'
    )
  );

commit;
