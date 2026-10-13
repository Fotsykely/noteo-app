import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { ErrorState, LoadingState } from '@/components/ui/query-state';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useNearbyPlaces } from '@/hooks/use-places';
import { useColors } from '@/hooks/use-theme';

export default function AddScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebouncedValue(search.trim());
  const tooShort = search.trim().length < 2;
  const results = useNearbyPlaces(
    { search: debouncedSearch, includePending: true },
    { limit: 20, enabled: debouncedSearch.length >= 2 }
  );

  return (
    <Screen>
      <Container className="pb-3 pt-2 lg:pt-8">
        <Text className="text-[28px] font-bold leading-8 text-ink dark:text-white">
          Noter un lieu
        </Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Cherchez l&apos;endroit où vous êtes allé.
        </Text>
        <SearchBar
          className="mt-4 lg:max-w-xl"
          value={search}
          onChangeText={setSearch}
          placeholder="Nom du restaurant, du cabinet, du garage…"
        />
      </Container>

      <View className="flex-1">
        {tooShort ? (
          <EmptyState
            icon="star-outline"
            title="Commencez à taper"
            description="Deux lettres suffisent pour retrouver un lieu du catalogue."
          />
        ) : results.isPending ? (
          <LoadingState />
        ) : results.isError ? (
          <ErrorState onRetry={() => results.refetch()} />
        ) : (
          <FlatList
            data={results.data}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: 24,
              width: '100%',
              maxWidth: 1280,
              alignSelf: 'center',
            }}
            renderItem={({ item }) => <PlaceRow place={item} distanceMeters={item.distance} />}
            ListEmptyComponent={
              <EmptyState
                icon="add-circle-outline"
                title="Ce lieu n'est pas encore référencé"
                description="Ajoutez-le pour être la première personne à le noter."
                actionLabel="Ajouter ce lieu"
                onAction={() => router.push('/place/new')}
              />
            }
          />
        )}
      </View>

      {/* Raccourci permanent vers l'ajout de lieu */}
      <Pressable
        onPress={() => router.push('/place/new')}
        accessibilityRole="button"
        className="w-full max-w-[1280px] flex-row items-center gap-3 self-center border-t border-ink-100 px-5 py-4 active:opacity-70 hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/20">
          <Ionicons name="add" size={22} color={colors.brand} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink dark:text-white">
            Ajouter un lieu manquant
          </Text>
          <Text className="text-xs text-ink-500 dark:text-ink-300">
            Il sera visible après vérification.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
    </Screen>
  );
}
