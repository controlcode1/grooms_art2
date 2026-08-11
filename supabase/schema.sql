-- ============================================================================
-- GROOMS ART — Supabase schema scaffold
-- Run this against a fresh Supabase project (SQL Editor or `supabase db push`).
-- Covers: portfolio/CMS content, leads, bookings, packages, add-ons, galleries.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Packages & add-ons (Package Configuration module)
-- ---------------------------------------------------------------------------
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'USD',
  duration_hours numeric,
  deliverables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists addons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'USD',
  is_active boolean not null default true,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Availability & bookings (Booking Engine + Dashboard Calendar)
-- ---------------------------------------------------------------------------
create table if not exists availability_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  status text not null default 'available' check (status in ('available', 'limited', 'booked', 'blocked')),
  note text
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  message text,
  source text default 'website',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'lost')),
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete set null,
  package_id uuid references packages(id),
  event_date date not null,
  addon_ids uuid[] not null default '{}',
  deposit_amount_cents integer not null default 0,
  total_amount_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'deposit_paid', 'confirmed', 'completed', 'cancelled')),
  payment_intent_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Portfolio / galleries (Headless CMS + Client Galleries module)
-- ---------------------------------------------------------------------------
create table if not exists galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null check (category in ('wedding', 'portrait', 'full-day', 'cinematic')),
  cover_path text,
  is_published boolean not null default false,
  client_booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  width integer,
  height integer,
  exif jsonb,
  sort_order integer not null default 0
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  couple_names text not null,
  quote text not null,
  location text,
  is_published boolean not null default true,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table packages enable row level security;
alter table addons enable row level security;
alter table availability_blocks enable row level security;
alter table galleries enable row level security;
alter table gallery_images enable row level security;
alter table testimonials enable row level security;
alter table leads enable row level security;
alter table bookings enable row level security;

-- Public read access for published/customer-facing content
create policy "Public can read active packages" on packages
  for select using (is_active = true);

create policy "Public can read active addons" on addons
  for select using (is_active = true);

create policy "Public can read availability" on availability_blocks
  for select using (true);

create policy "Public can read published galleries" on galleries
  for select using (is_published = true);

create policy "Public can read images of published galleries" on gallery_images
  for select using (
    exists (
      select 1 from galleries g
      where g.id = gallery_images.gallery_id and g.is_published = true
    )
  );

create policy "Public can read published testimonials" on testimonials
  for select using (is_published = true);

-- Public can create leads/bookings (booking wizard), but not read others' data
create policy "Public can insert leads" on leads
  for insert with check (true);

create policy "Public can insert bookings" on bookings
  for insert with check (true);

-- Authenticated studio staff (via `is_studio_staff` claim/role) manage everything
create policy "Staff manage packages" on packages for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff manage addons" on addons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff manage availability" on availability_blocks for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff manage galleries" on galleries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff manage gallery images" on gallery_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff manage testimonials" on testimonials for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff read leads" on leads for select
  using (auth.role() = 'authenticated');
create policy "Staff manage leads" on leads for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Staff read bookings" on bookings for select
  using (auth.role() = 'authenticated');
create policy "Staff manage bookings" on bookings for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
