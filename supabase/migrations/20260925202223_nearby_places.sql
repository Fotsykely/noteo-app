-- Noteo — recherche géographique et classement.
--
-- Appel depuis l'app : supabase.rpc('nearby_places', { p_lat, p_lng, ... })

-- ---------------------------------------------------------------------------
-- Moyenne bayésienne : un lieu noté 5 par une seule personne ne devance pas un
-- lieu noté 4,7 par deux cents. GARDER EN PHASE avec bayesianScore()
-- dans src/lib/utils.ts (mêmes prior et poids).
-- ---------------------------------------------------------------------------

create function public.bayesian_score(
  p_avg    numeric,
  p_count  integer,
  p_prior  numeric default 4.1,
  p_weight integer default 5
)
returns numeric
language sql
immutable
parallel safe
set search_path = ''
as $$
  select (p_prior * p_weight + p_avg * p_count) / (p_weight + p_count);
$$;

-- Distance à vol d'oiseau en mètres (haversine), comme distanceMeters() côté app.
create function public.distance_meters(
  p_lat1 double precision,
  p_lng1 double precision,
  p_lat2 double precision,
  p_lng2 double precision
)
returns double precision
language sql
immutable
parallel safe
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(p_lat2 - p_lat1) / 2), 2)
    + cos(radians(p_lat1)) * cos(radians(p_lat2)) * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
  ));
$$;

-- ---------------------------------------------------------------------------
-- Lieux publiés autour d'un point, filtrés et classés.
--
--   p_sort     'rating' (défaut) : moyenne bayésienne, puis nombre d'avis, puis distance
--              'distance'        : du plus proche au plus loin
--   p_radius_m rayon en mètres ; null = toute la ville
--   p_search   texte libre sur le nom, la sous-catégorie et le quartier,
--              insensible à la casse et aux accents
--
-- SECURITY INVOKER (défaut) : la RLS de places s'applique à l'appelant.
-- ---------------------------------------------------------------------------

create function public.nearby_places(
  p_lat      double precision,
  p_lng      double precision,
  p_category text default null,
  p_district text default null,
  p_search   text default null,
  p_sort     text default 'rating',
  p_radius_m double precision default null,
  p_limit    integer default 50,
  p_offset   integer default 0
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
  distance_m          double precision,
  score               numeric
)
language sql
stable
set search_path = ''
as $$
  with params as (
    select
      -- Forme à deux arguments : la forme courte cherche le dictionnaire dans le
      -- search_path, vide ici.
      '%' || extensions.unaccent(
        'extensions.unaccent'::regdictionary, lower(nullif(btrim(p_search), ''))
      ) || '%' as needle,
      -- Demi-côtés de la boîte englobante, en degrés (1° de latitude ≈ 111,32 km).
      p_radius_m / 111320.0                              as dlat,
      p_radius_m / (111320.0 * cos(radians(p_lat)))      as dlng
  ),
  candidates as (
    select
      p.*,
      public.distance_meters(p_lat, p_lng, p.lat, p.lng)    as distance_m,
      public.bayesian_score(p.rating_avg, p.rating_count)   as score
    from public.places p, params
    where p.status = 'published'
      and (p_category is null or p.category_slug = p_category)
      and (p_district is null or p.district = p_district)
      and (
        params.needle is null
        or extensions.unaccent(
             'extensions.unaccent'::regdictionary,
             lower(p.name || ' ' || coalesce(p.subcategory, '') || ' ' || p.district)
           ) like params.needle
      )
      -- Préfiltre grossier sur l'index (lat, lng) avant le calcul exact de distance.
      and (
        p_radius_m is null
        or (p.lat between p_lat - params.dlat and p_lat + params.dlat
            and p.lng between p_lng - params.dlng and p_lng + params.dlng)
      )
  )
  select
    c.id, c.name, c.category_slug, c.subcategory, c.district, c.city, c.address,
    c.phone, c.cover_url, c.lat, c.lng, c.rating_avg, c.rating_count,
    c.rating_distribution, c.criteria_avgs, c.distance_m, c.score
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

-- Fonctions appelables par l'API (le projet ne les expose pas automatiquement).
revoke all on function public.bayesian_score(numeric, integer, numeric, integer) from public;
revoke all on function public.distance_meters(double precision, double precision, double precision, double precision) from public;
revoke all on function public.nearby_places(double precision, double precision, text, text, text, text, double precision, integer, integer) from public;

grant execute on function public.bayesian_score(numeric, integer, numeric, integer)
  to anon, authenticated, service_role;
grant execute on function public.distance_meters(double precision, double precision, double precision, double precision)
  to anon, authenticated, service_role;
grant execute on function public.nearby_places(double precision, double precision, text, text, text, text, double precision, integer, integer)
  to anon, authenticated, service_role;
