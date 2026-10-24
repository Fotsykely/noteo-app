import { type Href, router } from 'expo-router';

/**
 * Retour en arrière sûr. Sur le web, un accès direct par URL ou un rechargement n'a pas
 * d'historique : `router.back()` ne ferait rien et l'utilisateur resterait bloqué.
 */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
