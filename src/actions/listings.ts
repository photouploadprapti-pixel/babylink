'use server'

import { revalidatePath } from 'next/cache'
import { requireClient } from '@/lib/supabase/server'
import type {
  DealStatus,
  ListingCondition,
  ListingEnrichment,
  ListingType,
} from '@/types'

export interface ListingInput {
  title: string
  description: string
  category: string
  brand?: string
  condition: ListingCondition
  age_range?: string
  listing_type: ListingType
  price?: number | null
  rent_period?: string
  exchange_notes?: string
  city?: string
  image_url?: string
  image_paths?: string[]
  enrichment?: ListingEnrichment | null
}

/**
 * Creates a new listing for the authenticated parent.
 * @param input - Listing fields collected from the form
 */
export const actionCreateListing = async (input: ListingInput) => {
  const supabase = await requireClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to create a listing.' }
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      owner_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      brand: input.brand?.trim() ?? '',
      condition: input.condition,
      age_range: input.age_range?.trim() ?? '',
      listing_type: input.listing_type,
      price: input.price ?? null,
      rent_period: input.rent_period ?? 'week',
      exchange_notes: input.exchange_notes?.trim() ?? '',
      city: input.city?.trim() ?? '',
      image_url: input.image_url ?? null,
      image_paths: input.image_paths ?? [],
      enrichment: input.enrichment ?? {},
      status: 'active',
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/listings/mine')
  revalidatePath('/dashboard')
  return { id: data.id }
}

/**
 * Creates a deal request against an active listing.
 * @param listingId - Target listing id
 * @param message - Optional note to the seller
 * @param amount - Optional offered amount
 */
export const actionCreateDeal = async (
  listingId: string,
  message: string,
  amount?: number | null
) => {
  const supabase = await requireClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in to request a deal.' }
  }

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, owner_id, listing_type, price, status')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { error: 'Listing not found.' }
  }

  if (listing.owner_id === user.id) {
    return { error: 'You cannot open a deal on your own listing.' }
  }

  if (listing.status !== 'active') {
    return { error: 'This listing is no longer available.' }
  }

  const { data, error } = await supabase
    .from('deals')
    .insert({
      listing_id: listing.id,
      seller_id: listing.owner_id,
      buyer_id: user.id,
      deal_type: listing.listing_type,
      amount: amount ?? listing.price,
      message: message.trim(),
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from('listings').update({ status: 'reserved' }).eq('id', listing.id)

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/deals')
  revalidatePath('/admin')
  return { id: data.id }
}

/**
 * Updates deal status for a participant or admin.
 * @param dealId - Deal id
 * @param status - New status value
 * @param adminNotes - Optional admin-only notes
 */
export const actionUpdateDealStatus = async (
  dealId: string,
  status: DealStatus,
  adminNotes?: string
) => {
  const supabase = await requireClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const payload: Record<string, unknown> = { status }
  if (adminNotes != null) {
    payload.admin_notes = adminNotes
  }
  if (status === 'completed') {
    payload.completed_at = new Date().toISOString()
  }

  const { data: deal, error } = await supabase
    .from('deals')
    .update(payload)
    .eq('id', dealId)
    .select('id, listing_id, status')
    .single()

  if (error) {
    return { error: error.message }
  }

  if (status === 'completed') {
    await supabase
      .from('listings')
      .update({ status: 'completed' })
      .eq('id', deal.listing_id)
  }

  if (status === 'rejected' || status === 'cancelled') {
    await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', deal.listing_id)
  }

  revalidatePath('/deals')
  revalidatePath('/admin')
  return { ok: true }
}

/**
 * Signs the current user out.
 */
export const actionSignOut = async () => {
  const supabase = await requireClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
