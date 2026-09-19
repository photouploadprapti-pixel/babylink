import Link from 'next/link'
import { Baby } from 'lucide-react'
import { actionSignOut } from '@/actions/listings'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

/**
 * Site header with navigation based on auth and role.
 */
export const SiteHeader = async () => {
  let user: { id: string; email?: string | null } | null = null
  let role: string | null = null
  let fullName: string | null = null

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase.auth.getUser()
      user = data.user

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single()
        role = profile?.role ?? null
        fullName = profile?.full_name ?? null
      }
    }
  } catch (error) {
    console.error('SiteHeader auth lookup failed', error)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-teal-900/10 bg-[#f7f3eb]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-xl text-teal-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-800 text-cream">
            <Baby className="h-5 w-5" />
          </span>
          LantaShare
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-teal-950/80 md:flex">
          <Link href="/browse" className="hover:text-teal-800">
            Browse
          </Link>
          {user ? (
            <>
              <Link href="/listings/new" className="hover:text-teal-800">
                List an item
              </Link>
              <Link href="/deals" className="hover:text-teal-800">
                My deals
              </Link>
              <Link href="/dashboard" className="hover:text-teal-800">
                Dashboard
              </Link>
              {role === 'admin' ? (
                <Link href="/admin" className="hover:text-teal-800">
                  Admin
                </Link>
              ) : null}
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-teal-900/70 sm:inline">
                {fullName || user.email}
              </span>
              <form action={actionSignOut}>
                <button
                  type="submit"
                  className={cn(
                    'rounded-full border border-teal-900/20 px-3 py-1.5 text-sm',
                    'text-teal-950 hover:bg-teal-900/5'
                  )}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-3 py-1.5 text-sm text-teal-950 hover:bg-teal-900/5"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-teal-800 px-3 py-1.5 text-sm text-[#f7f3eb] hover:bg-teal-900"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
