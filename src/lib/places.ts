import { bayesianScore, distanceMeters } from '@/lib/utils';
import type { CategorySlug, Place } from '@/types';

export type SortMode = 'rating' | 'distance';

export type PlaceQuery = {
  categorySlug?: CategorySlug | null;
  district?: string | null;
  search?: string;
  sort?: SortMode;
};

export type PlaceWithDistance = Place & { distance: number };

/** Ajoute la distance à vol d'oiseau depuis la position de référence. */
export function withDistance(places: Place[], origin: { lat: number; lng: number }) {
  return places.map((place) => ({
    ...place,
    distance: distanceMeters(origin, { lat: place.lat, lng: place.lng }),
  }));
}

/** Normalise pour une recherche tolérante aux accents et à la casse. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtre et classe les lieux. Le tri par note utilise la moyenne bayésienne :
 * un lieu à 5,0 avec un seul avis ne doit pas dépasser un lieu à 4,7 avec deux cents.
 */
export function queryPlaces(
  places: Place[],
  origin: { lat: number; lng: number },
  { categorySlug, district, search, sort = 'rating' }: PlaceQuery = {}
): PlaceWithDistance[] {
  const needle = search ? normalize(search) : '';

  const filtered = withDistance(places, origin).filter((place) => {
    if (categorySlug && place.categorySlug !== categorySlug) return false;
    if (district && place.district !== district) return false;
    if (needle) {
      const haystack = normalize(`${place.name} ${place.subcategory} ${place.district}`);
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === 'distance') return a.distance - b.distance;
    return (
      bayesianScore(b.ratingAvg, b.ratingCount) - bayesianScore(a.ratingAvg, a.ratingCount)
    );
  });
}
