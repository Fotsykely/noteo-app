import type { Coordinates } from '@/types';

/** Centre d'Antananarivo (Analakely) : cadrage par défaut des cartes et centre de la zone couverte. */
export const TANA_CENTER: Coordinates = { lat: -18.9101, lng: 47.5251 };

/**
 * Au-delà de cette distance du centre, l'utilisateur est hors du catalogue (voyage,
 * émulateur réglé ailleurs) : on ne lui affiche aucune distance, et un lieu ne peut
 * pas y être placé.
 */
export const SERVICE_RADIUS_M = 40_000;
