import { supabase } from '@/lib/supabase/client'

export interface PackageFeatureGroup {
  title: string
  title_ar?: string
  items: string[]
  items_ar?: string[]
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
    const { data, error } = await supabase
      .from('packages')
      .upsert(pkg, { onConflict: 'city,service,package_key' })
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
