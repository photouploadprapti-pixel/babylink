export type UserRole = 'parent' | 'admin'

export type ListingType = 'sell' | 'exchange' | 'rent'

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'

export type ListingStatus = 'active' | 'reserved' | 'completed' | 'archived'

export type DealStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  city: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  owner_id: string
  title: string
  description: string
  category: string
  brand: string | null
  condition: ListingCondition
  age_range: string | null
  listing_type: ListingType
  price: number | null
  rent_period: string | null
  exchange_notes: string | null
  city: string | null
  image_url: string | null
  image_paths: string[] | null
  enrichment: ListingEnrichment | null
  status: ListingStatus
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name' | 'city' | 'email'> | null
}

export interface Deal {
  id: string
  listing_id: string
  seller_id: string
  buyer_id: string
  deal_type: ListingType
  amount: number | null
  currency: string
  message: string | null
  status: DealStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  listings?: Pick<Listing, 'title' | 'image_url' | 'listing_type' | 'price'> | null
  buyer?: Pick<Profile, 'full_name' | 'email'> | null
  seller?: Pick<Profile, 'full_name' | 'email'> | null
}

export interface ListingEnrichment {
  source: 'google_vision' | 'serpapi_lens' | 'heuristic'
  bestGuess?: string
  title?: string
  description?: string
  category?: string
  brand?: string
  ageRange?: string
  condition?: ListingCondition
  suggestedPrice?: number | null
  webEntities?: string[]
  similarImageUrls?: string[]
  labels?: string[]
  rawSummary?: string
}

export const BABY_CATEGORIES = [
  'stroller',
  'car_seat',
  'crib',
  'high_chair',
  'clothing',
  'toys',
  'feeding',
  'diapering',
  'bath',
  'carrier',
  'monitor',
  'other',
] as const

export type BabyCategory = (typeof BABY_CATEGORIES)[number]
