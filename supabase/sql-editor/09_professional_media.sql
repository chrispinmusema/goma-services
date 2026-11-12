-- Stockage public des photos de profil et réalisations professionnelles.
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
