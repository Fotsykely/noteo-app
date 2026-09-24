import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui/category-chip';
import { EmptyState } from '@/components/ui/empty-state';
import { PlaceRow } from '@/components/ui/place-card';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { CATEGORIES } from '@/constants/categories';
import { PLACES, TANA_CENTER } from '@/data/mock';
import { useColors } from '@/hooks/use-theme';
import { queryPlaces } from '@/lib/places';
import type { CategorySlug } from '@/types';

const SUGGESTIONS = ['Dentiste', 'Garage', 'Pizza', 'Pharmacie', 'Gargote', 'Carrosserie'];

export default function SearchScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategorySlug | null>(null);

  const results = useMemo(
    () =>
      search.trim().length === 0 && !category
        ? []
        : queryPlaces(PLACES, TANA_CENTER, { search, categorySlug: category }),
    [search, category]
  );

  const idle = search.trim().length === 0 && !category;

  return (
    <Screen>
      <View className="flex-row items-center gap-2 px-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="h-10 w-10 items-center justify-center active:opacity-60">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <SearchBar className="flex-1" value={search} onChangeText={setSearch} autoFocus />
      </View>

      <View className="flex-row gap-2 px-5 py-3">
        {CATEGORIES.map((item) => (
          <Chip
            key={item.slug}
            label={item.nameFr}
            icon={item.icon}
            selected={category === item.slug}
            onPress={() => setCategory(category === item.slug ? null : item.slug)}
          />
        ))}
      </View>

      {idle ? (
        <View className="px-5 pt-4">
          <Text className="text-sm font-semibold text-ink dark:text-white">
            Recherches fréquentes
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((item) => (
              <Chip key={item} label={item} onPress={() => setSearch(item)} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => <PlaceRow place={item} distanceMeters={item.distance} />}
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
