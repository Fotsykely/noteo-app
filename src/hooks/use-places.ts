/**
 * Lecture du catalogue dans Supabase. Toute requête passe par React Query :
 * cache partagé entre écrans, nouvelles tentatives en cas de réseau instable.
 */
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { CATEGORIES } from '@/constants/categories';
import { useLocation } from '@/hooks/use-location';
import { mapNearbyPlace, mapPlace, mapReview, type SortMode } from '@/lib/places';
import { supabase } from '@/lib/supabase';
import type { CategorySlug, Coordinates, District } from '@/types';

export type PlaceFilters = {
  category?: CategorySlug | null;
  district?: string | null;
  search?: string;
  sort?: SortMode;
};

const RANKING_PAGE_SIZE = 30;

/**
 * Position arrondie à ~100 m pour la clé de cache : les petites variations du GPS
 * ne relancent pas la requête.
 */
const originKey = (origin: Coordinates) => [origin.lat.toFixed(3), origin.lng.toFixed(3)];

async function fetchNearby(origin: Coordinates, filters: PlaceFilters, limit: number, offset = 0) {
  const { data, error } = await supabase.rpc('nearby_places', {
    p_lat: origin.lat,
    p_lng: origin.lng,
    // `undefined` plutôt que `null` : l'argument est omis et prend sa valeur par défaut.
    p_category: filters.category ?? undefined,
    p_district: filters.district ?? undefined,
    p_search: filters.search?.trim() || undefined,
    p_sort: filters.sort ?? 'rating',
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return data.map(mapNearbyPlace);
}

/** Les N premiers lieux selon les filtres : accueil, recherche. */
export function useNearbyPlaces(
  filters: PlaceFilters,
  { limit = 20, enabled = true }: { limit?: number; enabled?: boolean } = {}
) {
  const location = useLocation();

  return useQuery({
    queryKey: ['places', 'nearby', location && originKey(location.origin), filters, limit],
    queryFn: () => fetchNearby(location!.origin, filters, limit),
    enabled: enabled && location !== null,
    // Pendant la frappe, garder les résultats précédents plutôt qu'un écran vide.
    placeholderData: keepPreviousData,
  });
}

/** Classement complet, chargé par pages au fil du défilement. */
export function useRankedPlaces(filters: PlaceFilters) {
  const location = useLocation();

  return useInfiniteQuery({
    queryKey: ['places', 'ranked', location && originKey(location.origin), filters],
    queryFn: ({ pageParam }) =>
      fetchNearby(location!.origin, filters, RANKING_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length < RANKING_PAGE_SIZE ? undefined : pages.length * RANKING_PAGE_SIZE,
    enabled: location !== null,
  });
}

export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: ['place', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('places').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data ? mapPlace(data) : null;
    },
    enabled: !!id,
  });
}

export function usePlaceReviews(placeId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, place_id, rating, comment, criteria, created_at, author:profiles(display_name)')
        .eq('place_id', placeId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data.map(mapReview);
    },
    enabled: !!placeId,
  });
}

/** Nombre de lieux publiés par catégorie, pour les tuiles de l'accueil. */
export function useCategoryCounts() {
  return useQuery({
    queryKey: ['places', 'counts'],
    queryFn: async () => {
      const results = await Promise.all(
        CATEGORIES.map((category) =>
          supabase
            .from('places')
            .select('id', { count: 'exact', head: true })
            .eq('category_slug', category.slug)
            .eq('status', 'published')
        )
      );
      const counts = {} as Record<CategorySlug, number>;
      results.forEach(({ count, error }, index) => {
        if (error) throw error;
        counts[CATEGORIES[index].slug] = count ?? 0;
      });
      return counts;
    },
    staleTime: 60 * 60_000,
  });
}

/** Quartiers ayant au moins un lieu (dans la catégorie), du plus fourni au moins fourni. */
export function useDistricts(category?: CategorySlug | null) {
  return useQuery({
    queryKey: ['districts', category ?? 'all'],
    queryFn: async (): Promise<District[]> => {
      const { data, error } = await supabase.rpc('list_districts', {
        p_category: category ?? undefined,
      });
      if (error) throw error;
      return data.map((row) => ({ name: row.name, placeCount: row.place_count }));
    },
    staleTime: 60 * 60_000,
  });
}
