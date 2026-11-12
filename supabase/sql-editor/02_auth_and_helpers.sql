-- 2/5 - Authentification et fonctions auxiliaires. Ex?cuter apr?s le fichier pr?c?dent.

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

drop trigger if exists on_auth_user_created on auth.users;
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

drop function if exists public.admin_list_professionals();
create function public.admin_list_professionals()
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
