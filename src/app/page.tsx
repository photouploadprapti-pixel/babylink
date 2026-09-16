import Link from 'next/link'
import { ArrowRight, Camera, Handshake, ShieldCheck } from 'lucide-react'
import { ListingCard } from '@/components/listing-card'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/types'

/**
 * Marketing home page with recent listings.
 */
export default async function HomePage() {
  let listings: Listing[] = []

  try {
    const supabase = await createClient()
    if (supabase) {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)
      listings = (data ?? []) as Listing[]
    }
  } catch (error) {
    console.error('Home listings fetch failed', error)
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(15,61,58,0.72), rgba(15,61,58,0.35)), url(https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1800&q=80)',
          }}
        />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 text-[#f7f3eb]">
          <p className="animate-rise font-display text-5xl leading-none tracking-tight md:text-7xl">
            BabyLink
          </p>
          <h1 className="animate-rise mt-4 max-w-2xl text-2xl font-medium md:text-3xl" style={{ animationDelay: '80ms' }}>
            Peer-to-peer baby gear for parents who share.
          </h1>
          <p className="animate-rise mt-3 max-w-xl text-base text-[#f7f3eb]/85 md:text-lg" style={{ animationDelay: '140ms' }}>
            List items to sell, exchange, or rent. Upload a photo and we reverse-search it to draft
            your listing for you.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: '200ms' }}>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#f7f3eb] px-5 py-3 text-sm font-semibold text-teal-950"
            >
              List an item <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full border border-[#f7f3eb]/40 px-5 py-3 text-sm text-[#f7f3eb]"
            >
              Browse listings
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-3">
        {[
          {
            icon: Camera,
            title: 'Photo-smart listings',
            text: 'Upload gear photos. Google reverse image search helps fill title, brand, and category.',
          },
          {
            icon: Handshake,
            title: 'Sell, rent, or exchange',
            text: 'Keep gently used strollers, cribs, and carriers circulating in your parent community.',
          },
          {
            icon: ShieldCheck,
            title: 'Deals stay visible',
            text: 'Every transaction happens on BabyLink so admins can oversee the full trail.',
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className="animate-rise rounded-3xl border border-teal-900/10 bg-white/55 p-6"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <item.icon className="mb-4 h-6 w-6 text-teal-800" />
            <h2 className="font-display text-xl text-teal-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-teal-900/70">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-teal-950">Fresh from parents</h2>
            <p className="text-sm text-teal-900/65">Recently listed baby products near you.</p>
          </div>
          <Link href="/browse" className="text-sm font-medium text-teal-800 hover:underline">
            View all
          </Link>
        </div>
        {listings.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-teal-900/20 bg-white/50 px-6 py-16 text-center">
            <p className="font-display text-2xl text-teal-950">No listings yet</p>
            <p className="mt-2 text-sm text-teal-900/65">
              Be the first parent to share gear on BabyLink.
            </p>
            <Link
              href="/listings/new"
              className="mt-6 inline-flex rounded-full bg-teal-800 px-4 py-2 text-sm text-[#f7f3eb]"
            >
              Create a listing
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
