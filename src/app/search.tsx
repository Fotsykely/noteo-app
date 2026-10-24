import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui/category-chip';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { CATEGORIES } from '@/constants/categories';
import { useIsDesktop } from '@/hooks/use-breakpoint';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useNearbyPlaces } from '@/hooks/use-places';
import { useColors } from '@/hooks/use-theme';
import { showScrollbar } from '@/lib/utils';
import type { CategorySlug } from '@/types';
import { goBack } from '@/lib/navigation';

const SUGGESTIONS = ['Dentiste', 'Garage', 'Pizza', 'Pharmacie', 'Gargote', 'Carrosserie'];

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategorySlug | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim());
  const idle = search.trim().length === 0 && !category;

  const results = useNearbyPlaces(
    { search: debouncedSearch, category, includePending: true },
    { limit: 50, enabled: !idle }
  );

  return (
    <Screen>
      <Container padded={false} className="flex-row items-center gap-2 px-4 pt-2 lg:px-8 lg:pt-6">
        <Pressable
          onPress={() => goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="h-10 w-10 items-center justify-center rounded-full hover:bg-ink-50 active:opacity-60 dark:hover:bg-white/10 lg:-ml-2">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <SearchBar className="flex-1 lg:max-w-xl" value={search} onChangeText={setSearch} autoFocus />
      </Container>

      <Container className="flex-row flex-wrap gap-2 py-3">
        {CATEGORIES.map((item) => (
          <Chip
            key={item.slug}
            label={item.nameFr}
            icon={item.icon}
            selected={category === item.slug}
            onPress={() => setCategory(category === item.slug ? null : item.slug)}
          />
        ))}
      </Container>

      {idle ? (
        <Container className="pt-4">
          <Text className="text-sm font-semibold text-ink dark:text-white">
            Recherches fréquentes
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((item) => (
              <Chip key={item} label={item} onPress={() => setSearch(item)} />
            ))}
          </View>
        </Container>
      ) : results.isPending ? (
        <LoadingState />
      ) : results.isError ? (
        <ErrorState onRetry={() => results.refetch()} />
      ) : (
        <FlatList
          // Changer le nombre de colonnes exige de remonter la liste.
          key={isDesktop ? 'grille' : 'liste'}
          data={results.data}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          numColumns={isDesktop ? 2 : 1}
          columnWrapperStyle={isDesktop ? { gap: 16 } : undefined}
          showsVerticalScrollIndicator={showScrollbar}
          contentContainerStyle={{
            paddingBottom: 24,
            width: '100%',
            maxWidth: 1280,
            alignSelf: 'center',
            // 16 + les 16 px de `PlaceRow` = la gouttière de 32 px du reste de l'écran.
            paddingHorizontal: isDesktop ? 16 : 0,
          }}
          renderItem={({ item }) => (
            <View className={isDesktop ? 'flex-1' : undefined}>
              <PlaceRow place={item} distanceMeters={item.distance} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title={`Aucun résultat pour « ${search} »`}
              description="Vérifiez l'orthographe, ou ajoutez ce lieu au catalogue."
              actionLabel="Ajouter un lieu"
              onAction={() => router.push('/place/new')}
            />
          }
        />
      )}
    </Screen>
  );
}
