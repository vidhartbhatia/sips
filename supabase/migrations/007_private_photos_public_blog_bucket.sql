-- 007_private_photos_public_blog_bucket.sql
-- Review photos become private; blog images get their own public bucket. Safe to re-run.
--
-- 1. `photos` bucket: public = false. A public bucket serves any object to anyone who has
--    its URL, with no RLS, so a photo of a draft review was downloadable by URL.
--    After this, objects are served only through signed URLs. The app signs them
--    server-side, and only for photos whose review and cafe are published (lib/storage.ts,
--    lib/supabase/queries.ts). No storage.objects SELECT policy is added: anon and
--    readers still can't list or read the bucket (006). Uploads, deletes and signing use
--    the service-role client, which bypasses RLS. 001's admin insert/delete policies stay.
--
-- 2. `blog` bucket: public, for blog post images, which are published content
--    (scripts/upload-blog-images.mjs). Public object URLs need no SELECT policy, so none
--    is added and the bucket can't be listed.
--
-- Stored values are not rewritten. The app now stores bare object paths in
-- photos.photo_url and cafes.cover_photo_url, and still reads pre-007 full public URLs
-- (lib/storage.ts toStoragePath), so this migration and the code can ship in either order.

begin;

update storage.buckets set public = false where id = 'photos';

insert into storage.buckets (id, name, public)
values ('blog', 'blog', true)
on conflict (id) do update set public = true;

commit;
