import { Platform, type TextStyle } from 'react-native';

/**
 * Supprime le liseré de focus bleu que le navigateur ajoute aux champs.
 * Sans effet sur mobile. Toujours l'accompagner d'un indicateur de focus
 * visible (bordure de marque), sinon la navigation au clavier devient aveugle.
 */
export const noWebOutline = (Platform.OS === 'web'
  ? { outlineStyle: 'none' }
  : {}) as TextStyle;

/**
 * Barres de défilement : masquées au doigt (mobile), visibles au pointeur (web), où elles
 * indiquent la position et permettent de faire glisser la page.
 */
export const showScrollbar = Platform.OS === 'web';

/** Concatène des classes conditionnelles sans dépendance externe. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Affiche une note : 4 → « 4,0 », 4.25 → « 4,3 ». */
export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

/** « 1 avis » / « 128 avis ». */
export function formatReviewCount(count: number): string {
  return count <= 1 ? `${count} avis` : `${count} avis`;
}

/** Distance à vol d'oiseau en mètres entre deux points (formule de haversine). */
export function distanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** « 450 m » / « 2,3 km ». */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

/**
 * Moyenne bayésienne : empêche un lieu noté 5,0 par une seule personne
 * de dépasser un lieu noté 4,7 par deux cents personnes.
 *
 * @param prior moyenne globale de la plateforme
 * @param weight nombre d'avis « fictifs » au niveau du prior (plus il est élevé,
 *               plus il faut d'avis réels pour s'en écarter)
 */
export function bayesianScore(
  ratingAvg: number,
  ratingCount: number,
  prior = 4.1,
  weight = 5
): number {
  return (prior * weight + ratingAvg * ratingCount) / (weight + ratingCount);
}

/** Date relative courte en français : « il y a 3 jours ». */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days < 1) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 30) return `il y a ${days} jours`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'il y a 1 an' : `il y a ${years} ans`;
}
