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

-- New signups become clients. Role changes are restricted by RLS below.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Nouveau membre'),
    case
      when new.raw_user_meta_data ->> 'role' = 'professional' then 'professional'::public.app_role
      else 'client'::public.app_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- This helper reads profiles without opening a policy-recursion path.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.professional_moderation_fields_unchanged(
  p_status public.professional_status,
  p_verified_at timestamptz,
  p_moderation_reason text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.professionals p
    where p.profile_id = (select auth.uid())
      and p.status = p_status
      and p.verified_at is not distinct from p_verified_at
      and p.moderation_reason is not distinct from p_moderation_reason
  );
$$;

create or replace function public.service_request_transition_allowed(
  p_request_id uuid,
  p_new_status public.request_status
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select public.is_platform_admin()) then true
    when exists (
      select 1 from public.service_requests r
      where r.id = p_request_id
        and r.client_id = (select auth.uid())
        and (select public.current_app_role()) = 'client'
        and r.status in ('pending', 'accepted')
        and p_new_status = 'cancelled'
    ) then true
    when exists (
      select 1 from public.service_requests r
      where r.id = p_request_id
        and r.professional_id = (select auth.uid())
        and (select public.current_app_role()) = 'professional'
        and (
          (r.status = 'pending' and p_new_status in ('accepted', 'declined'))
          or (r.status = 'accepted' and p_new_status = 'in_progress')
          or (r.status = 'in_progress' and p_new_status = 'completed')
        )
    ) then true
    else false
  end;
$$;

create or replace function public.admin_list_professionals()
returns table (
  profile_id uuid,
  display_name text,
  neighborhood text,
  category_name text,
  status public.professional_status,
  moderation_reason text,
  available boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_platform_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
    select p.profile_id, pr.display_name, pr.neighborhood, c.name, p.status,
      p.moderation_reason, p.available, p.created_at
    from public.professionals p
    join public.profiles pr on pr.id = p.profile_id
    join public.categories c on c.id = p.category_id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_review_professional(
  p_profile_id uuid,
  p_status public.professional_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_platform_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status in ('rejected', 'suspended') and nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'A reason is required for rejected or suspended profiles';
  end if;
  update public.professionals
  set status = p_status,
      moderation_reason = case when p_status in ('rejected', 'suspended') then trim(p_reason) else null end,
      verified_at = case when p_status = 'verified' then now() else null end
  where profile_id = p_profile_id;
  if not found then
    raise exception 'Professional profile not found' using errcode = 'P0002';
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_skills enable row level security;
alter table public.service_requests enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.favorites enable row level security;

create policy "Profiles can be read by their owner or an admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_platform_admin()));

create policy "Users can create only their own non-admin profile"
on public.profiles for insert to authenticated
with check (
  id = (select auth.uid())
  and role in ('client', 'professional')
);

create policy "Users can update their own profile without changing role"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = (select public.current_app_role()));

create policy "Admins manage profiles"
on public.profiles for all to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Categories are readable"
on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories"
on public.categories for all to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Skills are readable"
on public.skills for select to anon, authenticated using (true);
create policy "Admins manage skills"
on public.skills for all to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Public can read verified professionals; owners and admins can read own records"
on public.professionals for select to anon, authenticated
using (status = 'verified' or profile_id = (select auth.uid()) or (select public.is_platform_admin()));

create policy "Professionals can create their own pending record"
on public.professionals for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and (select public.current_app_role()) = 'professional'
  and status = 'pending'
  and verified_at is null
  and moderation_reason is null
);

create policy "Professionals can update their own record without changing moderation fields"
on public.professionals for update to authenticated
using (profile_id = (select auth.uid()))
with check (
  profile_id = (select auth.uid())
  and (select public.current_app_role()) = 'professional'
  and (select public.professional_moderation_fields_unchanged(status, verified_at, moderation_reason))
);

create policy "Admins manage professional profiles"
on public.professionals for all to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Skills attached to visible professionals are readable"
on public.professional_skills for select to anon, authenticated
using (
  exists (
    select 1 from public.professionals p
    where p.profile_id = professional_id
      and (p.status = 'verified' or p.profile_id = (select auth.uid()) or (select public.is_platform_admin()))
  )
);
create policy "Professionals manage their own skills"
on public.professional_skills for all to authenticated
using (professional_id = (select auth.uid()) or (select public.is_platform_admin()))
with check (professional_id = (select auth.uid()) or (select public.is_platform_admin()));

create policy "Clients and assigned professionals can read their requests"
on public.service_requests for select to authenticated
using (
  client_id = (select auth.uid())
  or professional_id = (select auth.uid())
  or (select public.is_platform_admin())
);
create policy "Clients can create requests for verified professionals"
on public.service_requests for insert to authenticated
with check (
  client_id = (select auth.uid())
  and (select public.current_app_role()) = 'client'
  and status = 'pending'
  and exists (
    select 1 from public.professionals p
    where p.profile_id = professional_id and p.status = 'verified'
  )
);
create policy "Request participants can update request status"
on public.service_requests for update to authenticated
using (
  (client_id = (select auth.uid()) and (select public.current_app_role()) = 'client')
  or (professional_id = (select auth.uid()) and (select public.current_app_role()) = 'professional')
  or (select public.is_platform_admin())
)
with check (
  (select public.service_request_transition_allowed(id, status))
  or (select public.is_platform_admin())
);

create policy "Review participants and admins can read reviews"
on public.reviews for select to authenticated
using (
  client_id = (select auth.uid())
  or professional_id = (select auth.uid())
  or (select public.is_platform_admin())
);
create policy "Clients can review their completed request once"
on public.reviews for insert to authenticated
with check (
  client_id = (select auth.uid())
  and exists (
    select 1 from public.service_requests r
    where r.id = service_request_id
      and r.client_id = (select auth.uid())
      and r.professional_id = professional_id
      and r.status = 'completed'
  )
);
create policy "Admins manage reviews"
on public.reviews for all to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Reporters and admins can read reports"
on public.reports for select to authenticated
using (reporter_id = (select auth.uid()) or (select public.is_platform_admin()));
create policy "Authenticated users can create their own reports"
on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and status = 'open' and resolution_note is null);
create policy "Admins manage reports"
on public.reports for update to authenticated
using ((select public.is_platform_admin()))
with check ((select public.is_platform_admin()));

create policy "Clients manage their own favorites"
on public.favorites for all to authenticated
using (client_id = (select auth.uid()) or (select public.is_platform_admin()))
with check (client_id = (select auth.uid()) or (select public.is_platform_admin()));

-- Public search returns rounded distances, never exact provider or client coordinates.
create or replace function public.search_professionals(
  p_query text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_meters integer default 10000,
  p_available_only boolean default false,
  p_neighborhood text default null
)
returns table (
  profile_id uuid,
  display_name text,
  neighborhood text,
  category_name text,
  description text,
  experience_years integer,
  indicative_rate numeric,
  rate_currency text,
  available boolean,
  service_area text[],
  public_contact_phone text,
  skills text[],
  average_rating numeric,
  review_count bigint,
  approximate_distance_meters integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(trim(coalesce(p_query, '')), '');
  search_point extensions.geography;
begin
  if p_radius_meters < 1000 or p_radius_meters > 20000 then
    raise exception 'Search radius must be between 1000 and 20000 meters';
  end if;

  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Latitude and longitude must be supplied together';
  end if;
  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180) then
    raise exception 'Invalid coordinates';
  end if;
  if p_latitude is not null then
    search_point := extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography;
  end if;

  return query
  select
    pr.profile_id,
    pf.display_name,
    pf.neighborhood,
    c.name as category_name,
    pr.description,
    pr.experience_years,
    pr.indicative_rate,
    pr.rate_currency,
    pr.available,
    pr.service_area,
    pr.public_contact_phone,
    coalesce(sk.skill_names, '{}'::text[]) as skills,
    rv.average_rating,
    coalesce(rv.review_count, 0)::bigint as review_count,
    case
      when search_point is null or pr.location is null then null
      else (round(extensions.st_distance(pr.location, search_point) / 100.0) * 100)::integer
    end as approximate_distance_meters
  from public.professionals pr
  join public.profiles pf on pf.id = pr.profile_id
  join public.categories c on c.id = pr.category_id
  left join lateral (
    select array_agg(s.name order by s.name) as skill_names
    from public.professional_skills ps
    join public.skills s on s.id = ps.skill_id
    where ps.professional_id = pr.profile_id
  ) sk on true
  left join lateral (
    select avg(r.rating)::numeric(3, 2) as average_rating, count(*) as review_count
    from public.reviews r
    where r.professional_id = pr.profile_id
  ) rv on true
  where pr.status = 'verified'
    and (not p_available_only or pr.available)
    and (p_neighborhood is null or pf.neighborhood = p_neighborhood or p_neighborhood = any(pr.service_area))
    and (search_point is null or (pr.location is not null and extensions.st_dwithin(pr.location, search_point, p_radius_meters)))
    and (
      normalized_query is null
      or c.name ilike '%' || normalized_query || '%'
      or exists (
        select 1
        from public.professional_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.professional_id = pr.profile_id and s.name ilike '%' || normalized_query || '%'
      )
    )
  order by
    case when search_point is not null and pr.location is not null
      then extensions.st_distance(pr.location, search_point)
      else null end asc nulls last,
    pr.available desc,
    pf.display_name asc;
end;
$$;

revoke all on function public.search_professionals(text, double precision, double precision, integer, boolean, text) from public;
grant execute on function public.search_professionals(text, double precision, double precision, integer, boolean, text) to anon, authenticated;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;
revoke all on function public.professional_moderation_fields_unchanged(public.professional_status, timestamptz, text) from public;
grant execute on function public.professional_moderation_fields_unchanged(public.professional_status, timestamptz, text) to authenticated;
revoke all on function public.service_request_transition_allowed(uuid, public.request_status) from public;
grant execute on function public.service_request_transition_allowed(uuid, public.request_status) to authenticated;
revoke all on function public.admin_list_professionals() from public;
grant execute on function public.admin_list_professionals() to authenticated;
revoke all on function public.admin_review_professional(uuid, public.professional_status, text) from public;
grant execute on function public.admin_review_professional(uuid, public.professional_status, text) to authenticated;

grant select on public.categories, public.skills to anon, authenticated;
grant insert, update, delete on public.categories, public.skills to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
revoke all on public.professionals from anon, authenticated;
-- RLS limits authenticated reads to verified rows, the owner's own row, or admins.
grant select on public.professionals to authenticated;
grant insert, update, delete on public.professionals to authenticated;
grant select, insert, update, delete on public.professional_skills,
  public.service_requests, public.reviews, public.reports, public.favorites to authenticated;
revoke update on public.service_requests from authenticated;
grant update (status) on public.service_requests to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.categories (name, description) values
  ('Informatique et réseaux', 'Installation, dépannage et assistance informatique'),
  ('Électricité', 'Installation et réparation électrique'),
  ('Plomberie', 'Installation et dépannage de plomberie'),
  ('Mécanique automobile', 'Entretien et réparation de véhicules'),
  ('Réparation de téléphones', 'Diagnostic et réparation de téléphones'),
  ('Menuiserie', 'Fabrication et réparation de mobilier'),
  ('Construction', 'Travaux de bâtiment et finitions')
on conflict (name) do nothing;

insert into public.skills (category_id, name)
select c.id, skills.name
from public.categories c
join (values
  ('Informatique et réseaux', 'Installation réseau'),
  ('Informatique et réseaux', 'Dépannage informatique'),
  ('Électricité', 'Installation électrique'),
  ('Électricité', 'Dépannage'),
  ('Plomberie', 'Recherche de fuite'),
  ('Plomberie', 'Installation sanitaire'),
  ('Mécanique automobile', 'Diagnostic auto'),
  ('Réparation de téléphones', 'Écran et batterie'),
  ('Menuiserie', 'Meubles sur mesure'),
  ('Construction', 'Maçonnerie')
) as skills(category_name, name) on c.name = skills.category_name
on conflict (category_id, name) do nothing;
