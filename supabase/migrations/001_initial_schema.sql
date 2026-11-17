-- Sips: Initial database schema
-- Run this in Supabase SQL Editor or via CLI migrations

-- ============================================
-- TABLES
-- ============================================

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  role text not null default 'reader' check (role in ('admin', 'reader')),
  created_at timestamptz not null default now()
);

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text not null,
  lat float not null,
  lng float not null,
  neighborhood text not null,
  vibe_tags text[] default '{}',
  overall_rating float,
  cover_photo_url text,
  google_place_id text,
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  date_visited date not null,
  note text not null,
  overall_rating int not null check (overall_rating between 1 and 5),
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes on delete cascade,
  review_id uuid references public.reviews on delete set null,
  name text not null,
  category text not null check (category in ('drink', 'food')),
  type text not null,
  rating int not null check (rating between 1 and 5),
  photo_url text,
  notes text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes on delete cascade,
  review_id uuid references public.reviews on delete set null,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table public.want_to_go (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat float,
  lng float,
  source text not null default 'manual' check (source in ('google_maps', 'manual')),
  notes text,
  cafe_id uuid references public.cafes on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_cafes_slug on public.cafes (slug);
create index idx_cafes_neighborhood on public.cafes (neighborhood);
create index idx_cafes_status on public.cafes (status);
create index idx_reviews_cafe_id on public.reviews (cafe_id);
create index idx_reviews_author_id on public.reviews (author_id);
create index idx_items_cafe_id on public.items (cafe_id);
create index idx_items_review_id on public.items (review_id);
create index idx_photos_cafe_id on public.photos (cafe_id);

-- ============================================
-- TRIGGER: Update cafe overall_rating on review changes
-- ============================================

create or replace function public.update_cafe_rating()
returns trigger as $$
begin
  update public.cafes
  set overall_rating = (
    select avg(overall_rating)::float
    from public.reviews
    where cafe_id = coalesce(new.cafe_id, old.cafe_id)
      and status = 'published'
  ),
  updated_at = now()
  where id = coalesce(new.cafe_id, old.cafe_id);
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_cafe_rating();

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.cafes
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.reviews
  for each row execute function public.handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.cafes enable row level security;
alter table public.reviews enable row level security;
alter table public.items enable row level security;
alter table public.photos enable row level security;
alter table public.want_to_go enable row level security;

-- Public read access for published content
create policy "Public can view profiles"
  on public.profiles for select using (true);

create policy "Public can view published cafes"
  on public.cafes for select using (status = 'published');

create policy "Public can view published reviews"
  on public.reviews for select using (status = 'published');

create policy "Public can view items"
  on public.items for select using (true);

create policy "Public can view photos"
  on public.photos for select using (true);

create policy "Public can view want_to_go"
  on public.want_to_go for select using (true);

-- Admin write access (check profile role)
create policy "Admins can manage cafes"
  on public.cafes for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage reviews"
  on public.reviews for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage items"
  on public.items for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage photos"
  on public.photos for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can manage want_to_go"
  on public.want_to_go for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================
-- STORAGE: Photos bucket
-- ============================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict do nothing;

create policy "Public can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Admins can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete photos"
  on storage.objects for delete
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
