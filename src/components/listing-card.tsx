import Link from 'next/link'
import Image from 'next/image'
import type { Listing } from '@/types'
import { conditionLabel, cn, formatMoney, listingTypeLabel } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
}

/**
 * Interactive listing card used in browse grids.
 * @param listing - Listing record to display
 */
export const ListingCard = ({ listing }: ListingCardProps) => {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-teal-900/10 bg-white/70',
        'transition hover:-translate-y-0.5 hover:border-teal-800/30 hover:shadow-md'
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-teal-50">
        {listing.image_url ? (
          <Image
            src={listing.image_url}
            alt={listing.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-teal-900/40">
            No photo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-teal-900/85 px-2.5 py-1 text-xs text-[#f7f3eb]">
          {listingTypeLabel(listing.listing_type)}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="line-clamp-1 font-medium text-teal-950">{listing.title}</h3>
        <p className="text-sm text-teal-900/65">
          {conditionLabel(listing.condition)}
          {listing.city ? ` · ${listing.city}` : ''}
        </p>
        <p className="text-sm font-semibold text-teal-800">
          {listing.listing_type === 'exchange'
            ? 'Open to exchange'
            : listing.listing_type === 'rent'
              ? `${formatMoney(listing.price)} / ${listing.rent_period || 'week'}`
              : formatMoney(listing.price)}
        </p>
      </div>
    </Link>
  )
}
