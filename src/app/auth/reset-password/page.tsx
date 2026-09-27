'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PasswordField } from '@/components/password-field'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Sets a new password after Supabase verifies the recovery link.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    /**
     * Turns the email link into a session that can update the password.
     */
    const prepareSession = async () => {
      const search = new URLSearchParams(window.location.search)
      const code = search.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError('This reset link is invalid or has expired.')
          setChecking(false)
          return
        }
        window.history.replaceState({}, '', '/auth/reset-password')
      }

      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setError('Open the reset link from your email, or request a new one.')
        setChecking(false)
        return
      }

      setReady(true)
      setChecking(false)
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
        setChecking(false)
        setError('')
      }
    })

    void prepareSession()

    return () => subscription.subscription.unsubscribe()
  }, [])

  /**
   * Saves the new password through Supabase Auth.
   * @param event - Form submit event
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Use at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-center font-display text-4xl text-teal-950">Choose a new password</h1>
      <p className="mt-2 text-center text-teal-900/65">
        This updates the password stored in Supabase for your account.
      </p>

      {checking ? <p className="mt-8 text-center text-sm">Checking your reset link…</p> : null}

      {ready ? (
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-3xl border border-teal-900/10 bg-white/70 p-6"
        >
          <label className="block space-y-1 text-sm">
            <span>New password</span>
            <PasswordField
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Confirm password</span>
            <PasswordField
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full rounded-full bg-teal-800 py-2.5 text-sm text-[#f7f3eb]',
              'hover:bg-teal-900 disabled:opacity-60'
            )}
          >
            {loading ? 'Saving…' : 'Update password'}
          </button>
        </form>
      ) : null}

      {!checking && error && !ready ? (
        <div className="mx-auto mt-8 max-w-md text-center">
          <p className="text-sm text-red-700">{error}</p>
          <Link
            href="/auth/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-teal-800 hover:underline"
          >
            Request a new link
          </Link>
        </div>
      ) : null}
    </div>
  )
}
