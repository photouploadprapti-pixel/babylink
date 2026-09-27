'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CityCombobox } from '@/components/city-combobox'
import { PasswordField } from '@/components/password-field'
import { createClient } from '@/lib/supabase/client'
import { THAILAND_CITIES } from '@/lib/thailand-cities'
import { cn } from '@/lib/utils'

/**
 * Turns low-level auth network errors into a readable message.
 * @param message - Error text from Supabase or the browser
 */
const authErrorMessage = (message: string) => {
  if (message === 'Failed to fetch' || message.includes('NetworkError')) {
    return (
      'Could not reach Supabase. The linked project is offline or was deleted, ' +
      'so the account was not created. Restore the project or add a new project URL and key.'
    )
  }
  return message
}

/**
 * Parent signup page. Creates a Supabase auth user and stores the profile city.
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
   * Registers a new parent account and saves name plus city on the profile.
   * @param event - Signup form submit event
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')

    const knownCity = THAILAND_CITIES.find(
      (item) => item.toLowerCase() === city.trim().toLowerCase()
    )
    if (!knownCity) {
      setError('Choose a city in Thailand from the suggestions.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            full_name: fullName,
            role: 'parent',
            city: knownCity,
          },
        },
      })

      if (signUpError) {
        setLoading(false)
        setError(authErrorMessage(signUpError.message))
        return
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: fullName, city: knownCity })
          .eq('id', data.user.id)

        if (profileError) {
          setLoading(false)
          setError(profileError.message)
          return
        }
      }

      setLoading(false)

      if (!data.session) {
        setInfo('Account created. Check your email to confirm it, then log in.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setLoading(false)
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(authErrorMessage(message))
    }
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
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5"
          />
        </label>
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
        <label className="block space-y-1 text-sm">
          <span>Password</span>
          <PasswordField
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>City in Thailand</span>
          <CityCombobox required value={city} onChange={setCity} />
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
