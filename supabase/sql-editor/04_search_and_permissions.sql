-- 4/5 - Recherche publique et permissions. Ex?cuter apr?s le fichier pr?c?dent.

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
grant select, insert, update, delete on public.profiles to authenticated;
grant select on public.professionals to authenticated;
revoke all on public.professionals from anon, authenticated;
grant insert, update, delete on public.professionals to authenticated;
grant select, insert, update, delete on public.professional_skills,
  public.service_requests, public.reviews, public.reports, public.favorites to authenticated;
revoke update on public.service_requests from authenticated;
grant update (status) on public.service_requests to authenticated;
grant usage, select on all sequences in schema public to authenticated;

