import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { storage, STORAGE_KEYS } from '@/lib/storage'

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable'

/**
 * Formats a Date as a local-timezone `YYYY-MM-DD` string. `toISOString()` is
 * deliberately avoided here — it converts to UTC first, which shifts the
 * date by one day for any timezone offset from UTC.
 */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Loads blocked and fully booked dates from Supabase `blocked_dates` table,
 * syncing with localStorage for offline resilience.
 */
export async function fetchBlockedDates(): Promise<{
  blocked: string[]
  fullyBooked: string[]
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('date, status')

      if (!error && data) {
        const blocked: string[] = []
        const fullyBooked: string[] = []

        data.forEach((row: { date: string; status: string }) => {
          if (row.status === 'fully_booked') {
            fullyBooked.push(row.date)
          }
          // All blocked or fully booked dates count as blocked for the calendar
          blocked.push(row.date)
        })

        // Sync to localStorage
        storage.set(STORAGE_KEYS.blockedDates, blocked.sort())
        storage.set('ga_fully_booked_dates', fullyBooked.sort())

        return { blocked: blocked.sort(), fullyBooked: fullyBooked.sort() }
      }
    } catch (err) {
      console.warn('[availability] Failed to fetch from Supabase, using storage cache:', err)
    }
  }

  // Fallback from localStorage
  const blocked = storage.get<string[]>(STORAGE_KEYS.blockedDates) || []
  const fullyBooked = storage.get<string[]>('ga_fully_booked_dates') || []
  return { blocked, fullyBooked }
}

/**
 * Persists a blocked or fully booked date to Supabase and localStorage.
 */
export async function saveBlockedDateInDb(
  date: string,
  status: 'blocked' | 'fully_booked' = 'blocked',
): Promise<void> {
  // Update localStorage immediately
  const blocked = storage.get<string[]>(STORAGE_KEYS.blockedDates) || []
  if (!blocked.includes(date)) {
    storage.set(STORAGE_KEYS.blockedDates, [...blocked, date].sort())
  }

  const fullyBooked = storage.get<string[]>('ga_fully_booked_dates') || []
  if (status === 'fully_booked') {
    if (!fullyBooked.includes(date)) {
      storage.set('ga_fully_booked_dates', [...fullyBooked, date].sort())
    }
  } else {
    storage.set('ga_fully_booked_dates', fullyBooked.filter((d) => d !== date))
  }

  // Persist to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .upsert({ date, status }, { onConflict: 'date' })
      if (error) {
        console.error('[availability] Error saving blocked date to Supabase:', error)
      }
    } catch (err) {
      console.error('[availability] Supabase error in saveBlockedDateInDb:', err)
    }
  }
}

/**
 * Removes a blocked date from Supabase and localStorage.
 */
export async function removeBlockedDateFromDb(date: string): Promise<void> {
  // Update localStorage immediately
  const blocked = storage.get<string[]>(STORAGE_KEYS.blockedDates) || []
  storage.set(STORAGE_KEYS.blockedDates, blocked.filter((d) => d !== date))

  const fullyBooked = storage.get<string[]>('ga_fully_booked_dates') || []
  storage.set('ga_fully_booked_dates', fullyBooked.filter((d) => d !== date))

  // Remove from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('date', date)
      if (error) {
        console.error('[availability] Error removing blocked date from Supabase:', error)
      }
    } catch (err) {
      console.error('[availability] Supabase error in removeBlockedDateFromDb:', err)
    }
  }
}

/**
 * Deterministic mock availability generator for dates not explicitly blocked.
 */
function mockAvailability(isoDate: string): AvailabilityStatus {
  const date = new Date(`${isoDate}T00:00:00`)
  const day = date.getDay()
  if (day === 5 || day === 6) return 'limited'
  return 'available'
}

export async function getAvailabilityForMonth(
  year: number,
  month: number, // 0-indexed
): Promise<Record<string, AvailabilityStatus>> {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result: Record<string, AvailabilityStatus> = {}

  // First fetch explicit blocked dates
  const { blocked } = await fetchBlockedDates()
  const blockedSet = new Set(blocked)

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toLocalISODate(new Date(year, month, d))
    if (blockedSet.has(iso)) {
      result[iso] = 'unavailable'
    } else {
      result[iso] = mockAvailability(iso)
    }
  }
  return result
}

