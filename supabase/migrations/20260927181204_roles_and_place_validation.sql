-- Noteo — rôles, et validation des lieux proposés par les utilisateurs.
--
-- Règles :
-- 1. Tout compte connecté est utilisateur. Les rôles AJOUTENT des droits, et un
--    même compte peut en cumuler plusieurs (admin + modérateur…).
-- 2. Un lieu proposé par un utilisateur est « à confirmer » (status = 'pending') :
--    visible de tous, notable, mais absent des classements.
-- 3. Il est publié automatiquement dès que 3 comptes différents l'ont noté SUR
--    PLACE, c'est-à-dire à moins de 300 m de sa position au moment de l'avis.
--    L'avis de la personne qui l'a proposé compte.
-- 4. Un lieu proposé sans position (pas de GPS) attend la validation d'un admin.
-- 5. Un admin publie directement les lieux qu'il ajoute.

-- ---------------------------------------------------------------------------
-- Rôles
-- Dans `private` : jamais exposée par l'API, personne ne peut s'attribuer un rôle
-- depuis l'app. Attribution depuis l'éditeur SQL de Supabase :
--   insert into private.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = '…';
-- ---------------------------------------------------------------------------

create table private.user_roles (
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'moderator', 'pro')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- « L'utilisateur connecté a-t-il ce rôle ? » Utilisable dans les politiques RLS
-- et par l'app (pour adapter l'interface) ; ne renseigne que sur soi-même.
create function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.user_roles r
    where r.user_id = (select auth.uid()) and r.role = p_role
  );
$$;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Nom provisoire à l'inscription : plus le début de l'adresse e-mail, qui
-- s'afficherait publiquement sous les avis. L'app demande un vrai nom.
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        'Membre Noteo'
      ),
      60
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lieux « à confirmer »
-- ---------------------------------------------------------------------------

-- Nombre de comptes différents ayant noté le lieu sur place (badge « 1/3 »).
alter table public.places add column on_site_count integer not null default 0;

-- Les admins voient aussi les lieux retirés, pour pouvoir les rétablir.
drop policy "Lieux publiés lisibles par tous, les siens toujours" on public.places;
create policy "Lieux publiés ou à confirmer visibles de tous"
  on public.places for select to anon, authenticated
  using (
    status in ('published', 'pending')
    or created_by = (select auth.uid())
    or (select public.has_role('admin'))
  );

-- Un utilisateur propose (pending) ; un admin peut publier directement.
grant insert (status) on public.places to authenticated;
drop policy "Un compte propose un lieu, en attente de vérification" on public.places;
create policy "Un compte propose un lieu ; un admin le publie directement"
  on public.places for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (status = 'pending' or (status = 'published' and (select public.has_role('admin'))))
  );

-- Les admins corrigent, publient ou retirent n'importe quel lieu.
grant update (name, category_slug, subcategory, district, address, phone, lat, lng, status)
  on public.places to authenticated;
create policy "Les admins modifient les lieux"
  on public.places for update to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));

-- ---------------------------------------------------------------------------
-- Avis donnés sur place
-- L'app envoie la position de l'appareil (visit_lat / visit_lng) avec l'avis. Le
-- trigger ne garde que la conclusion (on_site) et EFFACE les coordonnées : les
-- déplacements des utilisateurs ne sont jamais conservés.
-- ---------------------------------------------------------------------------

alter table public.reviews
  add column on_site   boolean not null default false,
  add column visit_lat double precision check (visit_lat between -90 and 90),
  add column visit_lng double precision check (visit_lng between -180 and 180);

grant insert (visit_lat, visit_lng) on public.reviews to authenticated;
grant update (visit_lat, visit_lng) on public.reviews to authenticated;

create function private.check_review_on_site()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- GPS en ville : 20 à 50 m d'imprécision, davantage entre les immeubles.
  c_radius_m constant double precision := 300;
  v_lat double precision;
  v_lng double precision;
begin
  new.on_site := false;

  if new.visit_lat is not null and new.visit_lng is not null then
    select p.lat, p.lng into v_lat, v_lng from public.places p where p.id = new.place_id;
    if v_lat is not null
       and public.distance_meters(new.visit_lat, new.visit_lng, v_lat, v_lng) <= c_radius_m then
      new.on_site := true;
    end if;
  end if;

  -- Un avis modifié plus tard, de chez soi, reste un avis donné sur place.
  if tg_op = 'UPDATE' then
    new.on_site := new.on_site or old.on_site;
  end if;

  new.visit_lat := null;
  new.visit_lng := null;
  return new;
end;
$$;

create trigger reviews_check_on_site
  before insert or update on public.reviews
  for each row execute function private.check_review_on_site();

-- Les lieux à confirmer peuvent recevoir des avis : c'est ainsi qu'ils sont validés.
drop policy "Un compte note un lieu publié" on public.reviews;
create policy "Un compte note un lieu publié ou à confirmer"
  on public.reviews for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.places p
      where p.id = place_id and p.status in ('published', 'pending')
    )
  );

-- ---------------------------------------------------------------------------
-- Agrégats + publication automatique à 3 avis sur place
-- (remplace la version de la migration triggers)
-- ---------------------------------------------------------------------------

create or replace function private.refresh_place_stats(p_place_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_required_on_site constant integer := 3;
begin
  -- Verrouille le lieu AVANT de compter : deux avis publiés au même instant
  -- s'attendent, et le second recompte en voyant le premier.
  perform 1 from public.places where id = p_place_id for update;

  update public.places p
  set
    rating_count        = s.total,
    rating_avg          = coalesce(round(s.average, 2), 0),
    rating_distribution = array[s.r1, s.r2, s.r3, s.r4, s.r5],
    criteria_avgs       = coalesce(c.averages, '{}'::jsonb),
    on_site_count       = s.on_site,
    -- Publication, jamais l'inverse : un lieu validé le reste si un avis disparaît.
    status = case
      when p.status = 'pending' and p.lat is not null and s.on_site >= c_required_on_site
        then 'published'
      else p.status
    end
  from
    (
      select
        count(*)::integer                                       as total,
        avg(r.rating)                                           as average,
        count(*) filter (where r.rating = 1)::integer           as r1,
        count(*) filter (where r.rating = 2)::integer           as r2,
        count(*) filter (where r.rating = 3)::integer           as r3,
        count(*) filter (where r.rating = 4)::integer           as r4,
        count(*) filter (where r.rating = 5)::integer           as r5,
        count(distinct r.author_id) filter (where r.on_site)::integer as on_site
      from public.reviews r
      where r.place_id = p_place_id
    ) s,
    (
      select jsonb_object_agg(t.key, round(t.average, 2)) as averages
      from (
        select e.key, avg(e.value::numeric) as average
        from public.reviews r
        cross join lateral jsonb_each_text(r.criteria) e
        where r.place_id = p_place_id
        group by e.key
      ) t
    ) c
  where p.id = p_place_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- nearby_places : peut inclure les lieux à confirmer, et renvoie leur statut.
-- Le type de retour change : il faut supprimer puis recréer la fonction.
-- ---------------------------------------------------------------------------

drop function public.nearby_places(
  double precision, double precision, text, text, text, text, double precision, integer, integer
);

create function public.nearby_places(
  p_lat             double precision,
  p_lng             double precision,
  p_category        text default null,
  p_district        text default null,
  p_search          text default null,
  p_sort            text default 'rating',
  p_radius_m        double precision default null,
  p_limit           integer default 50,
  p_offset          integer default 0,
  -- false pour les classements, true pour la recherche et « Près de vous ».
  p_include_pending boolean default false
)
returns table (
  id                  uuid,
  name                text,
  category_slug       text,
  subcategory         text,
  district            text,
  city                text,
  address             text,
  phone               text,
  cover_url           text,
  lat                 double precision,
  lng                 double precision,
  rating_avg          numeric,
  rating_count        integer,
  rating_distribution integer[],
  criteria_avgs       jsonb,
  status              text,
  on_site_count       integer,
  distance_m          double precision,
  score               numeric
)
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      '%' || extensions.unaccent(
        'extensions.unaccent'::regdictionary, lower(nullif(btrim(p_search), ''))
      ) || '%' as needle,
      p_radius_m / 111320.0                              as dlat,
      p_radius_m / (111320.0 * cos(radians(p_lat)))      as dlng
  ),
  candidates as (
    select
      p.*,
      public.distance_meters(p_lat, p_lng, p.lat, p.lng)    as distance_m,
      public.bayesian_score(p.rating_avg, p.rating_count)   as score
    from public.places p, params
    where (p.status = 'published' or (p_include_pending and p.status = 'pending'))
      and (p_category is null or p.category_slug = p_category)
      and (p_district is null or p.district = p_district)
      and (
        params.needle is null
        or extensions.unaccent(
             'extensions.unaccent'::regdictionary,
             lower(p.name || ' ' || coalesce(p.subcategory, '') || ' ' || p.district)
           ) like params.needle
      )
      and (
        p_radius_m is null
        or (p.lat between p_lat - params.dlat and p_lat + params.dlat
            and p.lng between p_lng - params.dlng and p_lng + params.dlng)
      )
  )
  select
    c.id, c.name, c.category_slug, c.subcategory, c.district, c.city, c.address,
    c.phone, c.cover_url, c.lat, c.lng, c.rating_avg, c.rating_count,
    c.rating_distribution, c.criteria_avgs, c.status, c.on_site_count, c.distance_m, c.score
  from candidates c
  where p_radius_m is null or c.distance_m <= p_radius_m
  order by
    case when p_sort = 'distance' then c.distance_m end asc,
    c.score desc,
    c.rating_count desc,
    c.distance_m asc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.nearby_places(double precision, double precision, text, text, text, text, double precision, integer, integer, boolean) from public;
grant execute on function public.nearby_places(double precision, double precision, text, text, text, text, double precision, integer, integer, boolean)
  to anon, authenticated, service_role;
