-- Noteo — la position d'un lieu proposé devient obligatoire.
--
-- Avant : sans GPS, un lieu était créé sans position et attendait un admin ; il ne
-- pouvait jamais être confirmé par les avis sur place (la position sert de référence).
-- Maintenant : l'app impose une position (GPS ou repère placé sur la carte), et un
-- modérateur (admin compris) publie directement ses lieux.
--
-- Côté lecture : sans position de l'appareil, l'app n'envoie plus de point de
-- départ à `nearby_places` ; les lieux sont alors renvoyés sans distance.

-- ---------------------------------------------------------------------------
-- Insertion : position obligatoire, publication directe réservée aux modérateurs
-- ---------------------------------------------------------------------------

drop policy "Un compte propose un lieu ; un admin le publie directement" on public.places;
create policy "Un compte propose un lieu ; un modérateur le publie directement"
  on public.places for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and lat is not null
    and lng is not null
    and (status = 'pending' or (status = 'published' and (select public.is_moderator())))
  );

-- ---------------------------------------------------------------------------
-- nearby_places : point de départ facultatif.
-- Même signature : `create or replace` suffit, les droits sont conservés.
-- `distance_meters(null, …)` renvoie null, et `order by … asc` place les null en
-- dernier : le classement par note est inchangé, `distance_m` vaut null.
-- ---------------------------------------------------------------------------

create or replace function public.nearby_places(
  p_lat             double precision default null,
  p_lng             double precision default null,
  p_category        text default null,
  p_district        text default null,
  p_search          text default null,
  p_sort            text default 'rating',
  p_radius_m        double precision default null,
  p_limit           integer default 50,
  p_offset          integer default 0,
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
