-- 008_launch_authoring.sql
-- Draft-first authoring for launch (docs/superpowers/specs/2026-11-17-launch-design.md).
-- Safe to re-run. One transaction. Adds columns and loosens NOT NULLs; rewrites no data.
--
-- 1. reviews.verdict: a one-line verdict per visit (nullable).
-- 2. reviews.cover_photo_id: the hero photo of this visit. The cafe's public cover is the
--    latest published visit's cover (lib/cover-photo.ts). Deleting the photo clears it.
-- 3. photos.item_id: a drink photo is an ordinary photos row linked to its item, so it is
--    signed, gated (005) and cleaned up like every other review photo. items.photo_url
--    stays unused.
-- 4. Scores and notes are optional while drafting: reviews.overall_rating, reviews.note,
--    items.rating and items.type become nullable. The existing 1-5 range checks still
--    apply to non-null values. A published review must have an overall score
--    (reviews_published_needs_rating); a score on every drink is checked when publishing
--    (lib/review-rules.ts), since a CHECK can't look at other rows.
-- 5. want_to_go is private: drop 001's public select policy. Admins keep access through
--    001's "Admins can manage want_to_go" (FOR ALL) policy.

begin;

alter table public.reviews add column if not exists verdict text;

alter table public.reviews
  add column if not exists cover_photo_id uuid references public.photos (id) on delete set null;

alter table public.photos
  add column if not exists item_id uuid references public.items (id) on delete set null;

create index if not exists idx_photos_item_id on public.photos (item_id);

alter table public.reviews alter column overall_rating drop not null;
alter table public.reviews alter column note drop not null;
alter table public.items alter column rating drop not null;
alter table public.items alter column type drop not null;

alter table public.reviews drop constraint if exists reviews_published_needs_rating;
alter table public.reviews
  add constraint reviews_published_needs_rating
  check (status <> 'published' or overall_rating is not null);

drop policy if exists "Public can view want_to_go" on public.want_to_go;

commit;
