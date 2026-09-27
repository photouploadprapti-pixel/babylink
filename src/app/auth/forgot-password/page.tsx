'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Asks Supabase to email a password recovery link.
 */
const ForgotPasswordForm = () => {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const linkError = searchParams.get('error')

  /**
   * Sends the reset email and points the link at the reset screen.
   * @param event - Form submit event
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      setLoading(false)
      if (resetError) {
        setError(resetError.message)
        return
      }
      setInfo('If that email has an account, a reset link is on its way.')
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : 'Could not send the reset email')
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-3xl border border-teal-900/10 bg-white/70 p-6"
    >
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
        />
      </label>
      {linkError === 'expired' ? (
        <p className="text-sm text-red-700">That reset link expired. Request a new one.</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {info ? <p className="text-sm text-teal-800">{info}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full rounded-full bg-teal-800 py-2.5 text-sm text-[#f7f3eb]',
          'hover:bg-teal-900 disabled:opacity-60'
        )}
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-center text-sm text-teal-900/65">
        <Link href="/auth/login" className="font-medium text-teal-800 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  )
}

/**
 * Password reset request page.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-center font-display text-4xl text-teal-950">Reset password</h1>
      <p className="mt-2 text-center text-teal-900/65">
        We will email you a link that opens the new-password screen.
      </p>
      <Suspense fallback={<p className="mt-8 text-center text-sm">Loading…</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
