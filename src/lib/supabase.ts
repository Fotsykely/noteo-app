/**
 * Client Supabase unique de l'app.
 *
 * La clé publique (publishable) peut figurer dans l'app : ce sont les règles RLS
 * de la base qui protègent les données. Ne jamais utiliser ici la clé secrète.
 */
import '@/lib/local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquent : voir .env.local.'
  );
}

/**
 * Le web est pré-rendu côté serveur (`web.output: "static"`), où `localStorage`
 * n'existe pas : pas de session à conserver pendant ce rendu.
 */
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    // Sur mobile, ce localStorage vient d'expo-sqlite (voir local-storage.native.ts).
    storage: isServer ? undefined : localStorage,
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: false,
  },
});

// Mobile : ne rafraîchir la session que lorsque l'app est au premier plan.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
