-- Diagnostic en lecture seule des comptes et fiches professionnelles.
-- À exécuter dans le SQL Editor Supabase avec le rôle postgres.
-- Aucun e-mail, identifiant personnel ou contenu de profil n'est retourné.

with metrics (sort_order, indicateur, total) as (
select 1, 'Comptes créés dans Auth', count(*)
from auth.users
union all
select 2, 'Comptes Auth sans profil public', count(*)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
union all
select 3, 'Comptes Auth avec rôle professionnel dans les métadonnées', count(*)
from auth.users
where raw_user_meta_data ->> 'role' = 'professional'
union all
select 4, 'Profils avec rôle professionnel', count(*)
from public.profiles
where role = 'professional'
union all
select 5, 'Fiches professionnelles enregistrées', count(*)
from public.professionals
union all
select 6, 'Fiches en attente de validation', count(*)
from public.professionals
where status = 'pending'
union all
select 7, 'Fiches validées et visibles publiquement', count(*)
from public.professionals
where status = 'verified'
union all
select 8, 'Fiches refusées', count(*)
from public.professionals
where status = 'rejected'
union all
select 9, 'Fiches suspendues', count(*)
from public.professionals
where status = 'suspended'
)
select indicateur, total
from metrics
order by sort_order;
