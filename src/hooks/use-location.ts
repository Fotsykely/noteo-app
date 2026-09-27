import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

import { SERVICE_RADIUS_M, TANA_CENTER } from '@/constants/geo';
import { distanceMeters } from '@/lib/utils';
import type { Coordinates } from '@/types';

/**
 * - `device`  : position réelle de l'appareil
 * - `denied`  : autorisation refusée ou position indisponible → centre de Tana
 * - `outside` : appareil hors du Grand Tana → centre de Tana
 */
export type LocationSource = 'device' | 'denied' | 'outside';

export type UserLocation = { origin: Coordinates; source: LocationSource };

/**
 * Au-delà, on n'attend plus : mieux vaut une liste tout de suite qu'une liste parfaite.
 * Sur le web, un visiteur peut ignorer indéfiniment la demande d'autorisation du
 * navigateur ; s'il accepte plus tard, la position est reprise au prochain retour
 * sur la page, une fois la précédente périmée.
 */
const PERMISSION_TIMEOUT_MS = 10_000;
const POSITION_TIMEOUT_MS = 8000;

const fallback = (source: LocationSource): UserLocation => ({ origin: TANA_CENTER, source });

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

async function locate(): Promise<UserLocation> {
  try {
    const permission = await withTimeout(
      Location.requestForegroundPermissionsAsync(),
      PERMISSION_TIMEOUT_MS
    );
    if (permission?.status !== 'granted') return fallback('denied');

    // La dernière position connue est instantanée ; la position courante peut
    // prendre plusieurs secondes sur Android.
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 })) ??
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        POSITION_TIMEOUT_MS
      ));
    if (!position) return fallback('denied');

    const origin = { lat: position.coords.latitude, lng: position.coords.longitude };
    if (distanceMeters(origin, TANA_CENTER) > SERVICE_RADIUS_M) return fallback('outside');
    return { origin, source: 'device' };
  } catch {
    // Localisation désactivée dans les réglages, navigateur sans géolocalisation…
    return fallback('denied');
  }
}

/**
 * Position de l'utilisateur, partagée par tous les écrans (une seule demande
 * d'autorisation). `null` tant qu'elle n'est pas connue : les requêtes qui en
 * dépendent attendent, pour ne pas charger deux fois la même liste.
 */
export function useLocation(): UserLocation | null {
  const { data } = useQuery({
    queryKey: ['location'],
    queryFn: locate,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return data ?? null;
}
