import { redirect } from 'next/navigation'
import { ListingCard } from '@/components/listing-card'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/types'

/**
 * Shows all listings owned by the current parent.
 */
export default async function MyListingsPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const listings = (data ?? []) as Listing[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">My listings</h1>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {!listings.length ? (
        <p className="mt-8 text-sm text-teal-900/60">No listings yet.</p>
      ) : null}
    </div>
  )
}
