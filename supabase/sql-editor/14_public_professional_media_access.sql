-- Allow visitors and clients to load only the image paths of public profiles.
-- The existing professionals SELECT policy still limits rows to verified
-- professionals (plus the signed-in owner and administrators).
grant usage on schema public to anon, authenticated;
grant select (profile_id, avatar_path, portfolio_paths)
  on public.professionals to anon, authenticated;

-- Images are stored in a public bucket; these policies allow reading those
-- objects without exposing private account or moderation data.
update storage.buckets
set public = true
where id = 'professional-media';

drop policy if exists "Public can view professional media" on storage.objects;
create policy "Public can view professional media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'professional-media');
 