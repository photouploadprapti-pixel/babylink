import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicConfig } from '@/lib/supabase/config'

/**
 * Creates a server Supabase client bound to request cookies.
 * Returns null when env vars are missing so pages can degrade gracefully.
 */
export const createClient = async () => {
  const config = getSupabasePublicConfig()
  if (!config) return null

  const cookieStore = await cookies()

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Called from a Server Component — middleware will refresh sessions.
        }
      },
    },
  })
}

/**
 * Creates a server client or throws when Supabase is not configured.
 * Use in mutations/API routes that require Supabase.
 */
export const requireClient = async () => {
  const client = await createClient()
  if (!client) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return client
}
