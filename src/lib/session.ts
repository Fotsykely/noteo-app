/**
 * Session factice de l'Étape 1 : juste de quoi construire les écrans connecté /
 * déconnecté. Elle est remplacée par Supabase Auth à l'Étape 5, en gardant la
 * même signature (`useSession`) pour limiter les retouches d'écrans.
 */
import { useSyncExternalStore } from 'react';

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
};

let currentUser: SessionUser | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function signIn(name = 'Ando R.', email = 'ando@example.mg') {
  currentUser = {
    id: 'local-user',
    name,
    email,
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join(''),
  };
  emit();
}

export function signOut() {
  currentUser = null;
  emit();
}

export function useSession(): SessionUser | null {
  return useSyncExternalStore(
    subscribe,
    () => currentUser,
    () => null
  );
}
