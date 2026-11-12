# Connexion à Supabase

L'authentification Supabase est utilisée lorsque les variables d'environnement
sont configurées. Les comptes, fiches professionnelles, demandes, favoris et
recherche publique utilisent les tables Supabase. La recherche n'affiche que
des fiches professionnelles réellement enregistrées et validées.

## Préparer le projet Supabase

1. Créez un projet Supabase.
2. Dans **Project Settings → API**, récupérez l'URL du projet et la clé
   publishable (ou l'ancienne clé `anon`). N'utilisez jamais la clé
   `service_role` ou une clé secrète dans l'application.
3. Ajoutez ces variables au projet Vercel, dans **Settings → Environment Variables**,
   pour les environnements Preview et Production :
   - `VITE_SUPABASE_URL` — URL du projet Supabase.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` — clé publishable (ou
     `VITE_SUPABASE_ANON_KEY` pour les anciens projets).
   En local, créez un fichier `.env.local` à la racine de `goma-services` avec
   ces deux variables (voir `.env.example`), puis redémarrez `npm run dev`.
4. Dans le SQL Editor de Supabase, exécutez les scripts de
   `supabase/sql-editor/` un par un et dans cet ordre :
   `01_schema.sql`, `02_auth_and_helpers.sql`, `03_rls_policies.sql`,
   `04_search_and_permissions.sql`, `05_seed_data.sql`, puis
   `06_admin_accounts.sql`, `08_admin_professional_details.sql`,
   `09_professional_media.sql`, `10_professional_resubmission.sql` et
   `11_admin_catalog_management.sql`. Enregistrez
   chaque snippet avec **Save** (ou `Ctrl+S`) avant de le lancer, puis attendez
   sa réussite avant de passer au suivant. N'exécutez pas ces scripts si la
   migration complète a déjà été appliquée.
   Si les scripts 01 à 05 ou la migration complète ont déjà été appliqués,
   exécutez `06_admin_accounts.sql`, `08_admin_professional_details.sql`,
   `09_professional_media.sql`, `10_professional_resubmission.sql` et
   `11_admin_catalog_management.sql` pour ajouter la liste des comptes, les
   détails de modération, le stockage des photos, la nouvelle soumission des
   fiches refusées et la gestion réelle des catégories/compétences. Le script
   09 rétablit aussi la lecture sécurisée des fiches professionnelles pour les
   comptes connectés.
   Si des personnes se sont inscrites avant l'installation du déclencheur,
   exécutez aussi `07_backfill_existing_profiles.sql` : il crée uniquement les
   lignes `public.profiles` manquantes pour les comptes Auth déjà présents.
   Pour diagnostiquer un compte invisible, exécutez
   `12_account_diagnostics.sql` dans le SQL Editor : il retourne seulement des
   totaux (comptes Auth, profils publics, fiches en attente et validées), sans
   exposer les adresses e-mail.
5. Après avoir modifié les variables Vercel, redéployez le site pour inclure
   cette configuration. Dans Supabase Auth, activez la confirmation par e-mail
   selon votre choix et configurez l'URL du site ainsi que les URL de redirection
   Vercel Preview et Production. Autorisez notamment l'URL `/auth/callback` du
   domaine de production et des aperçus Vercel : elle reçoit les confirmations
   d'adresse et le lien de récupération (`/auth/callback?mode=recovery`).
   L'inscription envoie le nom et le rôle client/professionnel à
   Auth; le déclencheur SQL crée le profil. Le rôle administrateur n'est jamais
   accepté depuis l'inscription.
6. Redémarrez l'application après avoir ajouté les variables. Testez d'abord
   l'inscription, la confirmation e-mail si activée, puis la connexion.

La clé publique `anon`/publishable est conçue pour être utilisée par le client web : la sécurité doit
venir des politiques RLS appliquées dans la migration. Ne désactivez pas RLS et
ne déployez jamais la clé `service_role` dans le navigateur.

## À propos des données géographiques

La migration active PostGIS, crée un index spatial et expose une fonction de
recherche qui renvoie des distances arrondies plutôt que des coordonnées
exactes. La position du client n'est pas enregistrée. Les profils
professionnels ne sortent dans les résultats réels qu'après vérification par
un administrateur.

La pondération initiale du classement côté produit est documentée dans
`src/lib/ranking.ts` : compétences 40 %, proximité 25 %, fiabilité 20 %,
disponibilité 15 %. Les critères absents doivent être exclus et les poids
restants renormalisés; aucune note ou validation ne doit être inventée.

Le calcul de classement peut être vérifié avec
`pnpm --filter @workspace/goma-services run test:ranking`.

## Parcours des comptes et visibilité des fiches

L'inscription crée un compte dans **Authentication → Users**. Le déclencheur
de la migration crée aussi sa ligne dans `public.profiles` avec le rôle choisi.
Un compte professionnel n'apparaît pas immédiatement dans le catalogue : son
titulaire doit enregistrer sa fiche depuis `/espace/pro`, puis un
administrateur doit la valider. Le catalogue public affiche uniquement les
fiches dont le statut est `verified`. Les visiteurs peuvent consulter les
fiches sans compte ; il faut un compte client pour envoyer une demande ou
enregistrer un favori.

Pour voir tous les comptes Auth dans `/admin`, exécutez aussi
`supabase/sql-editor/06_admin_accounts.sql` depuis le SQL Editor. L'onglet
**Comptes** distingue les comptes Auth des fiches professionnelles, et indique
si une ligne `profiles` existe. L'onglet **Fiches professionnelles** affiche
les fiches envoyées et permet leur modération. L'onglet **Métiers et
compétences** permet à l'administration de créer et supprimer les catégories
et leurs compétences. Les clés étrangères empêchent de supprimer une catégorie
ou une compétence encore utilisée.

Sur Vercel, configurez `VITE_SUPABASE_URL` et
`VITE_SUPABASE_PUBLISHABLE_KEY` dans les variables d'environnement de
Production, puis redéployez. Sans ces variables, les pages publiques indiquent
que la base n'est pas configurée au lieu d'afficher une démonstration locale.
Ne déployez jamais la clé `service_role` dans le navigateur.

## Dépannage de l'authentification

- `429` signifie que Supabase limite temporairement les demandes. Arrêtez les
  essais répétés et attendez avant de réessayer. Dans le tableau de bord,
  vérifiez **Authentication → Rate Limits**, les journaux d'Auth et la
  configuration e-mail/SMTP du projet. Une limite atteinte ne peut pas être
  corrigée depuis le navigateur.
- `400` lors de la connexion indique souvent une adresse ou un mot de passe
  incorrect, ou une adresse e-mail qui n'a pas encore été confirmée. Consultez
  le message affiché par le formulaire et les journaux Auth pour connaître la
  cause exacte.

## Accès administrateur

La route `/admin` n'est pas dans la navigation publique. Elle demande une
connexion Supabase et vérifie le rôle dans `public.profiles`. Sans variables de
configuration, migration ou rôle valide, l'accès est refusé. Le rôle
administrateur ne doit jamais être attribué depuis un formulaire public ou des
métadonnées modifiables par l'utilisateur. La migration crée les nouveaux
comptes comme clients ou professionnels et réserve les opérations
d'administration aux comptes dont `public.profiles.role` vaut `admin`.

Après avoir configuré Supabase, appliqué les scripts SQL nécessaires et créé votre compte,
attribuez le rôle depuis le SQL Editor du tableau de bord Supabase en remplaçant
`VOTRE-UUID` par l'identifiant de votre compte vérifié :

```sql
update public.profiles
set role = 'admin'
where id = 'VOTRE-UUID'::uuid;
```

Ne partagez pas cet accès. La connexion à `/admin` valide la session et le rôle
auprès de Supabase. Après avoir exécuté `06_admin_accounts.sql`, la console peut
lister les comptes Auth et les fiches professionnelles réelles, puis valider,
refuser ou suspendre une fiche.
