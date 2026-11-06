-- 3/5 - S?curit? RLS et politiques d?acc?s. Ex?cuter apr?s le fichier pr?c?dent.

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

