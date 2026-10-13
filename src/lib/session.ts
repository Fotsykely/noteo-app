/**
 * Session de l'utilisateur connecté, adossée à Supabase Auth.
 *
 * Même signature que la session factice de l'Étape 1 (`useSession`, `signOut`) :
 * les écrans n'ont pas eu à changer. Le nom affiché vient de la table `profiles`,
 * publique, qui est celle qu'on voit sous les avis.
 */
import type { Session } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { initials } from '@/lib/places';
import { supabase } from '@/lib/supabase';

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
};

let currentUser: SessionUser | null = null;
const listeners = new Set<() => void>();

function setUser(user: SessionUser | null) {
  currentUser = user;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function loadUser(session: Session | null) {
  if (!session) {
    setUser(null);
    return;
  }

  const { user } = session;
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.display_name ?? user.user_metadata?.full_name ?? 'Membre Noteo';
  setUser({ id: user.id, name, initials: initials(name), email: user.email ?? '' });
}

// Pas de session pendant le pré-rendu web côté serveur.
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    // Supabase déconseille d'attendre une autre requête dans ce rappel (risque de
    // blocage) : on la diffère au tour suivant.
    setTimeout(() => void loadUser(session), 0);
  });
}

/** Relit le profil après une modification (nom affiché). */
export async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  await loadUser(data.session);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function useSession(): SessionUser | null {
  return useSyncExternalStore(
    subscribe,
    () => currentUser,
    () => null
  );
}
