import { ListingCard } from '@/components/listing-card'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/types'

interface BrowsePageProps {
  searchParams: Promise<{ type?: string; q?: string }>
}

/**
 * Browse and filter active listings.
 */
export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams
  let listings: Listing[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (params.type && ['sell', 'exchange', 'rent'].includes(params.type)) {
        query = query.eq('listing_type', params.type)
      }

      if (params.q) {
        query = query.or(
          `title.ilike.%${params.q}%,description.ilike.%${params.q}%,brand.ilike.%${params.q}%`
        )
      }

      const { data } = await query
      listings = (data ?? []) as Listing[]
    }
  } catch (error) {
    console.error('Browse listings fetch failed', error)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">Browse baby gear</h1>
      <p className="mt-2 text-teal-900/65">Find items to buy, rent, or exchange from other parents.</p>

      <form className="mt-6 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search strollers, cribs, toys…"
          className="min-w-[220px] flex-1 rounded-full border border-teal-900/15 bg-white/80 px-4 py-2.5 text-sm"
        />
        <select
          name="type"
          defaultValue={params.type ?? ''}
          className="rounded-full border border-teal-900/15 bg-white/80 px-4 py-2.5 text-sm"
        >
          <option value="">All types</option>
          <option value="sell">Sell</option>
          <option value="rent">Rent</option>
          <option value="exchange">Exchange</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-teal-800 px-4 py-2.5 text-sm text-[#f7f3eb]"
        >
          Filter
        </button>
      </form>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {!listings.length ? (
        <p className="mt-10 text-center text-sm text-teal-900/60">No listings match your filters.</p>
      ) : null}
    </div>
  )
}
