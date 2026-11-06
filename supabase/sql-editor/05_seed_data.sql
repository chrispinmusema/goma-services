-- 5/5 - Cat?gories et comp?tences initiales. Ex?cuter apr?s le fichier pr?c?dent.

insert into public.categories (name, description) values
  ('Informatique et réseaux', 'Installation, dépannage et assistance informatique'),
  ('Électricité', 'Installation et réparation électrique'),
  ('Plomberie', 'Installation et dépannage de plomberie'),
  ('Mécanique automobile', 'Entretien et réparation de véhicules'),
  ('Réparation de téléphones', 'Diagnostic et réparation de téléphones'),
  ('Menuiserie', 'Fabrication et réparation de mobilier'),
  ('Construction', 'Travaux de bâtiment et finitions')
on conflict (name) do nothing;

insert into public.skills (category_id, name)
select c.id, skills.name
from public.categories c
join (values
  ('Informatique et réseaux', 'Installation réseau'),
  ('Informatique et réseaux', 'Dépannage informatique'),
  ('Électricité', 'Installation électrique'),
  ('Électricité', 'Dépannage'),
  ('Plomberie', 'Recherche de fuite'),
  ('Plomberie', 'Installation sanitaire'),
  ('Mécanique automobile', 'Diagnostic auto'),
  ('Réparation de téléphones', 'Écran et batterie'),
  ('Menuiserie', 'Meubles sur mesure'),
  ('Construction', 'Maçonnerie')
) as skills(category_name, name) on c.name = skills.category_name
on conflict (category_id, name) do nothing;
