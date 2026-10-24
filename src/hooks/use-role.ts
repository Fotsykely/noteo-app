import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

type Role = 'admin' | 'moderator' | 'pro';

/**
 * L'utilisateur connecté a-t-il ce rôle ? Sert seulement à adapter l'interface :
 * la base vérifie elle-même le rôle avant toute écriture (RLS).
 */
export function useHasRole(role: Role): boolean {
  const user = useSession();

  const { data } = useQuery({
    queryKey: ['role', user?.id, role],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', { p_role: role });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30 * 60_000,
  });

  return !!user && data === true;
}

/**
 * Admin ou modérateur : accès à l'écran de modération. Comme pour `useHasRole`, la base
 * vérifie elle-même le droit avant toute action.
 */
export function useIsModerator(): boolean {
  const user = useSession();

  const { data } = useQuery({
    queryKey: ['role', user?.id, 'moderator-or-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_moderator');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30 * 60_000,
  });

  return !!user && data === true;
}
