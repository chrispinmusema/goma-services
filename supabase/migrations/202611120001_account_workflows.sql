-- Upgrade the initial schema for the public catalogue and account workflows.
-- Safe to apply after 202610260001_initial_schema.sql.

insert into public.profiles (id, display_name, role)
select
  u.id,
  left(coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(split_part(coalesce(u.email, ''), '@', 1)), ''),
    'Nouveau membre'
  ), 100),
  case
    when u.raw_user_meta_data ->> 'role' = 'professional'
      then 'professional'::public.app_role
    else 'client'::public.app_role
  end
from auth.users as u
left join public.profiles as p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

drop function if exists public.search_professionals(
  text, double precision, double precision, integer, boolean, text
);

create function public.search_professionals(
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

create or replace function public.admin_list_accounts()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role public.app_role,
  neighborhood text,
  created_at timestamptz,
  profile_exists boolean
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
    select
      u.id,
      u.email::text,
      coalesce(
        nullif(trim(p.display_name), ''),
        nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
        'Profil sans nom'
      ),
      p.role,
      p.neighborhood,
      u.created_at,
      p.id is not null
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_accounts() from public;
grant execute on function public.admin_list_accounts() to authenticated;

drop function if exists public.admin_list_professionals();

create function public.admin_list_professionals()
returns table (
  profile_id uuid,
  display_name text,
  neighborhood text,
  category_name text,
  status public.professional_status,
  moderation_reason text,
  description text,
  experience_years integer,
  available boolean,
  service_area text[],
  public_contact_phone text,
  skills text[],
  verified_at timestamptz,
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
      p.moderation_reason, p.description, p.experience_years,
      p.available, p.service_area,
      p.public_contact_phone, coalesce(sk.skill_names, '{}'::text[]),
      p.verified_at, p.created_at
    from public.professionals p
    join public.profiles pr on pr.id = p.profile_id
    join public.categories c on c.id = p.category_id
    left join lateral (
      select array_agg(s.name order by s.name) as skill_names
      from public.professional_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.professional_id = p.profile_id
    ) sk on true
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_professionals() from public;
grant execute on function public.admin_list_professionals() to authenticated;

alter table public.professionals
  add column if not exists avatar_path text,
  add column if not exists portfolio_paths text[] not null default '{}';

grant select (profile_id, avatar_path, portfolio_paths)
  on public.professionals to anon;
grant select on public.professionals to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-media', 'professional-media', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view professional media" on storage.objects;
create policy "Public can view professional media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'professional-media');

drop policy if exists "Professionals upload their own media" on storage.objects;
create policy "Professionals upload their own media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'professional-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'professional'
);

drop policy if exists "Professionals update their own media" on storage.objects;
create policy "Professionals update their own media"
on storage.objects for update to authenticated
using (
  bucket_id = 'professional-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'professional'
)
with check (
  bucket_id = 'professional-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'professional'
);

drop policy if exists "Professionals delete their own media" on storage.objects;
create policy "Professionals delete their own media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'professional-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select public.current_app_role()) = 'professional'
);

create or replace function public.professional_moderation_update_allowed(
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
    select 1
    from public.professionals current_record
    where current_record.profile_id = (select auth.uid())
      and (select public.current_app_role()) = 'professional'
      and (
        (
          current_record.status = p_status
          and current_record.verified_at is not distinct from p_verified_at
          and current_record.moderation_reason is not distinct from p_moderation_reason
        )
        or (
          current_record.status = 'rejected'
          and p_status = 'pending'
          and p_verified_at is null
          and p_moderation_reason is null
        )
      )
  );
$$;

revoke all on function public.professional_moderation_update_allowed(
  public.professional_status, timestamptz, text
) from public;
grant execute on function public.professional_moderation_update_allowed(
  public.professional_status, timestamptz, text
) to authenticated;

drop policy if exists
  "Professionals can update their own record without changing moderation fields"
  on public.professionals;
create policy
  "Professionals can update their own record without changing moderation fields"
on public.professionals for update to authenticated
using (profile_id = (select auth.uid()))
with check (
  profile_id = (select auth.uid())
  and (select public.current_app_role()) = 'professional'
  and (select public.professional_moderation_update_allowed(
    status, verified_at, moderation_reason
  ))
);

grant insert, update, delete on public.categories, public.skills to authenticated;
