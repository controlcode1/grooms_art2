import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { BookingState } from './types'

export async function submitBooking(state: BookingState): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('bookings').insert({
      package_id: state.packageId,
      date: state.date,
      type: 'session',
      status: 'pending',
    })
    if (error) throw error
    return
  }

  // Mock submission until Supabase is connected — simulates network latency
  // and an occasional failure so the error/retry UI can be exercised.
  await new Promise((resolve) => setTimeout(resolve, 900))
  if (Math.random() < 0.12) {
    throw new Error('mock-network-error')
  }
}
