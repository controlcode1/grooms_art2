import { storage, STORAGE_KEYS } from '@/lib/storage'
import { supabase } from '@/lib/supabase/client'

export type PortfolioCategory = string

export interface PortfolioImage {
  id: string
  slug: string
  title: string
  alt: string
  category: PortfolioCategory
  partOfFullDay: boolean
  orientation: 'landscape' | 'portrait'
  exif: {
    camera: string
    lens: string
    focalLength: string
    aperture: string
    shutter: string
    iso: string
  }
  dbId?: string       // Supabase UUID for deletion
  storagePath?: string // Supabase storage path
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

export const staticPortfolioImages: PortfolioImage[] = Array.from(
  { length: 30 },
  (_, i) => {
    const num = String(i + 1).padStart(2, '0')
    const id = `frame-${num}`
    const title = TITLES[id] ?? `Chapter ${num}`
    const category: PortfolioCategory = PORTRAIT_FRAMES.has(id)
      ? 'portrait'
      : 'wedding'
    return {
      id,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title,
      alt: `${title} — editorial elopement session in the highlands, natural light`,
      category,
      partOfFullDay: true,
      orientation: id === 'frame-30' ? 'portrait' : 'landscape',
      exif: {
        camera: 'Sony A7 IV',
        lens: '35mm f/1.4 GM',
        focalLength: '35mm',
        aperture: i % 3 === 0 ? 'f/1.8' : 'f/2.2',
        shutter: i % 2 === 0 ? '1/500s' : '1/1000s',
        iso: i % 4 === 0 ? 'ISO 100' : 'ISO 200',
      },
    }
  },
)

// ─── Dynamic Getters (Interfacing with storage) ──────────────────────────────

/**
 * Load all portfolio categories dynamically.
 * Combines base static categories with any custom ones managed in the dashboard.
 */
export function getPortfolioCategories(): CategoryInfo[] {
  const custom = storage.get<CategoryInfo[]>(STORAGE_KEYS.portfolioCategories) || []
  const all = [...DEFAULT_CATEGORIES]
  // Add any custom ones not already in defaults
  custom.forEach((c) => {
    if (!all.some((existing) => existing.id === c.id)) {
      all.push(c)
    }
  })
  return all
}

/**
 * Save custom portfolio categories.
 */
export function savePortfolioCategories(categories: CategoryInfo[]): void {
  storage.set(STORAGE_KEYS.portfolioCategories, categories)
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
    /^frame-\d{2}$/.test(id)
  )
}

/**
 * Get all portfolio images, combining static and dynamically uploaded ones.
 * Automatically prunes orphaned entries whose ids cannot be resolved to a
 * real asset, and persists the cleaned list back to storage so the bad
 * entries don't accumulate across reloads.
 */
export function getPortfolioImages(): PortfolioImage[] {
  const custom = storage.get<PortfolioImage[]>(STORAGE_KEYS.portfolioImages) || []

  // Drop any entry whose id is an unresolvable legacy format (e.g. upload-*).
  const valid = custom.filter((img) => isValidImageId(img.id))

  // Self-heal: persist the cleaned list so orphans don't persist across reloads.
  if (valid.length !== custom.length) {
    storage.set(STORAGE_KEYS.portfolioImages, valid)
  }

  return [...valid, ...staticPortfolioImages]
}

/**
 * Save custom uploaded portfolio images.
 */
export function savePortfolioImages(images: PortfolioImage[]): void {
  storage.set(STORAGE_KEYS.portfolioImages, images)
}

// Keep the legacy export for compatibility where needed, but it's recommended to call getPortfolioImages()
export const portfolioImages = staticPortfolioImages

export function getPublicUrl(storagePath: string): string {
  if (!supabase) return ''
  const { data } = supabase.storage.from('portfolio').getPublicUrl(storagePath)
  return data.publicUrl
}

export function imageSrcSet(id: string) {
  // If id is a base64, blob, or custom HTTP public URL, return it directly for all sizes
  if (
    id.startsWith('data:') ||
    id.startsWith('blob:') ||
    id.startsWith('http:') ||
    id.startsWith('https:')
  ) {
    return {
      sm: id,
      md: id,
      lg: id,
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
