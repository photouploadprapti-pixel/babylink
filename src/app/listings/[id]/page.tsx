import Image from 'next/image'
import { notFound } from 'next/navigation'
import { DealRequestForm } from '@/components/deal-request-form'
import { createClient } from '@/lib/supabase/server'
import { conditionLabel, formatMoney, listingTypeLabel } from '@/lib/utils'
import type { Listing } from '@/types'

interface ListingDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Listing detail page with deal request form.
 */
export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles:owner_id(full_name, city, email)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const item = listing as Listing
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOwner = user?.id === item.owner_id

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-teal-50">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 60vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-teal-900/40">No photo</div>
          )}
        </div>
        <h1 className="mt-6 font-display text-4xl text-teal-950">{item.title}</h1>
        <p className="mt-2 text-teal-900/65">
          {listingTypeLabel(item.listing_type)} · {conditionLabel(item.condition)}
          {item.city ? ` · ${item.city}` : ''}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-teal-950/90">{item.description}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Brand" value={item.brand || '—'} />
          <Meta label="Category" value={item.category.replace('_', ' ')} />
          <Meta label="Age range" value={item.age_range || '—'} />
          <Meta
            label="Price"
            value={
              item.listing_type === 'exchange'
                ? item.exchange_notes || 'Open exchange'
                : item.listing_type === 'rent'
                  ? `${formatMoney(item.price)} / ${item.rent_period || 'week'}`
                  : formatMoney(item.price)
            }
          />
          <Meta label="Listed by" value={item.profiles?.full_name || 'Parent'} />
        </dl>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-teal-900/10 bg-white/70 p-4">
          <p className="text-sm text-teal-900/60">Asking</p>
          <p className="font-display text-3xl text-teal-950">
            {item.listing_type === 'exchange' ? 'Exchange' : formatMoney(item.price)}
          </p>
        </div>

        {user && !isOwner && item.status === 'active' ? (
          <DealRequestForm
            listingId={item.id}
            listingType={item.listing_type}
            price={item.price}
          />
        ) : null}

        {!user ? (
          <p className="rounded-2xl border border-teal-900/10 bg-white/70 p-4 text-sm text-teal-900/70">
            <a href="/auth/login" className="font-medium text-teal-800 hover:underline">
              Log in
            </a>{' '}
            to request a deal on this listing.
          </p>
        ) : null}

        {isOwner ? (
          <p className="rounded-2xl border border-teal-900/10 bg-white/70 p-4 text-sm text-teal-900/70">
            This is your listing. Incoming deal requests appear under My deals.
          </p>
        ) : null}
      </aside>
    </div>
  )
}

/**
 * Simple labeled metadata row.
 */
const Meta = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-xl bg-white/60 px-3 py-2">
      <dt className="text-teal-900/55">{label}</dt>
      <dd className="font-medium text-teal-950">{value}</dd>
    </div>
  )
}
