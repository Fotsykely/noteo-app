import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useColors } from '@/hooks/use-theme';
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
  { href: '/search', label: 'Rechercher', icon: 'search-outline', iconActive: 'search' },
  { href: '/explore', label: 'Classements', icon: 'trophy-outline', iconActive: 'trophy' },
  { href: '/add', label: 'Noter un lieu', icon: 'star-outline', iconActive: 'star' },
  { href: '/profile', label: 'Profil', icon: 'person-outline', iconActive: 'person' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/**
 * Navigation latérale des grands écrans. Elle remplace la barre d'onglets du bas,
 * masquée sur desktop : voir `src/app/(tabs)/_layout.tsx`.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const colors = useColors();

  return (
    <View className="w-60 shrink-0 px-3 py-4">
      {/* Marque */}
      <View className="flex-row items-center gap-2 px-3 pb-6">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
          <Ionicons name="star" size={17} color="#FFFFFF" />
        </View>
        <Text className="text-xl font-bold tracking-tight text-ink dark:text-white">Noteo</Text>
      </View>

      {/* Navigation */}
      <View className="gap-1">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Pressable
              key={item.href}
              onPress={() => router.navigate(item.href as never)}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              className={cn(
                'h-11 flex-row items-center gap-3.5 rounded-xl px-3',
                active
                  ? 'bg-ink-100 dark:bg-white/10'
                  : 'active:bg-ink-50 dark:active:bg-white/5'
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
            </Pressable>
          );
        })}
      </View>

      {/* Ville active */}
      <View className="mt-auto gap-3 px-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="location" size={15} color={colors.brand} />
          <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">Antananarivo</Text>
        </View>
        <Text className="text-xs leading-4 text-ink-300 dark:text-ink-500">
          Les avis sont publics et modérés.
        </Text>
      </View>
    </View>
  );
}
