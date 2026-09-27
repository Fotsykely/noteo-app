import type { Coordinates } from '@/types';

/** Centre d'Antananarivo (Analakely) : position par défaut sans géolocalisation. */
export const TANA_CENTER: Coordinates = { lat: -18.9101, lng: 47.5251 };

/**
 * Au-delà de cette distance du centre, l'utilisateur est hors du catalogue (voyage,
 * émulateur réglé ailleurs) : on retombe sur le centre de Tana.
 */
export const SERVICE_RADIUS_M = 40_000;
