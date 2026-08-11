import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

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
 * Deterministic mock availability generator — used until a Supabase
 * `availability_blocks` table is connected (see supabase/schema.sql).
 * Weekends bias toward "limited", a fixed subset renders "unavailable" so the
 * date picker demonstrates all three states.
 */
function mockAvailability(isoDate: string): AvailabilityStatus {
  const date = new Date(`${isoDate}T00:00:00`)
  const day = date.getDay()
  const dayOfMonth = date.getDate()

  if (dayOfMonth % 7 === 0) return 'unavailable'
  if (day === 5 || day === 6) return 'limited'
  return 'available'
}

export async function getAvailabilityForMonth(
  year: number,
  month: number, // 0-indexed
): Promise<Record<string, AvailabilityStatus>> {
  if (isSupabaseConfigured && supabase) {
    const from = toLocalISODate(new Date(year, month, 1))
    const to = toLocalISODate(new Date(year, month + 1, 0))
    const { data, error } = await supabase
      .from('availability_blocks')
      .select('date, status')
      .gte('date', from)
      .lte('date', to)

    if (!error && data) {
      return Object.fromEntries(
        data.map((row: { date: string; status: AvailabilityStatus }) => [
          row.date,
          row.status,
        ]),
      )
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result: Record<string, AvailabilityStatus> = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toLocalISODate(new Date(year, month, d))
    result[iso] = mockAvailability(iso)
  }
  return result
}
