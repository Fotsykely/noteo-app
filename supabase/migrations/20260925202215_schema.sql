-- Noteo — schéma de base.
--
-- Positions en lat/lng simples plutôt que PostGIS : une seule ville au MVP, quelques
-- milliers de lieux au plus, la distance se calcule en SQL (voir nearby_places).
-- Passer à PostGIS le jour où l'on ouvre d'autres villes.

-- Fonctions internes (triggers, recalculs) : hors du schéma public, donc jamais
-- exposées par l'API REST.
create schema if not exists private;
revoke all on schema private from public;

-- Recherche insensible aux accents (« Pâtisserie » trouvée avec « patisserie »).
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Référentiel : catégories et critères de notation
-- Miroir de src/constants/categories.ts (icônes et couleurs restent côté app).
-- ---------------------------------------------------------------------------

create table public.categories (
  slug     text primary key,
  name_fr  text not null,
  name_mg  text not null,
  position smallint not null
);

create table public.criteria (
  category_slug text not null references public.categories (slug) on delete cascade,
  slug          text not null,
  label_fr      text not null,
  label_mg      text not null,
  position      smallint not null,
  primary key (category_slug, slug)
);

-- Libellés malgaches à faire valider par un locuteur natif avant la production.
insert into public.categories (slug, name_fr, name_mg, position) values
  ('resto',  'Restaurants', 'Toeram-pisakafoanana', 1),
  ('sante',  'Santé',       'Fahasalamana',         2),
  ('garage', 'Garages',     'Toeram-panamboarana fiara',  3);

insert into public.criteria (category_slug, slug, label_fr, label_mg, position) values
  ('resto',  'gout',       'Goût',                     'Tsiro',            1),
  ('resto',  'prix',       'Rapport qualité-prix',     'Vidiny',           2),
  ('resto',  'accueil',    'Accueil',                  'Fandraisana',      3),
  ('sante',  'ecoute',     'Écoute',                   'Fihainoana',       1),
  ('sante',  'competence', 'Compétence',               'Fahaiza-manao',    2),
  ('sante',  'attente',    'Temps d''attente',         'Fiandrasana',      3),
  ('garage', 'honnetete',  'Honnêteté du prix',        'Fahamarinan-bidy', 1),
  ('garage', 'qualite',    'Qualité de la réparation', 'Kalitao',          2),
  ('garage', 'delai',      'Délai',                    'Fotoana',          3);

-- ---------------------------------------------------------------------------
-- Profils publics : un par compte, créé automatiquement (voir triggers).
-- L'e-mail reste dans auth.users et n'est jamais exposé ici.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lieux
-- ---------------------------------------------------------------------------

create table public.places (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 2 and 120),
  category_slug text not null references public.categories (slug),
  subcategory   text check (char_length(subcategory) <= 60),
  district      text not null check (char_length(district) <= 60),
  city          text not null default 'Antananarivo',
  address       text check (char_length(address) <= 200),
  phone         text check (char_length(phone) <= 30),
  cover_url     text,
  -- Facultatifs pour un lieu proposé (le formulaire ne demande pas la position),
  -- obligatoires une fois publié.
  lat           double precision check (lat between -90 and 90),
  lng           double precision check (lng between -180 and 180),
  -- 'pending' : proposé par un utilisateur, visible de lui seul jusqu'à vérification.
  status        text not null default 'pending'
                check (status in ('pending', 'published', 'rejected')),
  -- Identifiant OpenStreetMap (« node/123456 ») : évite les doublons à l'import (Étape 3).
  osm_id        text unique,
  created_by    uuid default auth.uid() references public.profiles (id) on delete set null,

  -- Agrégats tenus à jour par trigger à chaque avis : jamais écrits par l'app.
  rating_avg          numeric(3, 2) not null default 0,
  rating_count        integer not null default 0,
  -- index 0 = nombre d'avis à 1 étoile … index 4 = 5 étoiles
  rating_distribution integer[] not null default '{0,0,0,0,0}',
  -- moyenne par critère, indexée par slug : {"gout": 4.5, "prix": 3.8}
  criteria_avgs       jsonb not null default '{}',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint places_lat_lng_together check ((lat is null) = (lng is null)),
  constraint places_published_located check (status <> 'published' or lat is not null)
);

create index places_published_category_idx on public.places (category_slug)
  where status = 'published';
create index places_published_district_idx on public.places (district)
  where status = 'published';
-- Préfiltre par boîte englobante dans nearby_places.
create index places_lat_lng_idx on public.places (lat, lng)
  where status = 'published';
create index places_created_by_idx on public.places (created_by);

-- ---------------------------------------------------------------------------
-- Avis : un seul par personne et par lieu (modifiable ensuite).
-- ---------------------------------------------------------------------------

create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references public.places (id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text check (char_length(comment) <= 800),
  -- note par critère, facultative et partielle : {"gout": 5, "accueil": 4}
  -- clés et valeurs contrôlées par trigger selon la catégorie du lieu.
  criteria   jsonb not null default '{}' check (jsonb_typeof(criteria) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (place_id, author_id)
);

create index reviews_place_recent_idx on public.reviews (place_id, created_at desc);
create index reviews_author_recent_idx on public.reviews (author_id, created_at desc);
