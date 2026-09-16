-- BabyLink schema: profiles, listings, deals, storage

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'parent' check (role in ('parent', 'admin')),
  city text default '',
  phone text default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'other',
  brand text default '',
  condition text not null default 'good'
    check (condition in ('new', 'like_new', 'good', 'fair', 'poor')),
  age_range text default '',
  listing_type text not null default 'sell'
    check (listing_type in ('sell', 'exchange', 'rent')),
  price numeric(10, 2),
  rent_period text default 'week',
  exchange_notes text default '',
  city text default '',
  image_url text,
  image_paths text[] default '{}',
  enrichment jsonb default '{}'::jsonb,
  status text not null default 'active'
    check (status in ('active', 'reserved', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_type_idx on public.listings (listing_type);
create index if not exists listings_category_idx on public.listings (category);

-- Deals / transactions (platform-mediated)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  deal_type text not null check (deal_type in ('sell', 'exchange', 'rent')),
  amount numeric(10, 2),
  currency text not null default 'USD',
  message text default '',
  status text not null default 'pending'
    check (status in (
      'pending',
      'accepted',
      'rejected',
      'in_progress',
      'completed',
      'cancelled'
    )),
  admin_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists deals_listing_idx on public.deals (listing_id);
create index if not exists deals_seller_idx on public.deals (seller_id);
create index if not exists deals_buyer_idx on public.deals (buyer_id);
create index if not exists deals_status_idx on public.deals (status);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'parent')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists deals_updated_at on public.deals;
create trigger deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.deals enable row level security;

-- Profiles policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Listings policies
drop policy if exists "Active listings are public" on public.listings;
create policy "Active listings are public"
  on public.listings for select
  using (
    status = 'active'
    or owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Owners can insert listings" on public.listings;
create policy "Owners can insert listings"
  on public.listings for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update listings" on public.listings;
create policy "Owners can update listings"
  on public.listings for update
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Owners can delete listings" on public.listings;
create policy "Owners can delete listings"
  on public.listings for delete
  using (auth.uid() = owner_id);

-- Deals policies
drop policy if exists "Deal parties and admins can view" on public.deals;
create policy "Deal parties and admins can view"
  on public.deals for select
  using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Buyers can create deals" on public.deals;
create policy "Buyers can create deals"
  on public.deals for insert
  with check (auth.uid() = buyer_id);

drop policy if exists "Parties and admins can update deals" on public.deals;
create policy "Parties and admins can update deals"
  on public.deals for update
  using (
    auth.uid() = buyer_id
    or auth.uid() = seller_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Storage bucket for listing photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view listing photos" on storage.objects;
create policy "Anyone can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Authenticated users can upload listing photos" on storage.objects;
create policy "Authenticated users can upload listing photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Owners can update own listing photos" on storage.objects;
create policy "Owners can update own listing photos"
  on storage.objects for update
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owners can delete own listing photos" on storage.objects;
create policy "Owners can delete own listing photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
