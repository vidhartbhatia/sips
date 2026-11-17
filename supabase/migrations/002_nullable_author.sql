-- Allow reviews without an author (for imports from Google Takeout)
alter table public.reviews alter column author_id drop not null;
