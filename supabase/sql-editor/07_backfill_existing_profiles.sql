-- Crée une ligne public.profiles pour les anciens utilisateurs Auth
-- qui ont été inscrits avant l'installation du déclencheur handle_new_user.
-- N'ajoute ni fiche professionnelle ni validation publique.
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
