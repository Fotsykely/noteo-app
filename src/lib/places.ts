/**
 * Conversion des lignes Supabase (snake_case, colonnes nullables) vers le modèle
 * de l'app (src/types). Les écrans ne manipulent jamais les lignes brutes.
 */
import type { CategorySlug, Place, Review } from '@/types';
import type { Database, Json } from '@/types/database';

export type SortMode = 'rating' | 'distance';

export type PlaceWithDistance = Place & { distance: number };

type PlaceRow = Database['public']['Tables']['places']['Row'];
type NearbyRow = Database['public']['Functions']['nearby_places']['Returns'][number];

/**
 * Colonnes communes à la table et à la fonction nearby_places. Le générateur de
 * types ne sait pas qu'une colonne renvoyée par une fonction peut être nulle :
 * on les traite toutes comme nullables.
 */
type PlaceLike = {
  [K in keyof NearbyRow & keyof PlaceRow]: PlaceRow[K] | null;
} & { osm_id?: string | null };

/** `{"gout": 4.5}` en JSON → Record typé ; ignore toute valeur non numérique. */
function toNumberRecord(value: Json | null): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    const number = Number(entry);
    if (Number.isFinite(number)) result[key] = number;
  }
  return result;
}

function toDistribution(values: number[] | null): Place['distribution'] {
  const [one = 0, two = 0, three = 0, four = 0, five = 0] = values ?? [];
  return [one, two, three, four, five];
}

export function mapPlace(row: PlaceLike): Place {
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    categorySlug: row.category_slug as CategorySlug,
    subcategory: row.subcategory ?? undefined,
    district: row.district ?? '',
    city: row.city ?? 'Antananarivo',
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: row.rating_count ?? 0,
    criteriaAvgs: toNumberRecord(row.criteria_avgs),
    distribution: toDistribution(row.rating_distribution),
    osmId: row.osm_id ?? undefined,
  };
}

export function mapNearbyPlace(row: NearbyRow): PlaceWithDistance {
  return { ...mapPlace(row), distance: row.distance_m };
}

type ReviewRow = {
  id: string;
  place_id: string;
  rating: number;
  comment: string | null;
  criteria: Json;
  created_at: string;
  author: { display_name: string } | null;
};

export function mapReview(row: ReviewRow): Review {
  const authorName = row.author?.display_name ?? 'Utilisateur';
  return {
    id: row.id,
    placeId: row.place_id,
    authorName,
    authorInitials: initials(authorName),
    rating: row.rating,
    comment: row.comment?.trim() || undefined,
    criteria: toNumberRecord(row.criteria),
    createdAt: row.created_at,
  };
}

/** « Miora Rakoto » → « MR » ; « tojo » → « T ». */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Libellé secondaire d'un lieu : « Dentiste · Ivandry ». */
export function placeSubtitle(place: Place, fallbackCategory: string): string {
  return `${place.subcategory ?? fallbackCategory} · ${place.district}`;
}
