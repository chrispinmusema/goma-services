-- Les politiques RLS « Admins manage categories/skills » protègent ces écritures.
-- Le droit SQL est accordé aux utilisateurs connectés, mais seul un admin
-- satisfait ces politiques.
grant insert, update, delete on public.categories, public.skills to authenticated;
