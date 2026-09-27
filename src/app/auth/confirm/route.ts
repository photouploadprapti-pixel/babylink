import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Exchanges a Supabase email token for a session, then opens the reset screen.
 * @param request - Incoming confirm link from the recovery email
 */
export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/reset-password'
  const redirectTo = request.nextUrl.clone()
  redirectTo.search = ''

  const safeNext = next.startsWith('/') ? next : '/auth/reset-password'
  const supabase = await createClient()

  if (!supabase) {
    redirectTo.pathname = '/auth/forgot-password'
    redirectTo.searchParams.set('error', 'config')
    return NextResponse.redirect(redirectTo)
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) {
      redirectTo.pathname = safeNext
      return NextResponse.redirect(redirectTo)
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const isSignup = type === 'signup' || type === 'email'
      redirectTo.pathname = isSignup ? '/dashboard' : '/auth/reset-password'
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = '/auth/forgot-password'
  redirectTo.searchParams.set('error', 'expired')
  return NextResponse.redirect(redirectTo)
}
