import { redirect } from 'next/navigation'
import { DealStatusActions } from '@/components/deal-status-actions'
import { createClient } from '@/lib/supabase/server'
import { formatMoney, listingTypeLabel } from '@/lib/utils'
import type { Deal } from '@/types'

/**
 * Admin dashboard showing every platform transaction.
 */
export default async function AdminPage() {
  const supabase = await createClient()
  if (!supabase) redirect('/auth/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ count: listingCount }, { count: userCount }, { data: deals }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('deals')
      .select(`
        *,
        listings:listing_id(title, image_url, listing_type, price),
        buyer:buyer_id(full_name, email),
        seller:seller_id(full_name, email)
      `)
      .order('created_at', { ascending: false }),
  ])

  const allDeals = (deals ?? []) as Deal[]
  const completed = allDeals.filter((deal) => deal.status === 'completed').length
  const pending = allDeals.filter((deal) => deal.status === 'pending').length

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">Admin overview</h1>
      <p className="mt-2 text-teal-900/65">
        Every deal on LantaShare is visible here for oversight.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Parents" value={String(userCount ?? 0)} />
        <Tile label="Listings" value={String(listingCount ?? 0)} />
        <Tile label="Pending deals" value={String(pending)} />
        <Tile label="Completed deals" value={String(completed)} />
      </div>

      <h2 className="mt-12 font-display text-2xl text-teal-950">All transactions</h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border border-teal-900/10 bg-white/70">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-teal-900/10 text-teal-900/60">
            <tr>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Parties</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allDeals.map((deal) => (
              <tr key={deal.id} className="border-b border-teal-900/5 align-top">
                <td className="px-4 py-3 text-teal-950">
                  {deal.listings?.title || 'Listing'}
                  {deal.admin_notes ? (
                    <p className="mt-1 text-xs text-teal-900/55">Note: {deal.admin_notes}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{listingTypeLabel(deal.deal_type)}</td>
                <td className="px-4 py-3">
                  <div>Buyer: {deal.buyer?.full_name || deal.buyer?.email}</div>
                  <div>Seller: {deal.seller?.full_name || deal.seller?.email}</div>
                </td>
                <td className="px-4 py-3">{formatMoney(deal.amount)}</td>
                <td className="px-4 py-3 capitalize">{deal.status.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <DealStatusActions dealId={deal.id} status={deal.status} isAdmin />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!allDeals.length ? (
          <p className="px-4 py-8 text-center text-teal-900/60">No transactions yet.</p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Admin metric tile.
 */
const Tile = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-2xl border border-teal-900/10 bg-white/70 p-4">
      <p className="text-sm text-teal-900/60">{label}</p>
      <p className="mt-1 font-display text-2xl text-teal-950">{value}</p>
    </div>
  )
}
