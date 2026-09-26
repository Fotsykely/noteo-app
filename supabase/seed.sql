-- Données de démonstration — ÉTABLISSEMENTS FICTIFS.
--
-- Les 18 lieux de src/data/mock.ts, pour tester nearby_places avant l'import du
-- vrai catalogue (Étape 3). Aucun avis n'est créé (il faudrait de faux comptes) :
-- les agrégats sont posés directement et seront recalculés dès le premier vrai avis.
--
-- Identifiants fixes 00000000-0000-4000-8000-0000000000xx : pour tout effacer,
--   delete from public.places where id::text like '00000000-0000-4000-8000-%';

with seeds (n, name, category_slug, subcategory, district, address, phone, lat, lng, rating_avg, rating_count) as (
  values
    -- Restaurants
    (1,  'Chez Rado',                   'resto',  'Restaurant',          'Analakely',       '12 rue Indira Gandhi',        '+261 34 12 345 67', -18.9101, 47.5251, 4.6, 128),
    (2,  'Sakafo Gasy',                 'resto',  'Gargote',             'Behoririka',      'Rue Rainandriamampandry',     '+261 33 02 118 40', -18.9052, 47.5302, 4.3, 87),
    (3,  'Le Baobab Doré',              'resto',  'Restaurant',          'Ivandry',         'Lot II J 120 Ivandry',        '+261 34 55 901 23', -18.8702, 47.5351, 4.8, 64),
    (4,  'Pizza Analakely',             'resto',  'Fast-food',           'Analakely',       'Av. de l''Indépendance',      '+261 32 07 445 12', -18.9094, 47.5238, 3.9, 152),
    (5,  'Pâtisserie Soa',              'resto',  'Pâtisserie',          'Isoraka',         '8 rue Ratsimilaho',           '+261 34 71 220 05', -18.9131, 47.5202, 4.7, 41),
    (6,  'Café Ambatobe',               'resto',  'Bar',                 'Ambatobe',        'Route d''Ambohitrarahaba',    '+261 33 14 678 90', -18.8771, 47.5482, 4.1, 73),
    -- Santé
    (7,  'Cabinet Dentaire Ivandry',    'sante',  'Dentiste',            'Ivandry',         'Lot II B 45 bis Ivandry',     '+261 34 09 337 11', -18.8688, 47.5339, 4.9, 56),
    (8,  'Dr Rakoto Andrianina',        'sante',  'Médecin généraliste', 'Antaninarenina',  '3 place Colbert',             '+261 32 44 190 26', -18.9082, 47.5231, 4.5, 92),
    (9,  'Clinique Fanantenana',        'sante',  'Clinique',            'Ankorondrano',    'Rue Ravoninahitriniarivo',    '+261 20 22 640 00', -18.8851, 47.5223, 4.2, 210),
    (10, 'Pharmacie Andraharo',         'sante',  'Pharmacie',           'Andraharo',       'Explorer Business Park',      '+261 20 22 301 74', -18.8903, 47.5104, 4.4, 38),
    (11, 'Laboratoire Tsiky',           'sante',  'Laboratoire',         'Mahamasina',      'Rue Docteur Raseta',          '+261 34 88 512 03', -18.9182, 47.5243, 4.0, 45),
    (12, 'Cabinet Dentaire Talatamaty', 'sante',  'Dentiste',            'Talatamaty',      'Route de l''aéroport',        '+261 33 76 004 88', -18.8402, 47.4603, 4.6, 29),
    -- Garages
    (13, 'Garage Mamy Auto',            'garage', 'Garage auto',         'Ankorondrano',    'Rue Tsiombikibo',             '+261 34 20 771 45', -18.8838, 47.5209, 4.7, 83),
    (14, 'Méca Express',                'garage', 'Mécanicien',          'Andraharo',       'Bypass Andraharo',            '+261 32 11 908 32', -18.8912, 47.5088, 4.2, 61),
    (15, 'Carrosserie Faniry',          'garage', 'Carrosserie',         'Ivato',           'RN4 Ivato',                   '+261 34 63 210 77', -18.7974, 47.4791, 4.5, 34),
    (16, 'Pneus Plus Ivato',            'garage', 'Pneus',               'Ivato',           'RN4, face à l''aéroport',     '+261 33 40 556 19', -18.7996, 47.4812, 3.8, 57),
    (17, 'Lavage Auto Ambatobe',        'garage', 'Lavage',              'Ambatobe',        'Route d''Ambohitrarahaba',    '+261 34 17 883 60', -18.8759, 47.5471, 4.3, 25),
    (18, 'Garage Tsara',                'garage', 'Garage auto',         'Andoharanofotsy', 'RN7 Andoharanofotsy',         '+261 32 65 447 21', -18.9803, 47.5301, 4.4, 48)
),
-- Répartition plausible des étoiles autour de la moyenne (même courbe que mock.ts) ;
-- l'arrondi est rattrapé sur le nombre d'étoiles le plus proche de la moyenne.
weights as (
  select s.n, star, exp(-power(star - s.rating_avg, 2) / 0.6) as w
  from seeds s, generate_series(1, 5) star
),
buckets as (
  select w.n, star, round(w.w / sum(w.w) over (partition by w.n) * s.rating_count)::integer as c
  from weights w join seeds s using (n)
),
distributions as (
  select
    b.n,
    array_agg(
      b.c + case when b.star = round(s.rating_avg) then s.rating_count - t.total else 0 end
      order by b.star
    ) as distribution
  from buckets b
  join seeds s using (n)
  join (select n, sum(c)::integer as total from buckets group by n) t using (n)
  group by b.n
),
-- Moyennes par critère légèrement dispersées autour de la note globale.
criteria_avgs as (
  select
    s.n,
    jsonb_object_agg(
      c.slug,
      least(5, greatest(1, round(s.rating_avg + ((s.n * 7 + c.position * 3) % 9 - 4) * 0.1, 1)))
    ) as averages
  from seeds s
  join public.criteria c on c.category_slug = s.category_slug
  group by s.n
)
insert into public.places (
  id, name, category_slug, subcategory, district, address, phone, cover_url,
  lat, lng, status, rating_avg, rating_count, rating_distribution, criteria_avgs
)
select
  ('00000000-0000-4000-8000-' || lpad(s.n::text, 12, '0'))::uuid,
  s.name, s.category_slug, s.subcategory, s.district, s.address, s.phone,
  'https://picsum.photos/seed/noteo-' || s.n || '/800/600',
  s.lat, s.lng, 'published', s.rating_avg, s.rating_count, d.distribution, ca.averages
from seeds s
join distributions d using (n)
join criteria_avgs ca using (n)
on conflict (id) do nothing;
