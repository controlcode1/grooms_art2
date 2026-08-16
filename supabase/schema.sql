-- ============================================================================
-- GROOMS ART — Supabase schema scaffold & migration
-- Run this in Supabase SQL Editor to initialize or update the database.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Helper function: is_admin()
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select
    auth.role() = 'authenticated'
    and (auth.jwt() ->> 'email') is not null
$$;

-- ---------------------------------------------------------------------------
-- 2. Packages Management (Sessions & Full Day for Baghdad & Erbil)
-- ---------------------------------------------------------------------------
create table if not exists public.packages (
  id             uuid primary key default gen_random_uuid(),
  city           text not null check (city in ('baghdad', 'erbil')),
  service        text not null check (service in ('sessions', 'full-day')),
  package_key    text not null,           -- e.g. 'essential', 'signature', 'premium', 'vip', 'royal'
  name           text not null,
  name_ar        text not null default '',
  price          integer not null,        -- in USD
  features       jsonb not null default '[]'::jsonb, -- [{title, title_ar, items: string[], items_ar: string[]}]
  description    text,
  description_ar text default '',
  sort_order     integer not null default 0,
  active         boolean not null default true,
  badge          text,                    -- e.g. 'Most Popular', 'Best Value'
  badge_ar       text default '',         -- e.g. 'الأكثر طلباً', 'القيمة الأفضل'
  image_url      text,                    -- optional package image/cover
  accent_color   text,                    -- optional hex color e.g. '#12372a'
  created_at     timestamptz not null default now(),
  unique (city, service, package_key)
);

-- RLS for packages
alter table public.packages enable row level security;

drop policy if exists "Public read active packages" on public.packages;
create policy "Public read active packages" on public.packages
  for select using (active = true);

drop policy if exists "Admin manage packages" on public.packages;
create policy "Admin manage packages" on public.packages
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Bookings
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id                 text primary key,
  type               text not null default 'session',
  status             text not null default 'pending',
  city               text not null default '',
  package_id         text not null default '',
  location_id        text not null default '',
  date               text not null default '',
  full_name          text not null default '',
  phone              text not null default '',
  email              text default '',
  notes              text default '',
  whatsapp_triggered boolean default false,
  created_at         timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "Public insert bookings" on public.bookings;
create policy "Public insert bookings" on public.bookings
  for insert with check (true);

drop policy if exists "Admin manage bookings" on public.bookings;
create policy "Admin manage bookings" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Initial Seed Data for Packages (Bilingual: Arabic & English)
-- ---------------------------------------------------------------------------
insert into public.packages (
  city, service, package_key, name, name_ar, price, features, description, description_ar, sort_order, active, badge, badge_ar
)
values
  -- Baghdad Sessions
  ('baghdad', 'sessions', 'essential', 'Essential', 'المجموعة الأساسية', 250, 
   '[{"title": "Album", "title_ar": "الألبوم", "items": ["30×60 cm", "5 Pages", "15–20 Photos"], "items_ar": ["قياس 30×60 سم", "5 صفحات", "15–20 صورة مختارة"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري فاخر", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["A Little Piece of Your Story", "5 Printed Photos"], "items_ar": ["هدية تذكارية خاصة بقصتكم", "5 صور مطبوعة فاخرة"]}]'::jsonb,
   'Intimate, essential portrait and celebration coverage.',
   'توثيق مميز ومختصر لأجمل اللحظات والبورتريه بدقة وأناقة.', 
   0, true, null, null),

  ('baghdad', 'sessions', 'signature', 'Signature', 'المجموعة المميزة', 400, 
   '[{"title": "Album", "title_ar": "الألبوم", "items": ["30×60 cm", "7 Pages", "25–30 Photos"], "items_ar": ["قياس 30×60 سم", "7 صفحات", "25–30 صورة"]}, {"title": "Wedding Reel", "title_ar": "ريل سينمائي", "items": ["30–60 Seconds"], "items_ar": ["فيديو ريل مدته 30–60 ثانية"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري فاخر", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["Your Little Memory Box", "Photo Box", "10 Printed Photos"], "items_ar": ["صندوق الذكريات الخشبي", "صندوق حفظ الصور", "10 صور مطبوعة"]}]'::jsonb,
   'Our most beloved package with wedding highlight reel and memory box.',
   'باقتنا الأكثر طلباً تشمل ريل زفاف سينمائي وصندوق ذكريات فاخر.',
   1, true, 'Most Popular', 'الأكثر طلباً'),

  ('baghdad', 'sessions', 'premium', 'Premium', 'المجموعة الفاخرة', 600, 
   '[{"title": "Bag Album", "title_ar": "ألبوم الحقيبة الملكي", "items": ["30×80 cm", "10 Pages", "33–45 Photos"], "items_ar": ["قياس 30×80 سم", "10 صفحات", "33–45 صورة"]}, {"title": "Promo Film", "title_ar": "فيلم ترويجي قصير", "items": ["3–5 Minutes"], "items_ar": ["فيديو سينمائي مدته 3–5 دقائق"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري كبير", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["Mini Album"], "items_ar": ["ميني ألبوم إضافي"]}]'::jsonb,
   'Comprehensive session with full promo film and luxury bag album.',
   'جلسة تصوير شاملة مع فيلم سينمائي وألبوم الحقيبة الفاخر.',
   2, true, 'Best Value', 'القيمة الأفضل'),

  -- Erbil Sessions
  ('erbil', 'sessions', 'essential', 'Essential', 'المجموعة الأساسية', 450, 
   '[{"title": "Album", "title_ar": "الألبوم", "items": ["30×60 cm", "5 Pages", "15–20 Photos"], "items_ar": ["قياس 30×60 سم", "5 صفحات", "15–20 صورة مختارة"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري فاخر", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["A Little Piece of Your Story", "5 Printed Photos"], "items_ar": ["هدية تذكارية خاصة بقصتكم", "5 صور مطبوعة فاخرة"]}]'::jsonb,
   'Intimate, essential portrait and celebration coverage in Erbil.',
   'توثيق مميز لأجمل اللحظات والبورتريه في أربيل.',
   0, true, null, null),

  ('erbil', 'sessions', 'signature', 'Signature', 'المجموعة المميزة', 600, 
   '[{"title": "Album", "title_ar": "الألبوم", "items": ["30×60 cm", "7 Pages", "25–30 Photos"], "items_ar": ["قياس 30×60 سم", "7 صفحات", "25–30 صورة"]}, {"title": "Wedding Reel", "title_ar": "ريل سينمائي", "items": ["30–60 Seconds"], "items_ar": ["فيديو ريل مدته 30–60 ثانية"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري فاخر", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["Your Little Memory Box", "Photo Box", "10 Printed Photos"], "items_ar": ["صندوق الذكريات الخشبي", "صندوق حفظ الصور", "10 صور مطبوعة"]}]'::jsonb,
   'Signature session with highlight reel in Erbil.',
   'باقتنا الأكثر طلباً في أربيل تشمل ريل زفاف وصندوق ذكريات فاخر.',
   1, true, 'Most Popular', 'الأكثر طلباً'),

  ('erbil', 'sessions', 'premium', 'Premium', 'المجموعة الفاخرة', 800, 
   '[{"title": "Bag Album", "title_ar": "ألبوم الحقيبة الملكي", "items": ["30×80 cm", "10 Pages", "33–45 Photos"], "items_ar": ["قياس 30×80 سم", "10 صفحات", "33–45 صورة"]}, {"title": "Promo Film", "title_ar": "فيلم ترويجي قصير", "items": ["3–5 Minutes"], "items_ar": ["فيديو سينمائي مدته 3–5 دقائق"]}, {"title": "Includes", "title_ar": "يشمل أيضاً", "items": ["Wall Frame", "2 Table Frames"], "items_ar": ["إطار جداري كبير", "إطاران للمكتب/الطاولة"]}, {"title": "Gift", "title_ar": "الهدية", "items": ["Mini Album"], "items_ar": ["ميني ألبوم إضافي"]}]'::jsonb,
   'Premium session with promo film and luxury bag album in Erbil.',
   'جلسة تصوير فاخرة في أربيل مع فيلم سينمائي وألبوم الحقيبة.',
   2, true, 'Best Value', 'القيمة الأفضل'),

  -- Baghdad Full Day
  ('baghdad', 'full-day', 'vip', 'VIP Collection', 'مجموعة كبار الشخصيات', 1000, 
   '[{"title": "Photography Team", "title_ar": "فريق التصوير", "items": ["2 Photographers", "1 Videographer", "Bride Assistant"], "items_ar": ["2 مصور فوتوغرافي", "1 مصور سينمائي", "مساعدة خاصة بالعروس"]}, {"title": "Luxury Album", "title_ar": "الألبوم الفاخر", "items": ["30×80 cm", "10 Pages", "23–28 Photos"], "items_ar": ["قياس 30×80 سم", "10 صفحات", "23–28 صورة"]}, {"title": "Companion Album", "title_ar": "ألبوم الأهل المرافق", "items": ["30×60 cm", "5 Pages", "20–25 Photos"], "items_ar": ["قياس 30×60 سم", "5 صفحات", "20–25 صورة"]}, {"title": "Film", "title_ar": "الفيلم السينمائي", "items": ["Cinematic Highlight Film · 2–4 Minutes"], "items_ar": ["فيلم سينمائي مميز مدته 2–4 دقائق"]}, {"title": "Extras & Gifts", "title_ar": "الهدايا والمرفقات", "items": ["Instagram Highlight Reel", "Wall Frame", "2 Table Frames", "Luxury USB Gift", "Exclusive Wedding Gift", "Priority Delivery"], "items_ar": ["ريل إنستغرام سينمائي", "إطار جداري كبير", "إطاران للمكتب/الطاولة", "فلاش ميموري فاخر", "هدية زفاف حصرية", "أولوية في التسليم"]}]'::jsonb,
   'Full day comprehensive photography and cinematic highlight film.',
   'تغطية فوتوغرافية وسينمائية شاملة لليوم الكامل مع فيلم مميز.',
   0, true, 'VIP', 'VIP'),

  ('baghdad', 'full-day', 'royal', 'Royal Collection', 'المجموعة الملكية', 1500, 
   '[{"title": "Photography Team", "title_ar": "فريق التصوير الملكي", "items": ["2 Photographers", "2 Videographers", "Drone (where permitted)", "Bride Assistant"], "items_ar": ["2 مصور فوتوغرافي", "2 مصور فيديو سينمائي", "تصوير طيران درون (حيث يُسمح)", "مساعدة خاصة بالعروس"]}, {"title": "Luxury Album", "title_ar": "الألبوم الملكي الفاخر", "items": ["30×80 cm", "12 Pages", "35–45 Photos"], "items_ar": ["قياس 30×80 سم", "12 صفحة", "35–45 صورة"]}, {"title": "Companion Album", "title_ar": "ألبوم الأهل المرافق", "items": ["30×60 cm", "6 Pages", "20–30 Photos"], "items_ar": ["قياس 30×60 سم", "6 صفحات", "20–30 صورة"]}, {"title": "Film", "title_ar": "الفيلم والريل", "items": ["Cinematic Wedding Film · 3–5 Minutes"], "items_ar": ["فيلم زفاف سينمائي كامل 3–5 دقائق"]}, {"title": "Exclusive Gifts", "title_ar": "الهدايا الحصرية", "items": ["Instagram Highlight Reel", "Express Teaser — Delivered within 72 hours", "Wall Frame", "2 Table Frames", "Luxury USB Gift", "Exclusive Wedding Gift"], "items_ar": ["ريل إنستغرام سينمائي", "تيزر سريع يُسلّم خلال 72 ساعة", "إطار جداري فاخر", "إطاران للمكتب/الطاولة", "فلاش ميموري فاخر", "هدية زفاف حصرية خاصة"]}, {"title": "Premium Benefits", "title_ar": "مزايا إضافية", "items": ["Priority delivery", "Full coordination before the wedding", "Complete coverage of all important moments"], "items_ar": ["أولوية قصوى بالتسليم", "تنسيق مسبق كامل قبل الزفاف", "تغطية شاملة لكل التفاصيل"]}]'::jsonb,
   'The pinnacle of wedding documentation with drone coverage and express teaser.',
   'قمة التوثيق السينمائي لحفل الزفاف مع تغطية طيران درون وتيزر سريع.',
   1, true, 'Royal Experience', 'التجربة الملكية'),

  -- Erbil Full Day
  ('erbil', 'full-day', 'vip', 'VIP Collection', 'مجموعة كبار الشخصيات', 1300, 
   '[{"title": "Photography Team", "title_ar": "فريق التصوير", "items": ["2 Photographers", "1 Videographer", "Bride Assistant"], "items_ar": ["2 مصور فوتوغرافي", "1 مصور سينمائي", "مساعدة خاصة بالعروس"]}, {"title": "Luxury Album", "title_ar": "الألبوم الفاخر", "items": ["30×80 cm", "10 Pages", "23–28 Photos"], "items_ar": ["قياس 30×80 سم", "10 صفحات", "23–28 صورة"]}, {"title": "Companion Album", "title_ar": "ألبوم الأهل المرافق", "items": ["30×60 cm", "5 Pages", "20–25 Photos"], "items_ar": ["قياس 30×60 سم", "5 صفحات", "20–25 صورة"]}, {"title": "Film", "title_ar": "الفيلم السينمائي", "items": ["Cinematic Highlight Film · 2–4 Minutes"], "items_ar": ["فيلم سينمائي مميز مدته 2–4 دقائق"]}, {"title": "Extras & Gifts", "title_ar": "الهدايا والمرفقات", "items": ["Instagram Highlight Reel", "Wall Frame", "2 Table Frames", "Luxury USB Gift", "Exclusive Wedding Gift", "Priority Delivery"], "items_ar": ["ريل إنستغرام سينمائي", "إطار جداري كبير", "إطاران للمكتب/الطاولة", "فلاش ميموري فاخر", "هدية زفاف حصرية", "أولوية في التسليم"]}]'::jsonb,
   'Full day comprehensive photography and film in Erbil.',
   'تغطية فوتوغرافية وسينمائية لليوم الكامل في أربيل.',
   0, true, 'VIP', 'VIP'),

  ('erbil', 'full-day', 'royal', 'Royal Collection', 'المجموعة الملكية', 1800, 
   '[{"title": "Photography Team", "title_ar": "فريق التصوير الملكي", "items": ["2 Photographers", "2 Videographers", "Drone (where permitted)", "Bride Assistant"], "items_ar": ["2 مصور فوتوغرافي", "2 مصور فيديو سينمائي", "تصوير طيران درون (حيث يُسمح)", "مساعدة خاصة بالعروس"]}, {"title": "Luxury Album", "title_ar": "الألبوم الملكي الفاخر", "items": ["30×80 cm", "12 Pages", "35–45 Photos"], "items_ar": ["قياس 30×80 سم", "12 صفحة", "35–45 صورة"]}, {"title": "Companion Album", "title_ar": "ألبوم الأهل المرافق", "items": ["30×60 cm", "6 Pages", "20–30 Photos"], "items_ar": ["قياس 30×60 سم", "6 صفحات", "20–30 صورة"]}, {"title": "Film", "title_ar": "الفيلم والريل", "items": ["Cinematic Wedding Film · 3–5 Minutes"], "items_ar": ["فيلم زفاف سينمائي كامل 3–5 دقائق"]}, {"title": "Exclusive Gifts", "title_ar": "الهدايا الحصرية", "items": ["Instagram Highlight Reel", "Express Teaser — Delivered within 72 hours", "Wall Frame", "2 Table Frames", "Luxury USB Gift", "Exclusive Wedding Gift"], "items_ar": ["ريل إنستغرام سينمائي", "تيزر سريع يُسلّم خلال 72 ساعة", "إطار جداري فاخر", "إطاران للمكتب/الطاولة", "فلاش ميموري فاخر", "هدية زفاف حصرية خاصة"]}, {"title": "Premium Benefits", "title_ar": "مزايا إضافية", "items": ["Priority delivery", "Full coordination before the wedding", "Complete coverage of all important moments"], "items_ar": ["أولوية قصوى بالتسليم", "تنسيق مسبق كامل قبل الزفاف", "تغطية شاملة لكل التفاصيل"]}]'::jsonb,
   'Complete royal full day coverage in Erbil with drone and luxury companion albums.',
   'قمة التوثيق السينمائي الملكي لليوم الكامل في أربيل مع طيران درون.',
   1, true, 'Royal Experience', 'التجربة الملكية')
on conflict (city, service, package_key) do update set
  name = excluded.name,
  name_ar = excluded.name_ar,
  price = excluded.price,
  features = excluded.features,
  description = excluded.description,
  description_ar = excluded.description_ar,
  badge = excluded.badge,
  badge_ar = excluded.badge_ar;
