import { storage, STORAGE_KEYS } from '@/lib/storage'
import { idbGetAllImages, idbDeleteImage } from '@/lib/imageDb'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { deleteFromR2 } from '@/lib/r2'

export type PortfolioCategory = string

export interface PortfolioImage {
  id: string
  slug: string
  title: string
  alt: string
  category: PortfolioCategory
  partOfFullDay: boolean
  orientation: 'landscape' | 'portrait' | 'square'
  exif: {
    camera: string
    lens: string
    focalLength: string
    aperture: string
    shutter: string
    iso: string
  }
  url?: string
  r2Key?: string
  fileSize?: number  // file size in bytes
}

const PORTRAIT_FRAMES = new Set(['frame-05', 'frame-07', 'frame-12'])

const TITLES: Record<string, string> = {
  'frame-01': 'The First Frame',
  'frame-02': 'Watching the Ridge',
  'frame-03': 'Stone Tower, Late Sun',
  'frame-04': 'A Song for the Valley',
  'frame-05': 'Walking Into Evening',
  'frame-06': 'Where the River Bends',
  'frame-07': 'Tuning at Golden Hour',
  'frame-08': 'The Long Ridge',
  'frame-09': 'Wind in the Hills',
  'frame-10': 'Hand in Hand, Highlands',
  'frame-11': 'Overlooking Everything',
  'frame-12': 'A Quiet Chord',
  'frame-13': 'Beneath the Wild Trees',
  'frame-14': 'Dust and Lace',
  'frame-15': 'Turning Toward the Sun',
  'frame-16': 'The Path Between Us',
  'frame-17': 'Sunlit Promises',
  'frame-18': 'Along the Stone Wall',
  'frame-19': 'Held by Golden Light',
  'frame-20': 'Carried Away',
  'frame-21': 'Wandering the Highlands',
  'frame-22': 'Toward the Horizon',
  'frame-23': 'The Ruins at Dusk',
  'frame-24': 'Every Step Together',
  'frame-25': 'Climbing Toward Evening',
  'frame-26': 'Beneath the Oak',
  'frame-27': 'The Same Old Ridge',
  'frame-28': 'Whisper on the Trail',
  'frame-29': 'Where the Land Opens',
  'frame-30': 'Last Light on the Hills',
}

// ─── Default Static Categories ──────────────────────────────────────────────
export interface CategoryInfo {
  id: string
  name: string
  nameAr: string
}

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'wedding', name: 'Weddings', nameAr: 'حفلات الزفاف' },
  { id: 'portrait', name: 'Portraits', nameAr: 'البورتريه' },
  { id: 'cinematic', name: 'Cinematic Shorts', nameAr: 'الأفلام السينمائية' },
]

export const staticPortfolioImages: PortfolioImage[] = []

// ─── Dynamic Getters (Interfacing with storage and database) ─────────────────

// Map to cache database-fetched custom image URLs by ID for synchronous resolution in imageSrcSet
const dbImageUrls = new Map<string, string>()

/** Storage limit: 9 GB in bytes */
export const STORAGE_LIMIT_BYTES = 9 * 1024 * 1024 * 1024

/**
 * Returns the total bytes used by all uploaded images in Supabase.
 * Falls back to 0 if Supabase is not configured.
 */
export async function getStorageUsedBytes(): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0
  try {
    const { data, error } = await supabase
      .from('portfolio_images')
      .select('file_size')
    if (error) {
      // Column might not exist yet if SQL migration wasn't run
      return 0
    }
    return (data || []).reduce((sum, row) => sum + (Number(row.file_size) || 0), 0)
  } catch {
    return 0
  }
}

/**
 * Load all portfolio categories dynamically.
 * Combines base static categories with any custom ones managed in the dashboard.
 */
export async function getPortfolioCategories(): Promise<CategoryInfo[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('portfolio_categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          nameAr: c.name_ar,
        }))
      }
    } catch (err) {
      console.error('[portfolio] Failed to fetch categories from Supabase, trying fallback:', err)
    }
  }

  const custom = storage.get<CategoryInfo[]>(STORAGE_KEYS.portfolioCategories) || []
  const deletedIds = storage.get<string[]>(STORAGE_KEYS.deletedCategories) || []
  const all = [...DEFAULT_CATEGORIES]
  // Add any custom ones not already in defaults
  custom.forEach((c) => {
    if (!all.some((existing) => existing.id === c.id)) {
      all.push(c)
    }
  })
  return all.filter((c) => !deletedIds.includes(c.id))
}

/**
 * Save custom portfolio categories.
 */
export async function savePortfolioCategories(categories: CategoryInfo[]): Promise<void> {
  storage.set(STORAGE_KEYS.portfolioCategories, categories)

  // Self-heal: if any saved categories were previously in deletedCategories, activate them again
  const deletedIds = storage.get<string[]>(STORAGE_KEYS.deletedCategories) || []
  if (deletedIds.length > 0) {
    const activeIds = new Set(categories.map((c) => c.id))
    const updatedDeleted = deletedIds.filter((id) => !activeIds.has(id))
    storage.set(STORAGE_KEYS.deletedCategories, updatedDeleted)
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const dbCategories = categories.map((c) => ({
        id: c.id,
        name: c.name,
        name_ar: c.nameAr,
      }))

      const { error } = await supabase
        .from('portfolio_categories')
        .upsert(dbCategories, { onConflict: 'id' })

      if (error) throw error
    } catch (err) {
      console.error('[portfolio] Failed to save categories to Supabase:', err)
      throw err
    }
  }
}

/**
 * Delete a portfolio category, whether custom or static.
 */
export async function deletePortfolioCategory(catId: string): Promise<void> {
  const custom = storage.get<CategoryInfo[]>(STORAGE_KEYS.portfolioCategories) || []
  const updatedCustom = custom.filter((c) => c.id !== catId)
  storage.set(STORAGE_KEYS.portfolioCategories, updatedCustom)

  const deletedIds = storage.get<string[]>(STORAGE_KEYS.deletedCategories) || []
  if (!deletedIds.includes(catId)) {
    deletedIds.push(catId)
    storage.set(STORAGE_KEYS.deletedCategories, deletedIds)
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('portfolio_categories')
        .delete()
        .eq('id', catId)

      if (error) throw error
    } catch (err) {
      console.error('[portfolio] Failed to delete category in Supabase:', err)
      throw err
    }
  }
}

/**
 * Returns true when an image id is resolvable to an actual asset.
 *
 * Valid formats:
 *   - `data:…`   — inline base64 from the dashboard upload flow
 *   - `blob:…`   — blob URL (browser-lifetime, handled gracefully)
 *   - `frame-NN` — one of the 30 static frames in public/images/portfolio/
 *
 * Anything else (e.g. legacy `upload-{timestamp}-{random}` ids from an old
 * upload scheme) is treated as an orphan and filtered out.
 */
function isValidImageId(id: string): boolean {
  return (
    id.startsWith('data:') ||
    id.startsWith('blob:') ||
    id.startsWith('img-') ||
    /^frame-\d{2}$/.test(id)
  )
}

// ─── IndexedDB image cache ───────────────────────────────────────────────────
// Large uploaded images (data-URLs) are stored in IndexedDB (much higher quota
// than localStorage) keyed by a short `img-*` id; only that id + metadata is
// kept in localStorage. This cache holds the resolved data-URLs in memory so
// `imageSrcSet()` can resolve them synchronously once loaded.
const idbImageCache = new Map<string, string>()
let idbCacheLoaded = false
let idbLoadPromise: Promise<void> | null = null

/** Load all IndexedDB-backed images into the in-memory cache. Safe to call repeatedly. */
export function preloadIdbImages(): Promise<void> {
  if (idbCacheLoaded) return Promise.resolve()
  if (idbLoadPromise) return idbLoadPromise
  idbLoadPromise = idbGetAllImages()
    .then((items) => {
      items.forEach((item) => idbImageCache.set(item.id, item.dataUrl))
      idbCacheLoaded = true
    })
    .catch((err) => {
      console.error('[portfolio] Failed to load images from IndexedDB:', err)
      idbCacheLoaded = true
    })
  return idbLoadPromise
}

/** Populate the in-memory cache immediately after an upload, before the DB read-back. */
export function cacheIdbImage(id: string, dataUrl: string): void {
  idbImageCache.set(id, dataUrl)
}

/**
 * Get all portfolio images, combining static and dynamically uploaded ones.
 * Automatically prunes orphaned entries whose ids cannot be resolved to a
 * real asset, and persists the cleaned list back to storage so the bad
 * entries don't accumulate across reloads.
 */
export async function getPortfolioImages(): Promise<PortfolioImage[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Cache URLs in memory for synchronous lookup in imageSrcSet
        data.forEach((img) => {
          if (img.url) {
            dbImageUrls.set(img.id, img.url)
          }
        })

        return data.map((img) => ({
          id: img.id,
          slug: img.slug,
          title: img.title,
          alt: img.alt || '',
          category: img.category,
          partOfFullDay: img.part_of_full_day,
          orientation: img.orientation,
          exif: img.exif || {},
          url: img.url,
          r2Key: img.r2_key,
          fileSize: img.file_size || 0,
        }))
      }
    } catch (err) {
      console.error('[portfolio] Failed to fetch images from Supabase, trying fallback:', err)
    }
  }

  const custom = storage.get<PortfolioImage[]>(STORAGE_KEYS.portfolioImages) || []

  // Drop any entry whose id is an unresolvable legacy format (e.g. upload-*).
  const valid = custom.filter((img) => isValidImageId(img.id))
  valid.forEach((img) => {
    if (img.url) {
      dbImageUrls.set(img.id, img.url)
    }
  })

  // Self-heal: persist the cleaned list so orphans don't persist across reloads.
  if (valid.length !== custom.length) {
    storage.set(STORAGE_KEYS.portfolioImages, valid)
  }

  const deletedStaticIds = storage.get<string[]>(STORAGE_KEYS.deletedStaticImages) || []
  const activeStatic = staticPortfolioImages.filter((img) => !deletedStaticIds.includes(img.id))

  return [...valid, ...activeStatic]
}

/**
 * Save custom uploaded portfolio images.
 */
export async function savePortfolioImages(images: PortfolioImage[]): Promise<void> {
  // Populate in-memory map immediately so imageSrcSet can resolve new URLs synchronously
  images.forEach((img) => {
    if (img.url) {
      dbImageUrls.set(img.id, img.url)
    }
  })

  storage.set(STORAGE_KEYS.portfolioImages, images)

  if (isSupabaseConfigured && supabase) {
    try {
      const dbImages = images.map((img) => ({
        id: img.id,
        slug: img.slug,
        title: img.title,
        alt: img.alt || '',
        category: img.category,
        part_of_full_day: img.partOfFullDay,
        orientation: img.orientation,
        exif: img.exif || {},
        url: img.url || '',
        r2_key: img.r2Key || null,
        file_size: img.fileSize || 0,
      }))

      const { error } = await supabase
        .from('portfolio_images')
        .upsert(dbImages, { onConflict: 'id' })

      if (error) throw error
    } catch (err) {
      console.error('[portfolio] Failed to save images to Supabase:', err)
      throw err
    }
  }
}

/**
 * Delete a portfolio image, whether custom or static.
 */
export async function deletePortfolioImage(imgId: string): Promise<void> {
  const custom = storage.get<PortfolioImage[]>(STORAGE_KEYS.portfolioImages) || []
  const customImg = custom.find((img) => img.id === imgId)

  // Fetch all images from DB to check if it's there
  let dbImg: PortfolioImage | undefined
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('id', imgId)
        .maybeSingle()

      if (error) throw error
      if (data) {
        dbImg = {
          id: data.id,
          slug: data.slug,
          title: data.title,
          alt: data.alt,
          category: data.category,
          partOfFullDay: data.part_of_full_day,
          orientation: data.orientation,
          exif: data.exif,
          url: data.url,
          r2Key: data.r2_key,
        }
      }
    } catch (err) {
      console.error('[portfolio] Failed to find image to delete in Supabase:', err)
    }
  }

  const isCustom = Boolean(customImg || dbImg)
  const targetImg = customImg || dbImg

  if (isCustom && targetImg) {
    // 1. Delete from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('portfolio_images')
          .delete()
          .eq('id', imgId)

        if (error) throw error
      } catch (err) {
        console.error('[portfolio] Failed to delete image from Supabase:', err)
      }
    }

    // 2. Delete from Cloudflare R2 if it has an R2 key
    if (targetImg.r2Key) {
      try {
        await deleteFromR2({ data: { key: targetImg.r2Key } })
      } catch (err) {
        console.error('[portfolio] Failed to delete file from R2:', err)
      }
    }

    // 3. Sync local fallback storage
    const updated = custom.filter((img) => img.id !== imgId)
    storage.set(STORAGE_KEYS.portfolioImages, updated)
    idbImageCache.delete(imgId)
    dbImageUrls.delete(imgId)
    idbDeleteImage(imgId).catch((err) => console.error('[portfolio] Failed to delete image from IndexedDB:', err))
  } else {
    // If it's a static image, track its ID in deletedStaticImages so we can filter it out
    const deletedStaticIds = storage.get<string[]>(STORAGE_KEYS.deletedStaticImages) || []
    if (!deletedStaticIds.includes(imgId)) {
      deletedStaticIds.push(imgId)
      storage.set(STORAGE_KEYS.deletedStaticImages, deletedStaticIds)
    }
  }
}

// Keep the legacy export for compatibility where needed, but it's recommended to call getPortfolioImages()
export const portfolioImages = staticPortfolioImages

/**
 * True for any id that resolves to an inline image src (data URL, blob URL,
 * or an IndexedDB-cached upload) rather than a static `-sm/-md/-lg.webp`
 * asset path — these don't have multiple pre-generated sizes, so callers
 * should skip building a `srcSet`/`sizes` attribute for them.
 */
export function isInlineImage(id: string): boolean {
  return id.startsWith('data:') || id.startsWith('blob:') || id.startsWith('img-')
}

export function imageSrcSet(id: string) {
  // Check the DB-URL map first (for Cloudflare R2 images)
  const dbUrl = dbImageUrls.get(id)
  if (dbUrl) {
    return {
      sm: dbUrl,
      md: dbUrl,
      lg: dbUrl,
    }
  }

  // If the ID itself is a full http(s) URL
  if (id.startsWith('http://') || id.startsWith('https://')) {
    return {
      sm: id,
      md: id,
      lg: id,
    }
  }

  // If id is a base64 / data URL (custom uploaded image), return it directly for all sizes
  if (id.startsWith('data:') || id.startsWith('blob:')) {
    return {
      sm: id,
      md: id,
      lg: id,
    }
  }
  // Custom uploads: resolve the actual data-URL from the IndexedDB cache.
  if (id.startsWith('img-')) {
    const cached = idbImageCache.get(id) || ''
    return {
      sm: cached,
      md: cached,
      lg: cached,
    }
  }
  return {
    sm: `/images/portfolio/${id}-sm.webp`,
    md: `/images/portfolio/${id}-md.webp`,
    lg: `/images/portfolio/${id}-lg.webp`,
  }
}


export const fullDayChapters = [
  { key: 'morning', frames: staticPortfolioImages.slice(0, 6) },
  { key: 'ceremony', frames: staticPortfolioImages.slice(6, 12) },
  { key: 'portraits', frames: staticPortfolioImages.slice(12, 18) },
  { key: 'golden', frames: staticPortfolioImages.slice(18, 24) },
  { key: 'evening', frames: staticPortfolioImages.slice(24, 30) },
] as const

export const testimonials = [
  {
    id: 't1',
    names: 'Layla & Omar',
    quote:
      'They disappeared into the background and somehow captured every real moment — the nerves, the laugh we didn\u2019t plan, the walk up the ridge at sunset. It still feels like our actual day, not a performance of it.',
    location: 'Destination Elopement',
  },
  {
    id: 't2',
    names: 'Noor & Adam',
    quote:
      'We almost skipped professional photography. We\u2019re so glad we didn\u2019t. The gallery reads like a film — quiet, honest, completely us.',
    location: 'Full Day Wedding',
  },
  {
    id: 't3',
    names: 'Rana & Zaid',
    quote:
      'No forced poses, no cheesy backdrops — just light, land, and two people. Months later, the photographs still make us feel something.',
    location: 'Highlands Session',
  },
]

export const packages = [
  {
    id: 'p-essential',
    slug: 'essential',
    name: 'Essential',
    priceLabel: 'From $1,800',
    durationLabel: '4 hours coverage',
    description: 'Intimate ceremonies and elopements — one photographer, full gallery.',
    deliverables: [
      '4 hours of coverage',
      '1 photographer',
      '300+ edited high-resolution images',
      'Private online gallery',
    ],
  },
  {
    id: 'p-signature',
    slug: 'signature',
    name: 'Signature',
    priceLabel: 'From $3,200',
    durationLabel: '8 hours coverage',
    description: 'Our most-booked package — full ceremony through golden hour portraits.',
    deliverables: [
      '8 hours of coverage',
      '1 photographer + 1 second shooter',
      '600+ edited high-resolution images',
      '3-minute cinematic highlight film',
      'Private online gallery + print release',
    ],
  },
  {
    id: 'p-fullday',
    slug: 'full-day',
    name: 'Full Day Experience',
    priceLabel: 'From $4,800',
    durationLabel: '12 hours coverage',
    description: 'Preparation to last dance — the complete chronological story.',
    deliverables: [
      '12 hours of coverage',
      '2 photographers + 1 cinematographer',
      'Full edited gallery (900+ images)',
      '5–7 minute cinematic film',
      'Engagement session included',
    ],
  },
]

export const addonsCatalog = [
  { id: 'a-second-shooter', name: 'Additional Photographer', priceLabel: '+$450' },
  { id: 'a-drone', name: 'Aerial Drone Coverage', priceLabel: '+$300' },
  { id: 'a-album', name: 'Fine Art Printed Album', priceLabel: '+$650' },
  { id: 'a-rehearsal', name: 'Rehearsal Dinner Coverage', priceLabel: '+$500' },
  { id: 'a-rush', name: '48-Hour Rush Editing', priceLabel: '+$250' },
]
