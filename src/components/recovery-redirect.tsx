'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Sends Supabase recovery links that land on the wrong URL to the reset screen.
 */
export const RecoveryRedirect = () => {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/auth/reset-password')) return

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const search = new URLSearchParams(window.location.search)
    const type = hash.get('type') || search.get('type')
    const isRecovery = type === 'recovery'

    if (!isRecovery) return

    window.location.replace(
      `/auth/reset-password${window.location.search}${window.location.hash}`
    )
  }, [pathname])

  return null
}
