/**
 * Location data — city-specific, 4 per city.
 *
 * These are temporary placeholder names. They will be replaced with real
 * venues via the dashboard's Availability → Locations management panel.
 *
 * The runtime-managed locations (added/renamed/deleted in the dashboard) are
 * stored in the storage adapter under STORAGE_KEYS.locations and merged with
 * these defaults at runtime.
 */

export interface Location {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  /** Session price at this location in USD */
  price?: number
}

export type CityId = 'baghdad' | 'erbil'

/** Default (seed) locations per city. */
export const DEFAULT_LOCATIONS: Record<CityId, Location[]> = {
  baghdad: [
    {
      id: 'zawraa',
      name: 'Al-Zawraa Park',
      nameAr: 'حديقة الزوراء',
      description: 'Lush green gardens with elegant pathways',
      descriptionAr: 'حدائق خضراء مع ممرات أنيقة',
      price: 150,
    },
    {
      id: 'rasheed',
      name: 'Al-Rasheed Street',
      nameAr: 'شارع الرشيد',
      description: 'Historic architecture and timeless character',
      descriptionAr: 'عمارة تاريخية وطابع خالد',
      price: 180,
    },
    {
      id: 'jadriya',
      name: 'Jadriya Corniche',
      nameAr: 'كورنيش الجادرية',
      description: 'Riverside views with golden hour light',
      descriptionAr: 'إطلالات نهرية مع ضوء الساعة الذهبية',
      price: 220,
    },
    {
      id: 'abu-nuwas',
      name: 'Abu Nuwas Promenade',
      nameAr: 'ممشى أبو نواس',
      description: 'Waterfront elegance along the Tigris',
      descriptionAr: 'أناقة على ضفاف دجلة',
      price: 200,
    },
  ],
  erbil: [
    {
      id: 'citadel',
      name: 'Erbil Citadel',
      nameAr: 'قلعة أربيل',
      description: 'Ancient hilltop fortress with panoramic views',
      descriptionAr: 'قلعة قديمة على تل مع إطلالات بانورامية',
      price: 250,
    },
    {
      id: 'sami-park',
      name: 'Sami Abdul Rahman Park',
      nameAr: 'حديقة سامي عبد الرحمن',
      description: 'Vast green park in the heart of Erbil',
      descriptionAr: 'حديقة خضراء واسعة في قلب أربيل',
      price: 160,
    },
    {
      id: 'zawita',
      name: 'Zawita Valley',
      nameAr: 'وادي زاويتا',
      description: 'Lush mountain valley with natural streams',
      descriptionAr: 'وادي جبلي خضر مع جداول طبيعية',
      price: 280,
    },
    {
      id: 'shanidar',
      name: 'Shanidar Park',
      nameAr: 'حديقة شانيدر',
      description: 'Serene gardens with mountain backdrop',
      descriptionAr: 'حدائق هادئة مع خلفية جبلية',
      price: 190,
    },
  ],
}

/**
 * Get locations for a city — merges defaults with any custom locations
 * added by the photographer in the dashboard.
 *
 * @param cityId 'baghdad' | 'erbil'
 * @param overrides Optional override array from storage (dashboard-managed)
 */
export function getLocationsForCity(
  cityId: CityId,
  overrides?: Location[],
): Location[] {
  if (overrides && overrides.length > 0) return overrides
  return DEFAULT_LOCATIONS[cityId] ?? []
}
