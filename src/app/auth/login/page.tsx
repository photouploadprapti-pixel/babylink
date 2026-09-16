'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Login page content with email/password auth.
 */
const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Authenticates the parent and redirects.
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-3xl border border-teal-900/10 bg-white/70 p-6">
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Password</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
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
        {loading ? 'Signing in…' : 'Log in'}
      </button>
      <p className="text-center text-sm text-teal-900/65">
        New here?{' '}
        <Link href="/auth/signup" className="font-medium text-teal-800 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}

/**
 * Auth login page.
 */
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-center font-display text-4xl text-teal-950">Welcome back</h1>
      <p className="mt-2 text-center text-teal-900/65">Log in to list gear and manage your deals.</p>
      <Suspense fallback={<p className="mt-8 text-center text-sm">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
