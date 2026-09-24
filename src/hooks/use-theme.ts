import { useColorScheme } from 'react-native';

import { navigationTheme, palette } from '@/constants/theme';

/** Vrai quand l'appareil est en mode sombre. */
export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

/**
 * Couleurs résolues pour le thème courant, à utiliser avec les API qui
 * n'acceptent pas de classes NativeWind (icônes, navigation, barre de statut).
 */
export function useColors() {
  const isDark = useIsDark();
  const theme = isDark ? navigationTheme.dark : navigationTheme.light;

  return {
    isDark,
    ...theme,
    /** Texte secondaire */
    textMuted: isDark ? palette.ink[300] : palette.ink[500],
    /** Texte très discret / icônes inactives */
    textFaint: isDark ? palette.ink[500] : palette.ink[300],
    /** Fond de champ, d'avatar, de squelette */
    fill: isDark ? palette.surface.darkMuted : palette.ink[50],
    star: palette.star,
    brand: palette.brand[500],
  };
}
