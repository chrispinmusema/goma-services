-- Enrichit la liste d'administration afin de pouvoir examiner les fiches
-- professionnelles avant de les valider.
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
