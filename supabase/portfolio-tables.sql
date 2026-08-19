-- ---------------------------------------------------------------------------
-- 5. Portfolio Categories and Images
-- ---------------------------------------------------------------------------

-- Create Portfolio Categories table
create table if not exists public.portfolio_categories (
  id          text primary key,
  name        text not null,
  name_ar     text not null,
  created_at  timestamptz not null default now()
);

-- Create Portfolio Images table
create table if not exists public.portfolio_images (
  id               text primary key,
  slug             text not null,
  title            text not null,
  alt              text not null default '',
  category         text references public.portfolio_categories(id) on delete cascade,
  part_of_full_day boolean not null default false,
  orientation      text not null check (orientation in ('landscape', 'portrait', 'square')),
  exif             jsonb not null default '{}'::jsonb,
  url              text not null, -- The Cloudflare R2 public URL
  r2_key           text,          -- The Cloudflare R2 object key
  file_size        bigint not null default 0, -- File size in bytes
  created_at       timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_images enable row level security;

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Allow public read categories" on public.portfolio_categories;
drop policy if exists "Allow admin manage categories" on public.portfolio_categories;
drop policy if exists "Allow public read images" on public.portfolio_images;
drop policy if exists "Allow admin manage images" on public.portfolio_images;

-- Create Policies
create policy "Allow public read categories" on public.portfolio_categories 
  for select using (true);

create policy "Allow admin manage categories" on public.portfolio_categories 
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Allow public read images" on public.portfolio_images 
  for select using (true);

create policy "Allow admin manage images" on public.portfolio_images 
  for all using (public.is_admin()) with check (public.is_admin());
