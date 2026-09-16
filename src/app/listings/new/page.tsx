import { ListingForm } from '@/components/listing-form'

/**
 * Create listing page with photo enrichment.
 */
export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl text-teal-950">List baby gear</h1>
      <p className="mt-2 text-teal-900/65">
        Upload a photo first — we reverse-search it and draft the listing fields for you.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </div>
  )
}
