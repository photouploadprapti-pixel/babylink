import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ListingCard } from '@/components/listing-card'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/types'

/**
 * Parent dashboard with quick stats and own listings.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: listings }, { count: dealCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
  ])

  const ownListings = (listings ?? []) as Listing[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">
        Hi {profile?.full_name || 'parent'}
      </h1>
      <p className="mt-2 text-teal-900/65">Manage your listings and platform deals.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Your listings" value={String(ownListings.length)} />
        <Stat label="Your deals" value={String(dealCount ?? 0)} />
        <Stat label="Role" value={profile?.role ?? 'parent'} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/listings/new"
          className="rounded-full bg-teal-800 px-4 py-2 text-sm text-[#f7f3eb]"
        >
          New listing
        </Link>
        <Link
          href="/listings/mine"
          className="rounded-full border border-teal-900/20 px-4 py-2 text-sm text-teal-950"
        >
          All my listings
        </Link>
        <Link
          href="/deals"
          className="rounded-full border border-teal-900/20 px-4 py-2 text-sm text-teal-950"
        >
          My deals
        </Link>
      </div>

      <h2 className="mt-12 font-display text-2xl text-teal-950">Recent listings</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ownListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      {!ownListings.length ? (
        <p className="mt-6 text-sm text-teal-900/60">You have not listed anything yet.</p>
      ) : null}
    </div>
  )
}

/**
 * Compact dashboard metric tile.
 */
const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-2xl border border-teal-900/10 bg-white/70 p-4">
      <p className="text-sm text-teal-900/60">{label}</p>
      <p className="mt-1 font-display text-2xl text-teal-950">{value}</p>
    </div>
  )
}
