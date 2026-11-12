-- Autorise un professionnel à corriger et renvoyer une fiche refusée.
-- Le propriétaire ne peut pas s'auto-valider ni retirer une suspension.
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
