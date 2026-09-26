-- Noteo — droits d'accès.
--
-- Deux couches, toutes deux nécessaires :
-- 1. GRANT : ce que chaque rôle peut toucher (tables, et colonnes pour l'écriture).
--    Le projet n'expose pas automatiquement les nouvelles tables : sans GRANT,
--    l'API REST ne voit rien.
-- 2. RLS : quelles lignes. Consultation libre, écriture réservée aux comptes,
--    chacun ne modifie que ce qui lui appartient.
--
-- anon = visiteur non connecté ; authenticated = utilisateur connecté ;
-- service_role = scripts d'administration (import OSM), contourne la RLS.

alter table public.categories enable row level security;
alter table public.criteria   enable row level security;
alter table public.profiles   enable row level security;
alter table public.places     enable row level security;
alter table public.reviews    enable row level security;

-- ---------------------------------------------------------------------------
-- GRANT
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories, public.criteria, public.profiles, public.places, public.reviews
  to anon, authenticated;

-- Écriture limitée aux colonnes saisies dans l'app : impossible, par exemple, de
-- s'attribuer un lieu, de le publier soi-même ou de gonfler sa note.
grant update (display_name, avatar_url) on public.profiles to authenticated;
grant insert (name, category_slug, subcategory, district, address, phone, lat, lng)
  on public.places to authenticated;
grant insert (place_id, rating, comment, criteria) on public.reviews to authenticated;
grant update (rating, comment, criteria) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

grant all on public.categories, public.criteria, public.profiles, public.places, public.reviews
  to service_role;

-- ---------------------------------------------------------------------------
-- Politiques RLS
-- `(select auth.uid())` plutôt que `auth.uid()` : évalué une fois par requête et
-- non une fois par ligne (recommandation Supabase).
-- ---------------------------------------------------------------------------

create policy "Référentiel lisible par tous"
  on public.categories for select to anon, authenticated using (true);

create policy "Critères lisibles par tous"
  on public.criteria for select to anon, authenticated using (true);

create policy "Profils lisibles par tous"
  on public.profiles for select to anon, authenticated using (true);

create policy "Chacun modifie son profil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Un lieu proposé n'est visible que de son auteur tant qu'il n'est pas publié.
create policy "Lieux publiés lisibles par tous, les siens toujours"
  on public.places for select to anon, authenticated
  using (status = 'published' or created_by = (select auth.uid()));

create policy "Un compte propose un lieu, en attente de vérification"
  on public.places for insert to authenticated
  with check (created_by = (select auth.uid()) and status = 'pending');

-- Les avis suivent la visibilité de leur lieu (la sous-requête passe par la RLS
-- de places) : ceux d'un lieu rejeté disparaissent avec lui.
create policy "Avis lisibles si le lieu l'est"
  on public.reviews for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id));

create policy "Un compte note un lieu publié"
  on public.reviews for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.places p where p.id = place_id and p.status = 'published')
  );

create policy "Chacun modifie ses avis"
  on public.reviews for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Chacun supprime ses avis"
  on public.reviews for delete to authenticated
  using (author_id = (select auth.uid()));
