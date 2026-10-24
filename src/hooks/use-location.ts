import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { SERVICE_RADIUS_M, TANA_CENTER } from '@/constants/geo';
import { distanceMeters } from '@/lib/utils';
import type { Coordinates } from '@/types';

/**
 * - `device`  : position réelle de l'appareil
 * - `denied`  : autorisation refusée ou position indisponible → pas de position
 * - `outside` : appareil hors du Grand Tana → pas de position
 */
export type LocationSource = 'device' | 'denied' | 'outside';

/** `origin` n'est renseignée que pour une position réelle : sans elle, aucune distance n'est affichée. */
export type UserLocation = { origin: Coordinates | null; source: LocationSource };

/**
 * Au-delà, on n'attend plus : mieux vaut une liste tout de suite qu'une liste parfaite.
 * Sur le web, un visiteur peut ignorer indéfiniment la demande d'autorisation du
 * navigateur ; s'il accepte plus tard, la position est reprise au prochain retour
 * sur la page, une fois la précédente périmée.
 */
const PERMISSION_TIMEOUT_MS = 10_000;
const POSITION_TIMEOUT_MS = 8000;

const fallback = (source: LocationSource): UserLocation => ({ origin: null, source });

const withTimeout = <T>(promise: Promise<T>, ms: number) =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

async function locate(): Promise<UserLocation> {
  try {
    // On ne pose la question qu'une fois : une permission déjà refusée est relue en
    // silence (sinon l'écran rouvrirait la demande à chaque retour sur l'accueil).
    // C'est le bouton « Activer » qui la redemande explicitement.
    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status === Location.PermissionStatus.UNDETERMINED) {
      permission =
        (await withTimeout(Location.requestForegroundPermissionsAsync(), PERMISSION_TIMEOUT_MS)) ??
        permission;
    }
    if (permission.status !== Location.PermissionStatus.GRANTED) return fallback('denied');

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
 * Position fraîche de l'appareil, pour situer un lieu proposé ou vérifier qu'un avis
 * est donné sur place. Contrairement à `useLocation`, pas de dernière position
 * connue (elle peut dater de dix minutes et d'un autre quartier) ni de repli sur le
 * centre : `null` si elle est indisponible.
 */
export async function getVisitPosition(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      15_000
    );
    return position ? { lat: position.coords.latitude, lng: position.coords.longitude } : null;
  } catch {
    return null;
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
    // Position refusée : toujours « périmée », donc relue au retour dans l'app (par
    // exemple après avoir activé la localisation dans les réglages du téléphone).
    staleTime: (query) => (query.state.data?.source === 'denied' ? 0 : 5 * 60_000),
    retry: false,
  });
  return data ?? null;
}

/**
 * Action du bouton « Activer la localisation » : redemande l'autorisation, ou ouvre
 * les réglages de l'appareil quand le système ne la redemande plus (refus définitif,
 * « Ne plus demander » sur Android).
 */
export function useEnableLocation() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();
      if (current.status !== Location.PermissionStatus.GRANTED && !current.canAskAgain) {
        // Au retour dans l'app, la position refusée est relue (voir staleTime).
        await Linking.openSettings();
        return;
      }
      await Location.requestForegroundPermissionsAsync();
    } catch {
      // Web : pas de réglages à ouvrir, le navigateur gère l'autorisation.
    }
    await queryClient.invalidateQueries({ queryKey: ['location'] });
  }, [queryClient]);
}
