import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';

/** Aligné sur le point de rupture `lg` de Tailwind. */
export const DESKTOP_BREAKPOINT = 1024;

/**
 * Vrai sur les grands écrans (navigateur, tablette en paysage).
 * Sert aux changements de structure ; pour le simple style, préférer
 * les variantes `lg:` de NativeWind.
 */
export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_BREAKPOINT;
}

const subscribeNothing = () => () => {};

/**
 * Faux pendant le pré-rendu web et l'hydratation, vrai ensuite. Le HTML statique est calculé
 * sans largeur d'écran, donc en mise en page mobile : on masque la page jusqu'à ce que le
 * client ait choisi la bonne structure, pour éviter un flash des onglets du bas sur desktop.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false
  );
}

/**
 * Colonnes de cartes sur grand écran. La barre latérale retire 248 px au contenu : les
 * seuils sont décalés pour garder des cartes d'au moins 230 px.
 */
export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  return width >= 1536 ? 5 : width >= 1280 ? 4 : 3;
}
