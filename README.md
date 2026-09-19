# LantaShare

Peer-to-peer baby products sharing platform. Parents can **sell**, **exchange**, or **rent** gear. Deals stay on the platform so admins can oversee every transaction. Listing photos are stored in **Supabase Storage**, and uploads trigger a **Google reverse image search** flow to auto-fill listing fields.

## Features

- Parent signup / login (Supabase Auth)
- Listings: sell · exchange · rent
- Photo upload → Supabase Storage (`listing-photos`)
- Reverse image enrichment (Google Vision Web Detection or SerpAPI Google Lens)
- Deal requests with status workflow
- Admin dashboard of all transactions

## Setup

### 1. Environment

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable or legacy anon key)

Recommended for reverse image auto-fill (use at least one):

- `GOOGLE_VISION_API_KEY` — [Cloud Vision API](https://cloud.google.com/vision)
- `SERPAPI_KEY` — [SerpAPI Google Lens](https://serpapi.com/google-lens-api)

### 2. Database + storage

In the Supabase Dashboard → **SQL Editor**, run the full script:

[`supabase/schema.sql`](./supabase/schema.sql)

This creates `profiles`, `listings`, `deals`, RLS policies, and the public `listing-photos` storage bucket.

If your network can reach the database (IPv6 or pooler), you can also run:

```bash
node scripts/apply-schema.js
```

### 3. Auth settings

In Supabase → Authentication:

- Enable Email provider
- For local testing, you may disable “Confirm email”

### 4. Promote an admin

After signing up as a parent:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Deploy on Vercel

In the Vercel project → **Settings → Environment Variables**, add these for Production (and Preview):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ysgwarumspeyjnjhuxea.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase publishable / anon key |
| `SERPAPI_KEY` | your SerpAPI key |
| `DATABASE_URL` | pooler connection string (optional for runtime) |

Then **Redeploy**. Without the `NEXT_PUBLIC_SUPABASE_*` vars the homepage can render, but auth, listings, and uploads will not work.

## How photo auto-fill works

1. Parent uploads a product photo on **List an item**
2. Image is stored in Supabase Storage
3. `/api/enrich-image` runs reverse image search:
   - **Google Vision** `WEB_DETECTION` + labels (preferred when `GOOGLE_VISION_API_KEY` is set)
   - else **SerpAPI Google Lens** when `SERPAPI_KEY` is set
   - else a local heuristic fallback
4. Suggested title, description, category, brand, and age range are written into the form

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase Auth, Postgres, Storage
- Server Actions for listings and deals
