-- 003_rename_photo_url.sql
-- Rename photos.url to photos.photo_url to match application code.
ALTER TABLE public.photos RENAME COLUMN url TO photo_url;
