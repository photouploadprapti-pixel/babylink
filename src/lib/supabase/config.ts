/**
 * Returns true when public Supabase env vars are present.
 */
export const isSupabaseConfigured = () => {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Reads required public Supabase config or null when unset.
 */
export const getSupabasePublicConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url, key }
}
