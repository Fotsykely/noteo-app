// Android et iOS n'ont pas de `localStorage` : expo-sqlite en fournit un, persistant,
// où Supabase conserve la session de connexion.
import 'expo-sqlite/localStorage/install';
