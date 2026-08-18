/**
 * Storage abstraction layer.
 *
 * Currently backed by `localStorage` but designed so the adapter can be
 * swapped for a real backend / cloud storage without touching any dashboard
 * or booking logic — only this file needs to change.
 *
 * Future replacement: implement `StorageAdapter` using fetch/REST, Supabase,
 * Firebase, or any other backend and call `setStorageAdapter(myAdapter)` once
 * at app startup.
 */

export interface StorageAdapter {
  /** Read a value by key. Returns `null` if absent. */
  get<T>(key: string): T | null
  /** Write a value by key. */
  set<T>(key: string, value: T): void
  /** Remove a key. */
  remove(key: string): void
}

// ─── Default adapter: localStorage ──────────────────────────────────────────

class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.warn('[storage] Failed to write key:', key)
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // silently ignore
    }
  }
}

// ─── Active adapter (injectable) ────────────────────────────────────────────

let _adapter: StorageAdapter = new LocalStorageAdapter()

/**
 * Replace the default localStorage adapter with a custom one.
 * Call this once at app startup before any booking/portfolio operations.
 *
 * @example
 * setStorageAdapter(new SupabaseStorageAdapter(client))
 */
export function setStorageAdapter(adapter: StorageAdapter): void {
  _adapter = adapter
}

export const storage: StorageAdapter = {
  get: <T,>(key: string) => _adapter.get<T>(key),
  set: <T,>(key: string, value: T) => _adapter.set<T>(key, value),
  remove: (key: string) => _adapter.remove(key),
}

// ─── Typed storage keys ──────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  bookings: 'ga_bookings',
  portfolioImages: 'ga_portfolio_images',
  portfolioCategories: 'ga_portfolio_categories',
  locations: 'ga_locations',
  blockedDates: 'ga_blocked_dates',
  deletedStaticImages: 'ga_deleted_static_images',
  deletedCategories: 'ga_deleted_categories',
} as const
