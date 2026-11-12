-- À exécuter une seule fois dans le SQL Editor Supabase (rôle postgres).
-- Remplacez l'adresse ci-dessous par l'adresse du compte que vous contrôlez.
-- Ne placez jamais cette opération dans l'application cliente.

do $$
declare
  target_email text := 'VOTRE-EMAIL';
  target_user_id uuid;
  target_display_name text;
begin
  if lower(trim(target_email)) = 'votre-email'
    or position('@' in target_email) < 2 then
    raise exception 'Remplacez VOTRE-EMAIL par l’adresse e-mail exacte de votre compte.';
  end if;

  select
    u.id,
    left(coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(split_part(u.email, '@', 1)), ''),
      'Administrateur'
    ), 100)
  into target_user_id, target_display_name
  from auth.users as u
  where lower(u.email) = lower(trim(target_email));

  if target_user_id is null then
    raise exception 'Aucun compte Auth ne correspond à cette adresse e-mail.';
  end if;

  insert into public.profiles (id, display_name, role)
  values (target_user_id, target_display_name, 'admin'::public.app_role)
  on conflict (id) do update
    set role = 'admin'::public.app_role;

  raise notice 'Le rôle administrateur a été attribué au compte demandé.';
end;
$$;
