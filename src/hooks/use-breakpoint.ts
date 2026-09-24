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
