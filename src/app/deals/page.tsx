import { DealStatusActions } from '@/components/deal-status-actions'
import { createClient } from '@/lib/supabase/server'
import { formatMoney, listingTypeLabel } from '@/lib/utils'
import type { Deal } from '@/types'

/**
 * Parent deals inbox — requests sent and received.
 */
export default async function DealsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('deals')
    .select(`
      *,
      listings:listing_id(title, image_url, listing_type, price),
      buyer:buyer_id(full_name, email),
      seller:seller_id(full_name, email)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const deals = (data ?? []) as Deal[]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">My deals</h1>
      <p className="mt-2 text-teal-900/65">
        All buy, rent, and exchange conversations stay on the platform.
      </p>

      <div className="mt-8 space-y-4">
        {deals.map((deal) => {
          const isSeller = deal.seller_id === user.id
          const isBuyer = deal.buyer_id === user.id
          return (
            <article
              key={deal.id}
              className="rounded-3xl border border-teal-900/10 bg-white/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-teal-950">
                    {deal.listings?.title || 'Listing'}
                  </h2>
                  <p className="text-sm text-teal-900/65">
                    {listingTypeLabel(deal.deal_type)} · {formatMoney(deal.amount)} ·{' '}
                    <span className="capitalize">{deal.status.replace('_', ' ')}</span>
                  </p>
                  <p className="mt-1 text-sm text-teal-900/65">
                    {isBuyer
                      ? `Seller: ${deal.seller?.full_name || deal.seller?.email}`
                      : `Buyer: ${deal.buyer?.full_name || deal.buyer?.email}`}
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs capitalize text-teal-900">
                  {isSeller ? 'Incoming' : 'Outgoing'}
                </span>
              </div>
              {deal.message ? (
                <p className="mt-3 rounded-xl bg-[#f7f3eb] px-3 py-2 text-sm text-teal-950/80">
                  {deal.message}
                </p>
              ) : null}
              <div className="mt-4">
                <DealStatusActions
                  dealId={deal.id}
                  status={deal.status}
                  canSellerAct={isSeller}
                  canBuyerAct={isBuyer}
                />
              </div>
            </article>
          )
        })}
      </div>

      {!deals.length ? (
        <p className="mt-10 text-sm text-teal-900/60">No deals yet.</p>
      ) : null}
    </div>
  )
}
