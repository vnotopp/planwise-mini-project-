
-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============ EVENTS ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text,
  date text,
  budget numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "Users manage own events" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ RESOURCES ============
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  estimated_cost numeric not null default 0,
  actual_cost numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.resources enable row level security;
create policy "Users manage own resources" on public.resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ DEBTS ============
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  principal numeric not null default 0,
  interest_rate numeric not null default 0,
  minimum_payment numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.debts enable row level security;
create policy "Users manage own debts" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ ASSETS ============
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  current_value numeric not null default 0,
  purchase_value numeric,
  purchase_date text,
  annual_return numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.assets enable row level security;
create policy "Users manage own assets" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ MARKETPLACE LISTINGS ============
create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  price numeric not null,
  price_type text,
  cities text[],
  tags text[],
  included text[],
  rating numeric not null default 0,
  review_count integer not null default 0,
  verified boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.marketplace_listings enable row level security;
create policy "Anyone can view active listings"
  on public.marketplace_listings for select using (is_active = true);
create policy "Sellers can view own listings"
  on public.marketplace_listings for select using (auth.uid() = seller_id);
create policy "Sellers can insert own listings"
  on public.marketplace_listings for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own listings"
  on public.marketplace_listings for update using (auth.uid() = seller_id);
create policy "Sellers can delete own listings"
  on public.marketplace_listings for delete using (auth.uid() = seller_id);

-- ============ ENQUIRIES ============
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  event_date text,
  guest_count integer,
  city text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.enquiries enable row level security;
create policy "Buyer or seller can view enquiry" on public.enquiries
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyer can create enquiry" on public.enquiries
  for insert with check (auth.uid() = buyer_id);
create policy "Buyer or seller can update enquiry" on public.enquiries
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyer or seller can delete enquiry" on public.enquiries
  for delete using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============ USER FINANCIAL SETTINGS ============
create table public.user_financial_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  monthly_income numeric not null default 0,
  monthly_savings numeric not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.user_financial_settings enable row level security;
create policy "Users manage own settings" on public.user_financial_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ TIMESTAMP TRIGGER ============
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_user_financial_settings_updated_at before update on public.user_financial_settings
  for each row execute function public.update_updated_at_column();

-- ============ NEW USER TRIGGER (profile + seed assets) ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );

  insert into public.user_financial_settings (user_id) values (new.id);

  insert into public.assets (user_id, name, category, current_value, purchase_value, purchase_date, annual_return, notes) values
    (new.id, 'Home — Andheri Mumbai', 'Real Estate', 8000000, 5000000, '2018-06-01', null, '2BHK apartment'),
    (new.id, 'Nifty 50 Index SIP', 'Investment', 500000, 420000, null, 12.4, 'Monthly SIP ₹5,000'),
    (new.id, 'SBI Savings Account', 'Bank & Deposits', 250000, null, null, null, 'Emergency fund'),
    (new.id, 'HDFC Fixed Deposit', 'Bank & Deposits', 100000, null, null, null, 'Matures Dec 2025, 7.5% interest'),
    (new.id, 'Physical Gold 50gm', 'Precious Metals', 300000, null, null, null, 'Stored in bank locker'),
    (new.id, 'LIC Endowment Policy', 'Insurance', 150000, null, null, null, 'Matures 2028, premium ₹12,000/year'),
    (new.id, 'PPF Account', 'Investment', 200000, null, null, 7.1, 'Matures 2027'),
    (new.id, 'Retail Shop — Dadar', 'Business', 500000, null, null, null, 'Monthly rental income ₹8,000');

  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime for enquiries (Phase 2)
alter publication supabase_realtime add table public.enquiries;
alter table public.enquiries replica identity full;
