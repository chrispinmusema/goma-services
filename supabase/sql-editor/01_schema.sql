-- 1/5 - Extensions, types, tables, indexes et triggers. Ex?cuter apr?s le fichier pr?c?dent.

-- Supabase schema for the Goma local-skills marketplace.
-- Apply this migration to a Supabase project after enabling PostGIS.

create extension if not exists postgis with schema extensions;

create type public.app_role as enum ('client', 'professional', 'admin');
create type public.professional_status as enum ('pending', 'verified', 'rejected', 'suspended');
create type public.request_status as enum ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  role public.app_role not null default 'client',
  neighborhood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  description text,
  created_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

create table public.professionals (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  description text not null default '' check (char_length(description) <= 3000),
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  indicative_rate numeric(12, 2) check (indicative_rate is null or indicative_rate >= 0),
  rate_currency text not null default 'CDF' check (rate_currency in ('CDF', 'USD')),
  available boolean not null default false,
  service_area text[] not null default '{}',
  -- Public contact is opt-in and is distinct from a user's private account data.
  public_contact_phone text check (public_contact_phone is null or char_length(public_contact_phone) <= 32),
  location extensions.geography(Point, 4326),
  status public.professional_status not null default 'pending',
  moderation_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_skills (
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (professional_id, skill_id)
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  description text not null check (char_length(description) between 10 and 3000),
  neighborhood text,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null unique references public.service_requests(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1500),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid references public.professionals(profile_id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 120),
  details text check (details is null or char_length(details) <= 2000),
  status public.report_status not null default 'open',
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (professional_id is not null or review_id is not null)
);

create table public.favorites (
  client_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, professional_id),
  check (client_id <> professional_id)
);

create index professionals_location_gix on public.professionals using gist (location);
create index professionals_category_status_idx on public.professionals (category_id, status);
create index professionals_available_idx on public.professionals (available) where available;
create index professional_skills_skill_idx on public.professional_skills (skill_id, professional_id);
create index service_requests_client_created_idx on public.service_requests (client_id, created_at desc);
create index service_requests_professional_created_idx on public.service_requests (professional_id, created_at desc);
create index service_requests_status_idx on public.service_requests (status);
create index reviews_professional_idx on public.reviews (professional_id, created_at desc);
create index reports_status_created_idx on public.reports (status, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger professionals_set_updated_at before update on public.professionals
for each row execute function public.set_updated_at();
create trigger requests_set_updated_at before update on public.service_requests
for each row execute function public.set_updated_at();
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

