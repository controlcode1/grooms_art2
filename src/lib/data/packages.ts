import { supabase } from '@/lib/supabase/client'

export interface PackageFeatureGroup {
  title: string
  title_ar?: string
  items: string[]
  items_ar?: string[]
  type?: 'freetext'
  en?: string
  ar?: string
}

export interface Package {
  id: string
  city: 'baghdad' | 'erbil'
  service: 'sessions' | 'full-day'
  package_key: string
  name: string
  name_ar: string
  price: number
  features: PackageFeatureGroup[]
  description?: string
  description_ar?: string
  sort_order: number
  active: boolean
  badge?: string | null
  badge_ar?: string | null
  image_url?: string | null
  accent_color?: string | null
  created_at?: string
}

// Automatic bilingual translation dictionaries (ensures instant Arabic support even for legacy database rows)
const TITLE_AR_MAP: Record<string, string> = {
  'Album': 'الألبوم',
  'Includes': 'يشمل أيضاً',
  'Gift': 'الهدية',
  'Wedding Reel': 'ريل سينمائي',
  'Promo Film': 'فيلم ترويجي قصير',
  'Bag Album': 'ألبوم الحقيبة الملكي',
  'Photography Team': 'فريق التصوير',
  'Luxury Album': 'الألبوم الفاخر',
  'Companion Album': 'ألبوم الأهل المرافق',
  'Film': 'الفيلم السينمائي',
  'Extras & Gifts': 'الهدايا والمرفقات',
  'Exclusive Gifts': 'الهدايا الحصرية',
  'Premium Benefits': 'مزايا إضافية',
}

const BADGE_AR_MAP: Record<string, string> = {
  'Most Popular': 'الأكثر طلباً',
  'Best Value': 'القيمة الأفضل',
  'VIP': 'VIP',
  'Royal Experience': 'التجربة الملكية',
  'Full Day Coverage': 'تغطية اليوم الكامل',
  'Full Day': 'اليوم الكامل',
}

const DESC_AR_MAP: Record<string, string> = {
  'Intimate, essential portrait and celebration coverage.': 'توثيق مميز ومختصر لأجمل اللحظات والبورتريه بدقة وأناقة.',
  'Intimate, essential portrait and celebration coverage in Erbil.': 'توثيق مميز ومختصر لأجمل اللحظات والبورتريه في أربيل.',
  'Our most beloved package with wedding highlight reel and memory box.': 'باقتنا الأكثر طلباً تشمل ريل زفاف سينمائي وصندوق ذكريات فاخر.',
  'Signature session with highlight reel in Erbil.': 'باقتنا الأكثر طلباً في أربيل تشمل ريل زفاف وصندوق ذكريات فاخر.',
  'Comprehensive session with full promo film and luxury bag album.': 'جلسة تصوير شاملة مع فيلم سينمائي وألبوم الحقيبة الفاخر.',
  'Premium session with promo film and luxury bag album in Erbil.': 'جلسة تصوير فاخرة في أربيل مع فيلم سينمائي وألبوم الحقيبة.',
  'Full day comprehensive photography and cinematic highlight film.': 'تغطية فوتوغرافية وسينمائية شاملة لليوم الكامل مع فيلم مميز.',
  'Full day comprehensive photography and film in Erbil.': 'تغطية فوتوغرافية وسينمائية لليوم الكامل في أربيل.',
  'The pinnacle of wedding documentation with drone coverage and express teaser.': 'قمة التوثيق السينمائي لحفل الزفاف مع تغطية طيران درون وتيزر سريع.',
  'Complete royal full day coverage in Erbil with drone and luxury companion albums.': 'قمة التوثيق السينمائي الملكي لليوم الكامل في أربيل مع طيران درون.',
}

const ITEM_AR_MAP: Record<string, string> = {
  '30×60 cm': 'قياس 30×60 سم',
  '30×80 cm': 'قياس 30×80 سم',
  '5 Pages': '5 صفحات',
  '6 Pages': '6 صفحات',
  '7 Pages': '7 صفحات',
  '10 Pages': '10 صفحات',
  '12 Pages': '12 صفحة',
  '15–20 Photos': '15–20 صورة مختارة',
  '20–25 Photos': '20–25 صورة',
  '20–30 Photos': '20–30 صورة',
  '23–28 Photos': '23–28 صورة',
  '25–30 Photos': '25–30 صورة',
  '33–45 Photos': '33–45 صورة',
  '35–45 Photos': '35–45 صورة',
  'Wall Frame': 'إطار جداري فاخر',
  '2 Table Frames': 'إطاران للمكتب/الطاولة',
  'A Little Piece of Your Story': 'هدية تذكارية خاصة بقصتكم',
  '5 Printed Photos': '5 صور مطبوعة فاخرة',
  '10 Printed Photos': '10 صور مطبوعة فاخرة',
  '30–60 Seconds': 'فيديو ريل مدته 30–60 ثانية',
  '3–5 Minutes': 'فيديو سينمائي مدته 3–5 دقائق',
  'Your Little Memory Box': 'صندوق الذكريات الخشبي',
  'Photo Box': 'صندوق حفظ الصور',
  'Mini Album': 'ميني ألبوم إضافي',
  '2 Photographers': '2 مصور فوتوغرافي',
  '1 Videographer': '1 مصور سينمائي',
  '2 Videographers': '2 مصور فيديو سينمائي',
  'Bride Assistant': 'مساعدة خاصة بالعروس',
  'Drone (where permitted)': 'تصوير طيران درون (حيث يُسمح)',
  'Cinematic Highlight Film · 2–4 Minutes': 'فيلم سينمائي مميز مدته 2–4 دقائق',
  'Cinematic Wedding Film · 3–5 Minutes': 'فيلم زفاف سينمائي كامل 3–5 دقائق',
  'Instagram Highlight Reel': 'ريل إنستغرام سينمائي',
  'Luxury USB Gift': 'فلاش ميموري فاخر',
  'Exclusive Wedding Gift': 'هدية زفاف حصرية خاصة',
  'Priority Delivery': 'أولوية في التسليم',
  'Priority delivery': 'أولوية قصوى بالتسليم',
  'Express Teaser — Delivered within 72 hours': 'تيزر سريع يُسلّم خلال 72 ساعة',
  'Full coordination before the wedding': 'تنسيق مسبق كامل قبل الزفاف',
  'Complete coverage of all important moments': 'تغطية شاملة لكل التفاصيل واللحظات المهمة',
}

export function getPackageDisplayName(pkg: Package, locale: string): string {
  if (locale === 'ar') {
    return pkg.name_ar || pkg.name
  }
  return pkg.name
}

export function getPackageDisplayDescription(pkg: Package, locale: string): string {
  if (locale === 'ar') {
    if (pkg.description_ar) return pkg.description_ar
    if (pkg.description && DESC_AR_MAP[pkg.description]) return DESC_AR_MAP[pkg.description]
    return pkg.description || ''
  }
  return pkg.description || ''
}

export function getPackageDisplayBadge(pkg: Package, locale: string): string | null {
  if (!pkg.badge && !pkg.badge_ar) return null
  if (locale === 'ar') {
    if (pkg.badge_ar) return pkg.badge_ar
    if (pkg.badge && BADGE_AR_MAP[pkg.badge]) return BADGE_AR_MAP[pkg.badge]
    return pkg.badge || null
  }
  return pkg.badge || null
}

export function getPackageDisplayFeatures(
  pkg: Package,
  locale: string,
): { title: string; items: string[] }[] {
  if (!Array.isArray(pkg.features)) return []

  return pkg.features.map((group) => {
    if (group.type === 'freetext') {
      const text = locale === 'ar' ? (group.ar || group.en || '') : (group.en || '')
      const items = text.split('\n').map(l => l.trim()).filter(Boolean)
      return { title: '', items }
    }

    let title = group.title
    let items = group.items || []

    if (locale === 'ar') {
      if (group.title_ar) {
        title = group.title_ar
      } else if (TITLE_AR_MAP[group.title]) {
        title = TITLE_AR_MAP[group.title]
      }

      if (group.items_ar && group.items_ar.length > 0) {
        items = group.items_ar
      } else {
        items = items.map((it) => ITEM_AR_MAP[it] || it)
      }
    }

    return { title, items }
  })
}

/**
 * Loads active packages for the public booking engine from Supabase.
 * Returns an empty array if no packages exist or Supabase is not configured.
 * (No hardcoded fallback — Supabase is the single source of truth).
 */
export async function loadPackages(
  city: string,
  service: 'sessions' | 'full-day',
): Promise<Package[]> {
  if (!supabase) {
    return []
  }

  try {
    const cityKey = city === 'erbil' ? 'erbil' : 'baghdad'
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('city', cityKey)
      .eq('service', service)
      .eq('active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to load packages from Supabase:', error)
      return []
    }

    return (data || []) as Package[]
  } catch (err) {
    console.error('Error fetching packages:', err)
    return []
  }
}

/**
 * Loads all packages for the admin dashboard (including inactive packages).
 */
export async function loadAllPackages(): Promise<Package[]> {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to load all packages for admin:', error)
      return []
    }

    return (data || []) as Package[]
  } catch (err) {
    console.error('Error fetching all packages:', err)
    return []
  }
}

/**
 * Inserts or updates a package in Supabase.
 */
export async function upsertPackage(
  pkg: Partial<Package> & { city: 'baghdad' | 'erbil'; service: 'sessions' | 'full-day'; package_key: string; name: string; price: number },
): Promise<{ data: Package | null; error: any }> {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  try {
    const payload = { ...pkg }
    if (payload.id && (payload.id.startsWith('pkg-') || payload.id.length < 30)) {
      delete payload.id
    }
    const { data, error } = await supabase
      .from('packages')
      .upsert(payload, { onConflict: 'city,service,package_key' })
      .select()
      .single()

    return { data: data as Package, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

/**
 * Deletes a package by ID.
 */
export async function deletePackage(id: string): Promise<{ error: any }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  try {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    return { error }
  } catch (err) {
    return { error: err }
  }
}

/**
 * Batch updates package sort order.
 */
export async function reorderPackages(
  items: { id: string; sort_order: number }[],
): Promise<{ error: any }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  try {
    for (const item of items) {
      const { error } = await supabase
        .from('packages')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
      if (error) return { error }
    }
    return { error: null }
  } catch (err) {
    return { error: err }
  }
}
