-- Admin-only read access to Supabase Auth accounts.
-- Run after 01_schema.sql and 02_auth_and_helpers.sql.
-- The function returns account metadata only to authenticated platform admins.

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
