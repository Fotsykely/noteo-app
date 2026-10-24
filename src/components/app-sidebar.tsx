import { Ionicons } from '@expo/vector-icons';
import { Link, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useModerationQueue } from '@/hooks/use-moderation';
import { useIsModerator } from '@/hooks/use-role';
import { useColors } from '@/hooks/use-theme';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { IoniconName } from '@/types';

type NavItem = {
  href: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
};

const ITEMS: NavItem[] = [
  { href: '/', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
  {
    href: '/search',
    label: 'Rechercher',
    icon: 'search-outline',
    iconActive: 'search',
  },
  {
    href: '/explore',
    label: 'Classements',
    icon: 'trophy-outline',
    iconActive: 'trophy',
  },
  {
    href: '/add',
    label: 'Noter un lieu',
    icon: 'star-outline',
    iconActive: 'star',
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

/** Réservé aux admins et modérateurs. */
const MODERATION_ITEM: NavItem = {
  href: '/moderation',
  label: 'Modération',
  icon: 'flag-outline',
  iconActive: 'flag',
};

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** Raccourci « / » : ouvre la recherche, sauf quand on est déjà en train de saisir du texte. */
function useSearchShortcut() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      router.navigate('/search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/**
 * Navigation latérale des grands écrans. Elle remplace la barre d'onglets du bas,
 * masquée sur desktop : voir `src/app/(tabs)/_layout.tsx`.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const colors = useColors();
  const isModerator = useIsModerator();
  const toReview = useModerationQueue().data?.length ?? 0;
  const user = useSession();
  const items = isModerator ? [...ITEMS, MODERATION_ITEM] : ITEMS;
  useSearchShortcut();

  return (
    <View className="w-60 shrink-0 px-3 py-4">
      {/* Marque */}
      <Link href="/" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Noteo — accueil"
          className="mb-6 flex-row items-center gap-2 rounded-xl px-3 py-1 hover:bg-ink-100 dark:hover:bg-white/5 web:transition-colors web:duration-150">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
            <Ionicons name="star" size={17} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold tracking-tight text-ink dark:text-white">Noteo</Text>
        </Pressable>
      </Link>

      {/* Navigation */}
      <View className="gap-1" role="navigation" aria-label="Navigation principale">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link key={item.href} href={item.href as never} asChild>
              <Pressable
                accessibilityRole="link"
                {...({ 'aria-current': active ? 'page' : undefined } as object)}
                className={cn(
                  'h-11 flex-row items-center gap-3.5 rounded-xl px-3 web:transition-colors web:duration-150',
                  active
                    ? 'bg-ink-100 dark:bg-white/10'
                    : 'hover:bg-ink-100 active:bg-ink-100 dark:hover:bg-white/5 dark:active:bg-white/10'
                )}>
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={20}
                  color={active ? colors.text : colors.textMuted}
                />
                <Text
                  className={cn(
                    'text-[15px]',
                    active
                      ? 'font-semibold text-ink dark:text-white'
                      : 'font-medium text-ink-500 dark:text-ink-300'
                  )}>
                  {item.label}
                </Text>
                {item.href === '/moderation' && toReview > 0 && (
                  <View className="ml-auto min-w-5 items-center rounded-pill bg-red-600 px-1.5 py-0.5">
                    <Text className="text-[11px] font-bold text-white">{toReview}</Text>
                  </View>
                )}
              </Pressable>
            </Link>
          );
        })}
      </View>

      {/* Compte + ville active */}
      <View className="mt-auto gap-3">
        {user ? (
          <Link href="/profile" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Mon profil, ${user.name}`}
              className="flex-row items-center gap-3 rounded-xl px-3 py-2 hover:bg-ink-100 active:bg-ink-100 dark:hover:bg-white/5 dark:active:bg-white/10 web:transition-colors web:duration-150">
              <Avatar initials={user.initials} />
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-ink dark:text-white" numberOfLines={1}>
                  {user.name}
                </Text>
                <Text className="text-xs text-ink-500 dark:text-ink-300" numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            </Pressable>
          </Link>
        ) : (
          <Link href="/auth/sign-in" asChild>
            <Pressable
              accessibilityRole="link"
              className="h-11 flex-row items-center justify-center rounded-pill bg-brand-600 hover:bg-brand-700 active:bg-brand-800 web:transition-colors web:duration-150">
              <Text className="text-sm font-semibold text-white">Se connecter</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {/* Ville active */}
      <View className="mt-4 gap-3 px-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location" size={15} color={colors.brand} />
          <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">Antananarivo</Text>
        </View>
        <Text className="text-xs leading-4 text-ink-500 dark:text-ink-300">
          Les avis sont publics et modérés.
        </Text>
      </View>
    </View>
  );
}
