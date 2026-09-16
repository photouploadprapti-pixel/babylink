import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class names with conflict resolution.
 * @param inputs - Class name values to combine
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as USD currency.
 * @param value - Amount to format
 */
export const formatMoney = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

/**
 * Human-readable label for listing/deal types.
 * @param type - sell | exchange | rent
 */
export const listingTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    sell: 'For sale',
    exchange: 'Exchange',
    rent: 'For rent',
  }
  return map[type] ?? type
}

/**
 * Human-readable condition label.
 * @param condition - Listing condition key
 */
export const conditionLabel = (condition: string) => {
  const map: Record<string, string> = {
    new: 'New',
    like_new: 'Like new',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  }
  return map[condition] ?? condition
}
