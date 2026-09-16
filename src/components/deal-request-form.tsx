'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { actionCreateDeal } from '@/actions/listings'
import { cn } from '@/lib/utils'

interface DealRequestFormProps {
  listingId: string
  listingType: string
  price: number | null
}

/**
 * Lets a parent request a buy/rent/exchange deal on a listing.
 */
export const DealRequestForm = ({ listingId, listingType, price }: DealRequestFormProps) => {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState(price != null ? String(price) : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /**
   * Submits a deal request through the platform.
   */
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const result = await actionCreateDeal(
      listingId,
      message,
      amount ? Number(amount) : null
    )

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push('/deals')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-teal-900/10 bg-white/70 p-4">
      <h3 className="font-medium text-teal-950">Request a {listingType} deal</h3>
      <p className="text-sm text-teal-900/65">
        The deal stays on BabyLink so admins can see the full transaction history.
      </p>
      {listingType !== 'exchange' ? (
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-teal-900/15 bg-white px-3 py-2 text-sm"
          placeholder="Offer amount"
        />
      ) : null}
      <textarea
        required
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-xl border border-teal-900/15 bg-white px-3 py-2 text-sm"
        placeholder="Introduce yourself and propose pickup / meetup details"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          'rounded-full bg-teal-800 px-4 py-2 text-sm text-[#f7f3eb]',
          'hover:bg-teal-900 disabled:opacity-60'
        )}
      >
        {loading ? 'Sending…' : 'Send deal request'}
      </button>
    </form>
  )
}
