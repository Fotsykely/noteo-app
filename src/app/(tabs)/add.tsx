import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { useColors } from '@/hooks/use-theme';
import { queryPlaces } from '@/lib/places';

export default function AddScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');

  const results = useMemo(
    () => (search.length < 2 ? [] : queryPlaces(PLACES, TANA_CENTER, { search }).slice(0, 20)),
    [search]
  );

  return (
    <Screen>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-[28px] font-bold leading-8 text-ink dark:text-white">
          Noter un lieu
        </Text>
        <Text className="mt-1 text-sm text-ink-500 dark:text-ink-300">
          Cherchez l&apos;endroit où vous êtes allé.
        </Text>
        <SearchBar
          className="mt-4"
          value={search}
          onChangeText={setSearch}
          placeholder="Nom du restaurant, du cabinet, du garage…"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => <PlaceRow place={item} distanceMeters={item.distance} />}
        ListEmptyComponent={
          search.length < 2 ? (
            <EmptyState
              icon="star-outline"
              title="Commencez à taper"
              description="Deux lettres suffisent pour retrouver un lieu du catalogue."
            />
          ) : (
            <EmptyState
              icon="add-circle-outline"
              title="Ce lieu n'est pas encore référencé"
              description="Ajoutez-le pour être la première personne à le noter."
              actionLabel="Ajouter ce lieu"
              onAction={() => router.push('/place/new')}
            />
          )
        }
      />

      {/* Raccourci permanent vers l'ajout de lieu */}
      <Pressable
        onPress={() => router.push('/place/new')}
        accessibilityRole="button"
        className="flex-row items-center gap-3 border-t border-ink-100 px-5 py-4 active:opacity-70 dark:border-white/10">
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
