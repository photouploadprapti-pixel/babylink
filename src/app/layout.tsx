import type { Metadata } from 'next'
import { Fraunces, Source_Sans_3 } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
})

const body = Source_Sans_3({
  variable: '--font-body',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BabyLink — Peer-to-peer baby gear sharing',
  description:
    'Sell, exchange, or rent baby products with other parents. Photo upload with Google reverse image search auto-fills your listing.',
}

export const dynamic = 'force-dynamic'

/**
 * Root application layout.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-teal-900/10 px-4 py-8 text-center text-sm text-teal-900/60">
          BabyLink · Parents sharing gear, one listing at a time
        </footer>
      </body>
    </html>
  )
}
