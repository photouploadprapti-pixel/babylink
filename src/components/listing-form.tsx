'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Loader2, Sparkles, Upload } from 'lucide-react'
import type { ListingEnrichment, ListingCondition, ListingType } from '@/types'
import { BABY_CATEGORIES } from '@/types'
import { cn } from '@/lib/utils'
import { actionCreateListing } from '@/actions/listings'

/**
 * Listing form with photo upload and reverse-image auto-fill.
 */
export const ListingForm = () => {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('other')
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState<ListingCondition>('good')
  const [ageRange, setAgeRange] = useState('')
  const [listingType, setListingType] = useState<ListingType>('sell')
  const [price, setPrice] = useState('')
  const [rentPeriod, setRentPeriod] = useState('week')
  const [exchangeNotes, setExchangeNotes] = useState('')
  const [city, setCity] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [enrichment, setEnrichment] = useState<ListingEnrichment | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  /**
   * Uploads a photo to Supabase and populates fields from reverse image search.
   * @param file - Image file selected by the parent
   */
  const handlePhoto = async (file: File) => {
    setUploading(true)
    setError('')
    setInfo('')

    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/enrich-image', { method: 'POST', body })
      const payload = (await response.json()) as {
        error?: string
        imageUrl?: string
        imagePath?: string
        enrichment?: ListingEnrichment
        providersConfigured?: { googleVision: boolean; serpApi: boolean }
      }

      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Upload failed')
      }

      if (payload.imageUrl) setImageUrl(payload.imageUrl)
      if (payload.imagePath) setImagePath(payload.imagePath)

      const data = payload.enrichment
      if (data) {
        setEnrichment(data)
        if (data.title) setTitle(data.title)
        if (data.description) setDescription(data.description)
        if (data.category) setCategory(data.category)
        if (data.brand) setBrand(data.brand)
        if (data.ageRange) setAgeRange(data.ageRange)
        if (data.condition) setCondition(data.condition)
        if (data.suggestedPrice != null) setPrice(String(data.suggestedPrice))
      }

      const usingApi =
        payload.providersConfigured?.googleVision || payload.providersConfigured?.serpApi
      setInfo(
        usingApi
          ? `Fields filled from ${data?.source === 'serpapi_lens' ? 'Google Lens' : 'Google Vision'} reverse image search.`
          : 'Photo stored. Add GOOGLE_VISION_API_KEY or SERPAPI_KEY for full Google reverse-image auto-fill (heuristic suggestions applied).'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process photo')
    } finally {
      setUploading(false)
    }
  }

  /**
   * Persists the listing via server action.
   * @param event - Form submit event
   */
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const result = await actionCreateListing({
      title,
      description,
      category,
      brand,
      condition,
      age_range: ageRange,
      listing_type: listingType,
      price: price ? Number(price) : null,
      rent_period: rentPeriod,
      exchange_notes: exchangeNotes,
      city,
      image_url: imageUrl,
      image_paths: imagePath ? [imagePath] : [],
      enrichment: enrichment,
    })

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push(`/listings/${result.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section
        className={cn(
          'rounded-3xl border border-dashed border-teal-800/30 bg-white/60 p-6',
          'transition hover:border-teal-800/50'
        )}
      >
        <label className="flex cursor-pointer flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-800 text-[#f7f3eb]">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </span>
          <span className="font-medium text-teal-950">Upload a product photo</span>
          <span className="max-w-md text-sm text-teal-900/65">
            We store the image in Supabase and run a Google reverse image search to pre-fill your
            listing.
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handlePhoto(file)
            }}
          />
        </label>

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Listing preview"
            className="mt-4 mx-auto max-h-64 rounded-2xl object-cover"
          />
        ) : null}

        {info ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            {info}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. UPPAbaby Vista stroller"
          />
        </Field>
        <Field label="Brand">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
            placeholder="Brand"
          />
        </Field>
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {BABY_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Condition">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as ListingCondition)}
            className={inputClass}
          >
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </Field>
        <Field label="Age range">
          <input
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className={inputClass}
            placeholder="e.g. 0-6 months"
          />
        </Field>
        <Field label="City">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
            placeholder="Your city"
          />
        </Field>
        <Field label="Listing type">
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value as ListingType)}
            className={inputClass}
          >
            <option value="sell">Sell</option>
            <option value="exchange">Exchange</option>
            <option value="rent">Rent</option>
          </select>
        </Field>
        {listingType !== 'exchange' ? (
          <Field label={listingType === 'rent' ? 'Rent price' : 'Price'}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </Field>
        ) : null}
        {listingType === 'rent' ? (
          <Field label="Rent period">
            <select
              value={rentPeriod}
              onChange={(e) => setRentPeriod(e.target.value)}
              className={inputClass}
            >
              <option value="day">Per day</option>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
            </select>
          </Field>
        ) : null}
        {listingType === 'exchange' ? (
          <Field label="What will you accept in exchange?">
            <input
              value={exchangeNotes}
              onChange={(e) => setExchangeNotes(e.target.value)}
              className={inputClass}
              placeholder="e.g. Looking for a high chair"
            />
          </Field>
        ) : null}
      </div>

      <Field label="Description">
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          placeholder="Condition details, accessories included, pickup notes..."
        />
      </Field>

      {enrichment?.webEntities?.length ? (
        <div className="rounded-2xl bg-white/70 p-4 text-sm text-teal-900/80">
          <p className="mb-2 font-medium text-teal-950">Matched from image search</p>
          <div className="flex flex-wrap gap-2">
            {enrichment.webEntities.slice(0, 8).map((entity) => (
              <span
                key={entity}
                className="rounded-full border border-teal-900/10 bg-[#f7f3eb] px-2.5 py-1"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || uploading}
        className={cn(
          'rounded-full bg-teal-800 px-6 py-3 text-sm font-medium text-[#f7f3eb]',
          'hover:bg-teal-900 disabled:opacity-60'
        )}
      >
        {saving ? 'Publishing…' : 'Publish listing'}
      </button>
    </form>
  )
}

const inputClass = cn(
  'w-full rounded-xl border border-teal-900/15 bg-white/80 px-3 py-2.5 text-sm',
  'text-teal-950 outline-none ring-teal-700/30 focus:ring-2'
)

interface FieldProps {
  label: string
  children: import('react').ReactNode
}

/**
 * Labeled form field wrapper.
 * @param label - Visible field label
 * @param children - Input control
 */
const Field = ({ label, children }: FieldProps) => {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-teal-950">{label}</span>
      {children}
    </label>
  )
}
