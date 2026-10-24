/**
 * Jetons de design partagés. Les mêmes valeurs sont déclarées dans `tailwind.config.js`
 * pour les classes NativeWind ; ce fichier sert aux API qui exigent une couleur en JS
 * (navigation, barre de statut, icônes).
 */

export const palette = {
  brand: {
    50: '#E6F7F1',
    100: '#C2ECDD',
    400: '#2FBB8E',
    500: '#00A676',
    600: '#00805A',
    700: '#007352',
    800: '#005A40',
  },
  ink: {
    DEFAULT: '#0E1116',
    800: '#1C2127',
    700: '#3A4048',
    500: '#6B7280',
    300: '#A8AFB8',
    200: '#D7DBE0',
    100: '#EDEFF2',
    50: '#F7F8FA',
  },
  star: '#FFB800',
  surface: {
    light: '#FFFFFF',
    lightMuted: '#F7F8FA',
    dark: '#0B0D10',
    darkMuted: '#15181D',
  },
} as const;

export const navigationTheme = {
  light: {
    background: palette.surface.light,
    card: palette.surface.light,
    text: palette.ink.DEFAULT,
    border: palette.ink[100],
    primary: palette.brand[500],
    notification: palette.brand[500],
  },
  dark: {
    background: palette.surface.dark,
    card: palette.surface.dark,
    text: '#FFFFFF',
    border: '#22262C',
    primary: palette.brand[500],
    notification: palette.brand[500],
  },
} as const;
