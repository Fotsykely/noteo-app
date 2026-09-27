import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Le catalogue bouge lentement : inutile de recharger à chaque écran,
      // et c'est autant de data mobile économisée.
      staleTime: 5 * 60_000,
      retry: 2,
    },
  },
});

// Sur mobile, « revenir sur l'app » vaut retour de focus (le web le gère seul) :
// les données périmées se rafraîchissent alors.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}
