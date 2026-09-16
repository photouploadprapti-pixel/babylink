import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/**
 * Creates a browser Supabase client for client components.
 */
export const createClient = () => {
  const config = getSupabasePublicConfig()
  if (!config) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return createBrowserClient(config.url, config.key)
}
