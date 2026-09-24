/**
 * Données de démonstration — ÉTABLISSEMENTS FICTIFS.
 *
 * Aucun de ces lieux n'existe : les noms, notes et avis sont inventés pour
 * construire l'interface. Ce fichier est remplacé par le vrai catalogue
 * Antananarivo (import OpenStreetMap + Supabase) à l'Étape 3.
 */

import { CATEGORY_BY_SLUG } from '@/constants/categories';
import type { CategorySlug, Place, Review } from '@/types';

/** Centre d'Antananarivo, utilisé tant que la géolocalisation réelle n'est pas branchée. */
export const TANA_CENTER = { lat: -18.8792, lng: 47.5079 };

/** Générateur pseudo-aléatoire déterministe : les données ne changent pas d'un rechargement à l'autre. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** Répartition plausible des étoiles, centrée sur la moyenne et dont la somme vaut `count`. */
function makeDistribution(avg: number, count: number): [number, number, number, number, number] {
  const weights = [1, 2, 3, 4, 5].map((star) => Math.exp(-((star - avg) ** 2) / 0.6));
  const total = weights.reduce((a, b) => a + b, 0);
  const buckets = weights.map((w) => Math.round((w / total) * count));

  let drift = count - buckets.reduce((a, b) => a + b, 0);
  let cursor = 4;
  while (drift !== 0) {
    const next = buckets[cursor] + Math.sign(drift);
    if (next >= 0) {
      buckets[cursor] = next;
      drift -= Math.sign(drift);
    }
    cursor = cursor === 0 ? 4 : cursor - 1;
  }
  return buckets as [number, number, number, number, number];
}

/** Moyennes par critère, réparties autour de la note globale. */
function makeCriteriaAvgs(categorySlug: CategorySlug, avg: number, seed: number) {
  const random = seeded(seed);
  const result: Record<string, number> = {};
  for (const criterion of CATEGORY_BY_SLUG[categorySlug].criteria) {
    const offset = (random() - 0.5) * 0.9;
    result[criterion.slug] = Math.min(5, Math.max(1, Math.round((avg + offset) * 10) / 10));
  }
  return result;
}

type Seed = {
  name: string;
  categorySlug: CategorySlug;
  subcategory: string;
  district: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  ratingAvg: number;
  ratingCount: number;
};

const SEEDS: Seed[] = [
  // ---- Restaurants ----
  { name: 'Chez Rado', categorySlug: 'resto', subcategory: 'Restaurant', district: 'Analakely', address: "12 rue Indira Gandhi", phone: '+261 34 12 345 67', lat: -18.9101, lng: 47.5251, ratingAvg: 4.6, ratingCount: 128 },
  { name: 'Sakafo Gasy', categorySlug: 'resto', subcategory: 'Gargote', district: 'Behoririka', address: 'Rue Rainandriamampandry', phone: '+261 33 02 118 40', lat: -18.9052, lng: 47.5302, ratingAvg: 4.3, ratingCount: 87 },
  { name: 'Le Baobab Doré', categorySlug: 'resto', subcategory: 'Restaurant', district: 'Ivandry', address: 'Lot II J 120 Ivandry', phone: '+261 34 55 901 23', lat: -18.8702, lng: 47.5351, ratingAvg: 4.8, ratingCount: 64 },
  { name: 'Pizza Analakely', categorySlug: 'resto', subcategory: 'Fast-food', district: 'Analakely', address: 'Av. de l’Indépendance', phone: '+261 32 07 445 12', lat: -18.9094, lng: 47.5238, ratingAvg: 3.9, ratingCount: 152 },
  { name: 'Pâtisserie Soa', categorySlug: 'resto', subcategory: 'Pâtisserie', district: 'Isoraka', address: '8 rue Ratsimilaho', phone: '+261 34 71 220 05', lat: -18.9131, lng: 47.5202, ratingAvg: 4.7, ratingCount: 41 },
  { name: 'Café Ambatobe', categorySlug: 'resto', subcategory: 'Bar', district: 'Ambatobe', address: 'Route d’Ambohitrarahaba', phone: '+261 33 14 678 90', lat: -18.8771, lng: 47.5482, ratingAvg: 4.1, ratingCount: 73 },

  // ---- Santé ----
  { name: 'Cabinet Dentaire Ivandry', categorySlug: 'sante', subcategory: 'Dentiste', district: 'Ivandry', address: 'Lot II B 45 bis Ivandry', phone: '+261 34 09 337 11', lat: -18.8688, lng: 47.5339, ratingAvg: 4.9, ratingCount: 56 },
  { name: 'Dr Rakoto Andrianina', categorySlug: 'sante', subcategory: 'Médecin généraliste', district: 'Antaninarenina', address: '3 place Colbert', phone: '+261 32 44 190 26', lat: -18.9082, lng: 47.5231, ratingAvg: 4.5, ratingCount: 92 },
  { name: 'Clinique Fanantenana', categorySlug: 'sante', subcategory: 'Clinique', district: 'Ankorondrano', address: 'Rue Ravoninahitriniarivo', phone: '+261 20 22 640 00', lat: -18.8851, lng: 47.5223, ratingAvg: 4.2, ratingCount: 210 },
  { name: 'Pharmacie Andraharo', categorySlug: 'sante', subcategory: 'Pharmacie', district: 'Andraharo', address: 'Explorer Business Park', phone: '+261 20 22 301 74', lat: -18.8903, lng: 47.5104, ratingAvg: 4.4, ratingCount: 38 },
  { name: 'Laboratoire Tsiky', categorySlug: 'sante', subcategory: 'Laboratoire', district: 'Mahamasina', address: 'Rue Docteur Raseta', phone: '+261 34 88 512 03', lat: -18.9182, lng: 47.5243, ratingAvg: 4.0, ratingCount: 45 },
  { name: 'Cabinet Dentaire Talatamaty', categorySlug: 'sante', subcategory: 'Dentiste', district: 'Talatamaty', address: 'Route de l’aéroport', phone: '+261 33 76 004 88', lat: -18.8402, lng: 47.4603, ratingAvg: 4.6, ratingCount: 29 },

  // ---- Garages ----
  { name: 'Garage Mamy Auto', categorySlug: 'garage', subcategory: 'Garage auto', district: 'Ankorondrano', address: 'Rue Tsiombikibo', phone: '+261 34 20 771 45', lat: -18.8838, lng: 47.5209, ratingAvg: 4.7, ratingCount: 83 },
  { name: 'Méca Express', categorySlug: 'garage', subcategory: 'Mécanicien', district: 'Andraharo', address: 'Bypass Andraharo', phone: '+261 32 11 908 32', lat: -18.8912, lng: 47.5088, ratingAvg: 4.2, ratingCount: 61 },
  { name: 'Carrosserie Faniry', categorySlug: 'garage', subcategory: 'Carrosserie', district: 'Ivato', address: 'RN4 Ivato', phone: '+261 34 63 210 77', lat: -18.7974, lng: 47.4791, ratingAvg: 4.5, ratingCount: 34 },
  { name: 'Pneus Plus Ivato', categorySlug: 'garage', subcategory: 'Pneus', district: 'Ivato', address: 'RN4, face à l’aéroport', phone: '+261 33 40 556 19', lat: -18.7996, lng: 47.4812, ratingAvg: 3.8, ratingCount: 57 },
  { name: 'Lavage Auto Ambatobe', categorySlug: 'garage', subcategory: 'Lavage', district: 'Ambatobe', address: 'Route d’Ambohitrarahaba', phone: '+261 34 17 883 60', lat: -18.8759, lng: 47.5471, ratingAvg: 4.3, ratingCount: 25 },
  { name: 'Garage Tsara', categorySlug: 'garage', subcategory: 'Garage auto', district: 'Andoharanofotsy', address: 'RN7 Andoharanofotsy', phone: '+261 32 65 447 21', lat: -18.9803, lng: 47.5301, ratingAvg: 4.4, ratingCount: 48 },
];

export const PLACES: Place[] = SEEDS.map((seed, index) => ({
  id: `place-${index + 1}`,
  name: seed.name,
  categorySlug: seed.categorySlug,
  subcategory: seed.subcategory,
  district: seed.district,
  city: 'Antananarivo',
  address: seed.address,
  phone: seed.phone,
  coverUrl: `https://picsum.photos/seed/noteo-${index + 1}/800/600`,
  lat: seed.lat,
  lng: seed.lng,
  ratingAvg: seed.ratingAvg,
  ratingCount: seed.ratingCount,
  criteriaAvgs: makeCriteriaAvgs(seed.categorySlug, seed.ratingAvg, index + 17),
  distribution: makeDistribution(seed.ratingAvg, seed.ratingCount),
}));

const AUTHORS = [
  'Miora R.',
  'Tojo A.',
  'Hery N.',
  'Fanja R.',
  'Naina M.',
  'Lalaina B.',
  'Rivo T.',
  'Onja S.',
  'Tiana H.',
  'Faniry L.',
];

const COMMENTS: Record<CategorySlug, string[]> = {
  resto: [
    'Très bon romazava, portions généreuses et service rapide. Je reviendrai.',
    "Cadre agréable et prix corrects. L'attente était un peu longue le midi.",
    'Le meilleur rapport qualité-prix du quartier selon moi.',
    'Bonne cuisine mais la salle est bruyante aux heures de pointe.',
    "Accueil vraiment chaleureux, on s'est senti bien reçus.",
    'Correct sans plus. Les plats étaient tièdes.',
  ],
  sante: [
    "Médecin à l'écoute, il prend le temps d'expliquer. Rien à redire.",
    "Cabinet propre et moderne. J'ai attendu 20 minutes malgré le rendez-vous.",
    'Très professionnel, je recommande sans hésiter.',
    "Le diagnostic était juste et le suivi sérieux. Tarifs raisonnables.",
    "Accueil un peu froid mais la prise en charge est de qualité.",
    'Rendez-vous obtenu rapidement, personnel aimable.',
  ],
  garage: [
    "Devis respecté au centime près, c'est assez rare pour le signaler.",
    'Réparation bien faite mais rendue avec deux jours de retard.',
    'Ils ont diagnostiqué la panne en 10 minutes. Très compétents.',
    "Prix annoncé au téléphone différent du prix final, attention.",
    'Travail soigné et véhicule rendu propre. Je recommande.',
    'Bon accueil, main-d’œuvre correcte et pièces disponibles.',
  ],
};

/** Quelques avis par lieu, cohérents avec sa note moyenne. */
export const REVIEWS: Review[] = PLACES.flatMap((place, placeIndex) => {
  const random = seeded(placeIndex * 97 + 3);
  const criteria = CATEGORY_BY_SLUG[place.categorySlug].criteria;
  const total = 3 + Math.floor(random() * 3);

  return Array.from({ length: total }, (_, reviewIndex) => {
    const jitter = Math.round(place.ratingAvg + (random() - 0.45) * 1.4);
    const rating = Math.min(5, Math.max(1, jitter));
    const author = AUTHORS[(placeIndex * 3 + reviewIndex) % AUTHORS.length];
    const pool = COMMENTS[place.categorySlug];

    return {
      id: `review-${placeIndex + 1}-${reviewIndex + 1}`,
      placeId: place.id,
      authorName: author,
      authorInitials: author
        .split(' ')
        .map((part) => part[0])
        .join(''),
      rating,
      comment: pool[(placeIndex + reviewIndex) % pool.length],
      criteria: criteria.reduce<Record<string, number>>((acc, criterion, i) => {
        acc[criterion.slug] = Math.min(5, Math.max(1, rating + (i % 2 === 0 ? 0 : -1)));
        return acc;
      }, {}),
      createdAt: new Date(Date.now() - (reviewIndex + 1) * 5 * 86_400_000).toISOString(),
    } satisfies Review;
  });
});

export function getPlace(id: string): Place | undefined {
  return PLACES.find((place) => place.id === id);
}

export function getReviewsForPlace(placeId: string): Review[] {
  return REVIEWS.filter((review) => review.placeId === placeId);
}
