#!/usr/bin/env node
/**
 * Import du catalogue OpenStreetMap du Grand Antananarivo.
 *
 * Interroge l'API Overpass, classe chaque objet dans une catégorie Noteo, le
 * rattache au quartier OSM le plus proche et écrit un fichier SQL rejouable :
 * les lieux déjà importés sont mis à jour (clé `osm_id`), jamais dupliqués.
 *
 *   node scripts/import-osm.mjs            # télécharge puis génère
 *   node scripts/import-osm.mjs --offline  # régénère depuis le dernier téléchargement
 *
 * Puis envoi sur Supabase (port 6543, le 5432 étant bloqué sur certains réseaux) :
 *   psql "postgresql://postgres.<ref>:$PW@aws-1-eu-west-3.pooler.supabase.com:6543/postgres" \
 *     -v ON_ERROR_STOP=1 -f supabase/import/osm_places.sql
 *
 * Données © les contributeurs d'OpenStreetMap, licence ODbL : l'attribution doit
 * figurer dans l'app.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, 'scripts', '.osm-cache');
const OUTPUT = join(ROOT, 'supabase', 'import', 'osm_places.sql');

/** Grand Tana : la commune urbaine plus Ivato, Talatamaty, Andoharanofotsy (sud, ouest, nord, est). */
const BBOX = '-19.02,47.42,-18.77,47.62';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'Noteo-import/0.1 (github.com/Fotsykely/noteo-app)';

/** Au-delà, le quartier le plus proche n'a plus de sens : on se rabat sur les villages. */
const MAX_DISTRICT_DISTANCE_M = 3000;
/**
 * Deux objets de même nom plus proches que ça sont le même lieu (point + contour
 * du bâtiment). Large à cause des hôpitaux, dont le contour couvre tout un site.
 */
const DUPLICATE_DISTANCE_M = 250;

// ---------------------------------------------------------------------------
// Classement des étiquettes OSM dans les catégories Noteo
// ---------------------------------------------------------------------------

const startsWith = (name, ...words) =>
  words.some((word) => new RegExp(`^${word}\\b`, 'i').test(name));
const contains = (name, pattern) => new RegExp(pattern, 'i').test(name);

/**
 * Les étiquettes santé d'OSM sont peu fiables à Tana (CSB en « doctors », cabinets
 * en « hospital ») : le nom tranche d'abord, l'étiquette sert de repli.
 * L'ordre compte : « Centre hospitalier » est un hôpital, pas un centre de santé.
 */
function healthSubcategory(name, amenity) {
  if (contains(name, 'dentaire|dentiste|stomatolog')) return 'Dentiste';
  if (contains(name, 'hospitalier|h[oô]pita|\\bchu|maternit')) return 'Hôpital';
  if (contains(name, '\\bcsb|centre de sant|dispensaire|\\bostie\\b')) return 'Centre de santé';
  if (contains(name, 'clinique|clinic|centre m[ée]dical|espace m[ée]dical|espace sant')) return 'Clinique';
  if (contains(name, '^(cabinet|docteur|dr\\.?)\\b')) return 'Médecin généraliste';
  return { hospital: 'Hôpital', clinic: 'Clinique' }[amenity] ?? 'Médecin généraliste';
}

/**
 * Renvoie { category, subcategory } ou null si l'objet n'entre pas dans le MVP.
 * Les sous-catégories doivent exister dans src/constants/categories.ts.
 */
function classify(tags) {
  const name = tags.name ?? '';
  const { amenity, shop, healthcare } = tags;

  switch (amenity) {
    case 'restaurant':
    case 'food_court':
      // « Hotely » : la gargote malgache.
      return { category: 'resto', subcategory: startsWith(name, 'hotely') ? 'Gargote' : 'Restaurant' };
    case 'fast_food':
      return { category: 'resto', subcategory: 'Fast-food' };
    case 'cafe':
      return { category: 'resto', subcategory: 'Café' };
    case 'bar':
    case 'pub':
      return { category: 'resto', subcategory: 'Bar' };
    case 'pharmacy':
      return { category: 'sante', subcategory: 'Pharmacie' };
    case 'dentist':
      return { category: 'sante', subcategory: 'Dentiste' };
    case 'doctors':
    case 'clinic':
    case 'hospital':
      return { category: 'sante', subcategory: healthSubcategory(name, amenity) };
    case 'car_wash':
      return { category: 'garage', subcategory: 'Lavage' };
  }

  switch (shop) {
    case 'bakery':
    case 'pastry':
      return { category: 'resto', subcategory: 'Pâtisserie' };
    case 'car_repair':
      return { category: 'garage', subcategory: contains(name, 'carrosserie') ? 'Carrosserie' : 'Garage auto' };
    case 'tyres':
      return { category: 'garage', subcategory: 'Pneus' };
  }

  switch (healthcare) {
    case 'laboratory':
      return { category: 'sante', subcategory: 'Laboratoire' };
    case 'centre':
      return { category: 'sante', subcategory: healthSubcategory(name, 'clinic') };
  }

  return null;
}

const PLACES_QUERY = `[out:json][timeout:180];
(
  nwr[amenity~"^(restaurant|food_court|fast_food|cafe|bar|pub|pharmacy|dentist|doctors|clinic|hospital|car_wash)$"](${BBOX});
  nwr[shop~"^(bakery|pastry|car_repair|tyres)$"](${BBOX});
  nwr[healthcare~"^(laboratory|centre)$"](${BBOX});
);
out center tags;`;

const DISTRICTS_QUERY = `[out:json][timeout:120];
nwr[place~"^(suburb|quarter|village)$"][name](${BBOX});
out center tags;`;

// ---------------------------------------------------------------------------
// Téléchargement (avec cache et nouvelles tentatives : Overpass sature souvent)
// ---------------------------------------------------------------------------

async function overpass(query, cacheName, offline) {
  const cachePath = join(CACHE_DIR, `${cacheName}.json`);
  if (offline) return JSON.parse(await readFile(cachePath, 'utf8')).elements;

  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ data: query }),
    });
    const text = await response.text();

    if (response.ok && text.startsWith('{')) {
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(cachePath, text);
      return JSON.parse(text).elements;
    }

    const wait = attempt * 30;
    console.warn(`Overpass indisponible (HTTP ${response.status}), nouvel essai dans ${wait} s…`);
    await new Promise((resolve) => setTimeout(resolve, wait * 1000));
  }
  throw new Error('Overpass ne répond pas. Réessayer plus tard, ou relancer avec --offline.');
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Même formule que distanceMeters() dans src/lib/utils.ts. */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const position = (element) =>
  element.type === 'node'
    ? { lat: element.lat, lng: element.lon }
    : element.center && { lat: element.center.lat, lng: element.center.lon };

/** Espaces normalisés, sans retour à la ligne ; null si vide. */
const clean = (value, max) => {
  const text = value?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const normalizeName = (name) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Littéral SQL : NULL ou chaîne entre apostrophes (apostrophes doublées). */
const sql = (value) =>
  value === null || value === undefined
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replace(/'/g, "''")}'`;

// ---------------------------------------------------------------------------
// Programme
// ---------------------------------------------------------------------------

const offline = process.argv.includes('--offline');

const rawPlaces = await overpass(PLACES_QUERY, 'places', offline);
const rawDistricts = await overpass(DISTRICTS_QUERY, 'districts', offline);

const districts = rawDistricts
  .map((element) => ({ name: clean(element.tags.name, 60), kind: element.tags.place, ...position(element) }))
  .filter((district) => district.name && district.lat !== undefined);
const urbanDistricts = districts.filter((district) => district.kind !== 'village');

function nearestDistrict(point) {
  const nearest = (list) =>
    list.reduce(
      (best, district) => {
        const distance = distanceMeters(point, district);
        return distance < best.distance ? { name: district.name, distance } : best;
      },
      { name: null, distance: Infinity }
    );
  const urban = nearest(urbanDistricts);
  return urban.distance <= MAX_DISTRICT_DISTANCE_M ? urban.name : nearest(districts).name;
}

const skipped = { unnamed: 0, outOfScope: 0, duplicate: 0 };
const places = [];

for (const element of rawPlaces) {
  const tags = element.tags ?? {};
  const name = clean(tags.name, 120);
  const point = position(element);
  if (!name || name.length < 2 || !point) {
    skipped.unnamed++;
    continue;
  }

  const kind = classify(tags);
  if (!kind) {
    skipped.outOfScope++;
    continue;
  }

  const key = normalizeName(name);
  if (places.some((place) => place.key === key && distanceMeters(place, point) < DUPLICATE_DISTANCE_M)) {
    skipped.duplicate++;
    continue;
  }

  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  // Plusieurs numéros sont séparés par « ; » dans OSM : on garde le premier.
  const phone = clean((tags.phone ?? tags['contact:phone'])?.split(';')[0], 30);

  places.push({
    key,
    osmId: `${element.type}/${element.id}`,
    name,
    category: kind.category,
    subcategory: kind.subcategory,
    district: nearestDistrict(point),
    city: clean(tags['addr:city'], 60) ?? 'Antananarivo',
    address: clean(street, 200),
    phone,
    lat: Number(point.lat.toFixed(7)),
    lng: Number(point.lng.toFixed(7)),
  });
}

places.sort((a, b) => a.osmId.localeCompare(b.osmId));

const rows = places.map(
  (p) =>
    `  (${[p.osmId, p.name, p.category, p.subcategory, p.district, p.city, p.address, p.phone, p.lat, p.lng]
      .map(sql)
      .join(', ')}, 'published')`
);

const output = `-- Généré par scripts/import-osm.mjs le ${new Date().toISOString()} — ne pas modifier à la main.
-- ${places.length} lieux du Grand Antananarivo. Données © les contributeurs d'OpenStreetMap (ODbL).
--
-- Rejouable : un lieu déjà importé est mis à jour, son statut (publié, rejeté par
-- la modération) et ses avis sont conservés. Un lieu disparu d'OSM n'est pas
-- supprimé : il peut avoir des avis.

begin;

-- Les 18 lieux fictifs du seed.
delete from public.places where id::text like '00000000-0000-4000-8000-%';

insert into public.places
  (osm_id, name, category_slug, subcategory, district, city, address, phone, lat, lng, status)
values
${rows.join(',\n')}
on conflict (osm_id) do update set
  name          = excluded.name,
  category_slug = excluded.category_slug,
  subcategory   = excluded.subcategory,
  district      = excluded.district,
  city          = excluded.city,
  address       = excluded.address,
  phone         = excluded.phone,
  lat           = excluded.lat,
  lng           = excluded.lng;

commit;
`;

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, output);

// Bilan
const count = (field) =>
  Object.entries(Object.groupBy(places, (p) => p[field]))
    .map(([value, list]) => [value, list.length])
    .sort((a, b) => b[1] - a[1]);

console.log(`\n${places.length} lieux écrits dans ${OUTPUT.replace(ROOT + '/', '')}`);
console.log(
  `Écartés : ${skipped.unnamed} sans nom, ${skipped.duplicate} doublons, ${skipped.outOfScope} hors périmètre`
);
console.log('\nPar catégorie :', Object.fromEntries(count('category')));
console.log('Par sous-catégorie :', Object.fromEntries(count('subcategory')));
console.log(`\n${new Set(places.map((p) => p.district)).size} quartiers. Les plus fournis :`);
console.log(Object.fromEntries(count('district').slice(0, 15)));
