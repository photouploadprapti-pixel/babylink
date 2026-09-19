'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Parent signup page.
 */
export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Registers a new parent account.
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'parent',
        },
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName, city })
        .eq('id', data.user.id)
    }

    setLoading(false)

    if (!data.session) {
      setInfo('Check your email to confirm your account, then log in.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-center font-display text-4xl text-teal-950">Join LantaShare</h1>
      <p className="mt-2 text-center text-teal-900/65">
        Create a parent account to list and request baby gear deals.
      </p>

      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-3xl border border-teal-900/10 bg-white/70 p-6"
      >
        <label className="block space-y-1 text-sm">
          <span>Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
          />
        </label>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
          />
        </label>
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
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-center text-sm text-teal-900/65">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-teal-800 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
