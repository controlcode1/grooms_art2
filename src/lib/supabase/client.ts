import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[grooms-art] Supabase env vars are not set. Booking, auth, and the ' +
      'admin dashboard will run against mock data until VITE_SUPABASE_URL ' +
      'and VITE_SUPABASE_ANON_KEY are configured in .env.local.',
  )
}

/**
 * Shared Supabase client for browser + SSR loader usage.
 * Falls back to a disabled state (isConfigured=false) when env vars are
 * missing, so the public site can run fully on mock data during early
 * development.
 */
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const isSupabaseConfigured = isConfigured
